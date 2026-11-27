import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, eligible, eligibleDate, eligibleHandler } from '../test/memberService';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

// Records the URLs of the requests to member-service's Eligible list.
function recordEligibleRequests() {
  const urls = [];
  const record = ({ request }) => {
    if (new URL(request.url).pathname.endsWith('/eligible')) urls.push(new URL(request.url));
  };
  server.events.on('request:start', record);
  onTestFinished(() => server.events.removeListener('request:start', record));
  return urls;
}

async function pickDate(user, date = eligibleDate) {
  await user.type(await screen.findByLabelText('Dato for gradueringen'), date);
}

async function table() {
  return screen.findByRole('table', { name: 'Berettigede' });
}

// Names in the list's rows, in order.
async function listedNames() {
  const rows = within(await table()).getAllByRole('row').slice(1);
  return rows.map((row) => within(row).getAllByRole('cell')[0].textContent);
}

const row = (name) => screen.getByRole('row', { name: new RegExp(name) });

test.each([
  ['admin', true],
  ['instructor', true],
  ['member', false],
])('the %s sees the Berettiget menu item: %s', async (as, shown) => {
  renderApp('/profile', { as });

  const navigation = await screen.findByRole('navigation');
  await within(navigation).findByRole('link', { name: 'Min profil' });
  expect(Boolean(within(navigation).queryByRole('link', { name: 'Berettiget' }))).toBe(shown);
});

test('a plain Member reaching the page is told they have no access, and nothing is requested', async () => {
  const requests = recordEligibleRequests();
  renderApp('/eligible', { as: 'member' });

  expect(await screen.findByText('Du har ikke adgang til dette.')).toBeInTheDocument();
  expect(screen.queryByLabelText('Dato for gradueringen')).not.toBeInTheDocument();
  expect(requests).toEqual([]);
});

test('nothing is requested until a date is picked; then the list for that date is shown', async () => {
  const requests = recordEligibleRequests();
  const { user } = renderApp('/eligible', { as: 'admin' });

  expect(await screen.findByRole('heading', { name: 'Berettigede' })).toBeInTheDocument();
  expect(screen.getByLabelText('Dato for gradueringen')).toHaveValue('');
  expect(requests).toEqual([]);

  await pickDate(user);

  await table();
  expect(requests.map((url) => url.searchParams.get('date'))).toEqual([eligibleDate]);
  const columns = within(await table())
    .getAllByRole('columnheader')
    .map((header) => header.textContent);
  expect(columns).toEqual(['Navn', 'Klubber', 'Bælte', 'Gradueret', 'Næste bælte', 'Berettiget fra']);
  const cells = within(row('Emil Jensen'))
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
  expect(cells).toEqual([
    'Emil Jensen',
    'Randers Taekwondo Klub, Taekwondoklubben Hwa Rang Aarhus',
    '1. Kup',
    '10. januar 2026',
    '1. Poom',
    '10. januar 2027',
  ]);
});

test('the list is sorted by Club, then by name, and a Member of several Clubs is listed once', async () => {
  const { user } = renderApp('/eligible', { as: 'admin' });
  await pickDate(user);

  // First Clubs: Midtdjurs, Nordjysk, Randers, Taekwondoklubben Hwa Rang Aarhus
  expect(await listedNames()).toEqual(['Ida Instruktør', 'Ole Hansen', 'Emil Jensen', 'Laura Poulsen']);
});

test('the Club filter offers the Clubs in the list and shows that Club’s Members by name', async () => {
  const { user } = renderApp('/eligible', { as: 'admin' });
  await pickDate(user);
  await table();
  const filter = screen.getByRole('combobox', { name: 'Klub' });

  expect(within(filter).getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Alle klubber',
    'Midtdjurs Taekwondo Klub',
    'Nordjysk Taekwondo Center',
    'Randers Taekwondo Klub',
    'Taekwondoklubben Hwa Rang Aarhus',
  ]);

  await user.selectOptions(filter, 'Randers Taekwondo Klub');
  expect(await listedNames()).toEqual(['Ida Instruktør', 'Emil Jensen']);

  await user.selectOptions(filter, 'Taekwondoklubben Hwa Rang Aarhus');
  expect(await listedNames()).toEqual(['Emil Jensen', 'Laura Poulsen']);
});

test('an Instructor sees Eligible Members of every Club, linked only when they share a Club', async () => {
  const { user } = renderApp('/eligible', { as: 'instructor' });
  await pickDate(user);

  expect(await listedNames()).toEqual(['Ida Instruktør', 'Ole Hansen', 'Emil Jensen', 'Laura Poulsen']);
  expect(within(row('Emil Jensen')).getByRole('link', { name: 'Emil Jensen' })).toHaveAttribute(
    'href',
    `/members/${eligible.emil.id}`,
  );
  expect(within(row('Ida Instruktør')).getByRole('link', { name: 'Ida Instruktør' })).toBeInTheDocument();
  expect(within(row('Ole Hansen')).queryByRole('link')).not.toBeInTheDocument();
  expect(within(row('Laura Poulsen')).queryByRole('link')).not.toBeInTheDocument();
});

test('an Admin gets a link to every Member', async () => {
  const { user } = renderApp('/eligible', { as: 'admin' });
  await pickDate(user);
  await table();

  for (const name of ['Ida Instruktør', 'Ole Hansen', 'Emil Jensen', 'Laura Poulsen']) {
    expect(within(row(name)).getByRole('link', { name })).toBeInTheDocument();
  }
});

test('a Member Eligible only after the date, within the month allowed, has their date highlighted', async () => {
  const { user } = renderApp('/eligible', { as: 'admin' });
  await pickDate(user);
  await table();

  const later = within(row('Laura Poulsen')).getByText('Berettiget fra 1. april 2027');
  expect(later).toHaveClass('eligible-later');
  expect(within(row('Ole Hansen')).getByText('1. marts 2027')).not.toHaveClass('eligible-later');
  expect(within(row('Ole Hansen')).queryByText(/Berettiget fra/)).not.toBeInTheDocument();
});

test('Poom Belts show as n. Poom next to a red-and-black badge', async () => {
  const { user, container } = renderApp('/eligible', { as: 'admin' });
  await pickDate(user);
  await table();

  expect(within(row('Laura Poulsen')).getByText('1. Poom')).toBeInTheDocument();
  expect(within(row('Laura Poulsen')).getByText('2. Poom')).toBeInTheDocument();
  expect(container.querySelectorAll('.belt-badge.belt-red-black')).toHaveLength(3);
});

test('a date with no one Eligible shows that', async () => {
  server.use(eligibleHandler([]));
  const { user } = renderApp('/eligible', { as: 'instructor' });
  await pickDate(user);

  expect(await screen.findByText('Ingen er berettigede på denne dato.')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

test('an error from member-service is shown in the app’s words', async () => {
  server.use(http.get(api('/eligible'), () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
  const { user } = renderApp('/eligible', { as: 'instructor' });
  await pickDate(user);

  expect(await screen.findByText('member-service fejlede. Prøv igen senere.')).toBeInTheDocument();
});
