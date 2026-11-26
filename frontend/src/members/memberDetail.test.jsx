import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, belts, graduations, members } from '../test/memberService';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

const region = (name) => screen.getByRole('region', { name });

// The value next to a term in a description list.
const valueOf = (container, term) => within(container).getByText(term).nextElementSibling.textContent;

function historyRows() {
  const table = within(region('Bælte og gradueringer')).getByRole('table', { name: 'Gradueringer' });
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent));
}

test("an Instructor sees a Member's full record", async () => {
  renderApp(`/members/${members.mads.id}`, { as: 'instructor' });

  expect(await screen.findByRole('heading', { level: 2, name: 'Mads Medlem' })).toBeInTheDocument();

  const personal = region('Personlige oplysninger');
  expect(valueOf(personal, 'Adresse')).toBe('Storegade 12, 8900 Randers');
  expect(valueOf(personal, 'Telefon')).toBe('12345678');
  expect(valueOf(personal, 'E-mail')).toBe('mads@example.com');
  expect(valueOf(personal, 'Fødselsdato')).toBe('1. april 2010');

  expect(within(region('Klubber')).getAllByRole('listitem').map((item) => item.firstChild.textContent)).toEqual([
    'Randers Taekwondo Klub',
  ]);

  expect(within(region('Bælte og gradueringer')).getByText('Nuværende bælte: 8. Kup')).toBeInTheDocument();
  expect(historyRows()).toEqual([
    ['1. maj 2024', '8. Kup', 'Ole Hansen, Ida Instruktør'],
    ['15. november 2023', '9. Kup', 'Ida Instruktør'],
    ['1. maj 2023', '10. Kup', 'Ida Instruktør'],
  ]);

  const references = region('Referencer');
  expect(valueOf(references, 'Wandy Wha Rang')).toBe('DK-1234');
  expect(valueOf(references, 'Kukkiwon')).toBe('05123456');
});

test('the Graduation history follows member-service’s links from the latest, not the dates', async () => {
  // A Graduation recorded later for an earlier date still comes first: member-service links it in front.
  const member = {
    ...members.kim,
    graduation: graduations(
      { date: '2020-01-01', belt: belts.kup9, graduatedBy: [members.ole] },
      { date: '2021-01-01', belt: belts.kup10, graduatedBy: [members.ole] },
    ),
  };
  server.use(http.get(api(`/members/${member.id}`), () => HttpResponse.json(member)));

  renderApp(`/members/${member.id}`, { as: 'instructor' });

  await screen.findByRole('heading', { level: 2, name: 'Kim Larsen' });
  expect(historyRows().map(([date]) => date)).toEqual(['1. januar 2020', '1. januar 2021']);
});

test('a Member without the optional details shows that they are missing', async () => {
  renderApp(`/members/${members.kim.id}`, { as: 'instructor' });

  await screen.findByRole('heading', { level: 2, name: 'Kim Larsen' });
  const personal = region('Personlige oplysninger');
  expect(valueOf(personal, 'Telefon')).toBe('Ikke oplyst');
  expect(valueOf(personal, 'Fødselsdato')).toBe('Ikke oplyst');
  const graduationsRegion = region('Bælte og gradueringer');
  expect(within(graduationsRegion).getByText('Nuværende bælte: Intet bælte endnu')).toBeInTheDocument();
  expect(within(graduationsRegion).getByText('Ingen gradueringer endnu.')).toBeInTheDocument();
  expect(within(region('Referencer')).getByText('Ingen referencer.')).toBeInTheDocument();
});

test('a Member the Instructor cannot see shows a translated not-found page', async () => {
  renderApp(`/members/${members.sofie.id}`, { as: 'instructor' });

  expect(await screen.findByRole('heading', { level: 2, name: 'Ikke fundet' })).toBeInTheDocument();
  expect(screen.getByText('Medlemmet findes ikke, eller du har ikke adgang til det.')).toBeInTheDocument();
});

test('an Admin sees a Member of any Club', async () => {
  renderApp(`/members/${members.sofie.id}`, { as: 'admin' });

  expect(await screen.findByRole('heading', { level: 2, name: 'Sofie Berg' })).toBeInTheDocument();
  expect(within(region('Klubber')).getByText('Taekwondoklubben Hwa Rang Aarhus')).toBeInTheDocument();
  expect(historyRows()).toEqual([['10. september 2022', '5. Kup', 'Ole Hansen']]);
});

test('a plain Member sees their own profile read-only, and nobody else’s', async () => {
  const first = renderApp(`/members/${members.mads.id}`, { as: 'member' });

  const article = (await screen.findByRole('heading', { level: 2, name: 'Mads Medlem' })).closest('article');
  expect(within(article).queryAllByRole('button')).toEqual([]);
  expect(within(article).queryAllByRole('link')).toEqual([]);
  first.unmount();

  renderApp(`/members/${members.kim.id}`, { as: 'member' });

  expect(await screen.findByText('Medlemmet findes ikke, eller du har ikke adgang til det.')).toBeInTheDocument();
});

test('the detail page shows a loading indicator, then a translated error if member-service is unreachable', async () => {
  server.use(http.get(api(`/members/${members.mads.id}`), () => HttpResponse.error()));

  renderApp(`/members/${members.mads.id}`, { as: 'instructor' });

  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Kan ikke få forbindelse til member-service. Prøv igen senere.',
  );
});

test('the detail page follows the chosen language', async () => {
  const { user } = renderApp(`/members/${members.mads.id}`, { as: 'instructor' });
  await screen.findByRole('heading', { level: 2, name: 'Mads Medlem' });

  await user.selectOptions(screen.getByLabelText('Sprog'), 'Deutsch');

  expect(valueOf(region('Persönliche Angaben'), 'Geburtsdatum')).toBe('1. April 2010');
  expect(within(region('Gürtel und Graduierungen')).getByText('Aktueller Gürtel: 8. Kup')).toBeInTheDocument();
});

test('an unknown page shows a translated not-found page', async () => {
  renderApp('/no-such-page', { as: 'instructor' });

  expect(await screen.findByRole('heading', { level: 2, name: 'Ikke fundet' })).toBeInTheDocument();
  expect(screen.getByText('Siden findes ikke.')).toBeInTheDocument();
});
