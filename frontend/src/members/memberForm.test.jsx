import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, clubs, members } from '../test/memberService';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

// A new Member as member-service answers a create, then serves on GET.
const created = {
  id: '66666666-6666-6666-6666-666666666666',
  firstName: 'Lotte',
  lastName: 'Jensen',
  address: { street: 'Havnegade 4', city: 'Randers', zipCode: '8900' },
  phone: '22334455',
  email: 'lotte@example.com',
  dateOfBirth: '2012-02-29',
  clubs: [clubs.randers],
  graduation: null,
  references: null,
};

// Records the body of the next POST /members and answers with `response`.
function onCreate(response = () => HttpResponse.json(created, { status: 201 })) {
  const requests = [];
  server.use(
    http.post(api('/members'), async ({ request }) => {
      requests.push(await request.json());
      return response();
    }),
    http.get(api(`/members/${created.id}`), () => HttpResponse.json({ ...created, references: [] })),
  );
  return requests;
}

const clubChoices = () =>
  within(screen.getByRole('group', { name: 'Klubber' }))
    .getAllByRole('checkbox')
    .map((box) => box.labels[0].textContent.trim());

async function fillRequired(user, { clubName = 'Randers Taekwondo Klub' } = {}) {
  await user.type(screen.getByLabelText('Fornavn'), 'Lotte');
  await user.type(screen.getByLabelText('Efternavn'), 'Jensen');
  await user.type(screen.getByLabelText('Vej'), 'Havnegade 4');
  await user.type(screen.getByLabelText('Postnummer'), '8900');
  await user.type(screen.getByLabelText('By'), 'Randers');
  await user.type(screen.getByLabelText('E-mail'), 'lotte@example.com');
  if (clubName) await user.click(screen.getByRole('checkbox', { name: clubName }));
}

test('an Instructor creates a Member from the Member list and lands on their detail page', async () => {
  const requests = onCreate();
  const { user } = renderApp('/', { as: 'instructor' });

  await user.click(await screen.findByRole('link', { name: 'Nyt medlem' }));
  expect(await screen.findByRole('heading', { level: 2, name: 'Nyt medlem' })).toBeInTheDocument();
  await screen.findByRole('checkbox', { name: 'Randers Taekwondo Klub' });

  await fillRequired(user);
  await user.type(screen.getByLabelText('Telefon (valgfri)'), '22334455');
  await user.type(screen.getByLabelText('Fødselsdato (valgfri)'), '2012-02-29');
  await user.click(screen.getByRole('button', { name: 'Opret medlem' }));

  expect(await screen.findByRole('heading', { level: 2, name: 'Lotte Jensen' })).toBeInTheDocument();
  expect(requests).toEqual([
    {
      firstName: 'Lotte',
      lastName: 'Jensen',
      address: { street: 'Havnegade 4', city: 'Randers', zipCode: '8900' },
      phone: '22334455',
      email: 'lotte@example.com',
      dateOfBirth: '2012-02-29',
      clubIds: [clubs.randers.id],
    },
  ]);
});

test('an Instructor can only choose their own Clubs for a new Member', async () => {
  renderApp('/members/new', { as: 'instructor' });

  await screen.findByRole('checkbox', { name: 'Randers Taekwondo Klub' });
  expect(clubChoices()).toEqual(['Midtdjurs Taekwondo Klub', 'Randers Taekwondo Klub']);
});

test('an Admin can choose any Club and put a new Member in several', async () => {
  const requests = onCreate();
  const { user } = renderApp('/members/new', { as: 'admin' });

  await screen.findByRole('checkbox', { name: 'Nordjysk Taekwondo Center' });
  expect(clubChoices()).toEqual([
    'Midtdjurs Taekwondo Klub',
    'Nordjysk Taekwondo Center',
    'Randers Taekwondo Klub',
    'Taekwondoklubben Hwa Rang Aarhus',
  ]);

  await fillRequired(user, { clubName: 'Nordjysk Taekwondo Center' });
  await user.click(screen.getByRole('checkbox', { name: 'Taekwondoklubben Hwa Rang Aarhus' }));
  await user.click(screen.getByRole('button', { name: 'Opret medlem' }));

  await screen.findByRole('heading', { level: 2, name: 'Lotte Jensen' });
  expect(requests[0]).toMatchObject({ phone: null, dateOfBirth: null, clubIds: [clubs.nordjysk.id, clubs.aarhus.id] });
});

test('the create form says what is missing before anything is sent', async () => {
  const requests = onCreate();
  const { user } = renderApp('/members/new', { as: 'instructor' });
  await screen.findByRole('checkbox', { name: 'Randers Taekwondo Klub' });

  await user.type(screen.getByLabelText('Fornavn'), '   ');
  await user.click(screen.getByRole('button', { name: 'Opret medlem' }));

  for (const label of ['Fornavn', 'Efternavn', 'Vej', 'Postnummer', 'By', 'E-mail']) {
    expect(screen.getByLabelText(label)).toBeInvalid();
    expect(screen.getByLabelText(label)).toHaveAccessibleDescription('Skal udfyldes.');
  }
  expect(screen.getByLabelText('Telefon (valgfri)')).toBeValid();
  expect(screen.getByRole('group', { name: 'Klubber' })).toHaveAccessibleDescription('Vælg mindst én klub.');
  expect(requests).toEqual([]);
});

test('the create form rejects a malformed email', async () => {
  const requests = onCreate();
  const { user } = renderApp('/members/new', { as: 'instructor' });
  await screen.findByRole('checkbox', { name: 'Randers Taekwondo Klub' });

  await fillRequired(user);
  await user.clear(screen.getByLabelText('E-mail'));
  await user.type(screen.getByLabelText('E-mail'), 'lotte@');
  await user.click(screen.getByRole('button', { name: 'Opret medlem' }));

  expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Indtast en gyldig e-mail-adresse.');
  expect(screen.getByLabelText('Fornavn')).toBeValid();
  expect(screen.getByRole('group', { name: 'Klubber' })).not.toHaveAccessibleDescription();
  expect(requests).toEqual([]);

  await user.clear(screen.getByLabelText('E-mail'));
  await user.type(screen.getByLabelText('E-mail'), 'lotte@example.com');
  await user.click(screen.getByRole('button', { name: 'Opret medlem' }));
  await screen.findByRole('heading', { level: 2, name: 'Lotte Jensen' });
  expect(requests).toHaveLength(1);
});
