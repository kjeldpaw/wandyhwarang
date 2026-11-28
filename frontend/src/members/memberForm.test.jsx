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
  expect(screen.getByRole('status')).toHaveTextContent(
    'Medlem oprettet. Der er sendt en e-mail til lotte@example.com om at vælge en adgangskode.',
  );
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

test('the Member created message goes away once the Instructor leaves the page', async () => {
  onCreate();
  const { user } = renderApp('/members/new', { as: 'instructor' });
  await screen.findByRole('checkbox', { name: 'Randers Taekwondo Klub' });
  await fillRequired(user);
  await user.click(screen.getByRole('button', { name: 'Opret medlem' }));
  await screen.findByText(/Medlem oprettet/);

  const personal = screen.getByRole('region', { name: 'Personlige oplysninger' });
  await user.click(within(personal).getByRole('link', { name: 'Rediger' }));
  await user.click(await screen.findByRole('link', { name: 'Annuller' }));

  expect(await screen.findByRole('heading', { level: 2, name: 'Lotte Jensen' })).toBeInTheDocument();
  expect(screen.queryByText(/Medlem oprettet/)).not.toBeInTheDocument();
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

test('an email that already has a login tells the Instructor to contact an Admin', async () => {
  onCreate(() => HttpResponse.json({ message: 'A person with email lotte@example.com already exists' }, { status: 409 }));
  const { user } = renderApp('/members/new', { as: 'instructor' });
  await screen.findByRole('checkbox', { name: 'Randers Taekwondo Klub' });

  await fillRequired(user);
  await user.click(screen.getByRole('button', { name: 'Opret medlem' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Der findes allerede en person med denne e-mail. Kontakt en Admin for at få personen med i din klub.',
  );
  expect(screen.getByRole('heading', { level: 2, name: 'Nyt medlem' })).toBeInTheDocument();
  expect(screen.getByLabelText('Fornavn')).toHaveValue('Lotte');
});

test("an Instructor edits a Member's personal details and returns to the detail page", async () => {
  const requests = [];
  let mads = members.mads;
  server.use(
    http.get(api(`/members/${mads.id}`), () => HttpResponse.json(mads)),
    http.put(api(`/members/${mads.id}`), async ({ request }) => {
      const body = await request.json();
      requests.push(body);
      mads = { ...mads, ...body };
      return HttpResponse.json(mads);
    }),
  );
  const { user } = renderApp(`/members/${members.mads.id}`, { as: 'instructor' });

  const personal = await screen.findByRole('region', { name: 'Personlige oplysninger' });
  await user.click(within(personal).getByRole('link', { name: 'Rediger' }));

  expect(await screen.findByRole('heading', { level: 2, name: 'Rediger Mads Medlem' })).toBeInTheDocument();
  expect(screen.getByLabelText('Vej')).toHaveValue('Storegade 12');
  expect(screen.getByLabelText('E-mail')).toHaveAttribute('readonly');
  expect(screen.queryByRole('group', { name: 'Klubber' })).not.toBeInTheDocument();

  await user.clear(screen.getByLabelText('Vej'));
  await user.type(screen.getByLabelText('Vej'), 'Lillegade 7');
  await user.clear(screen.getByLabelText('Telefon (valgfri)'));
  await user.click(screen.getByRole('button', { name: 'Gem' }));

  expect(await screen.findByText('Lillegade 7, 8900 Randers')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Mads Medlem' })).toBeInTheDocument();
  expect(requests).toEqual([
    {
      firstName: 'Mads',
      lastName: 'Medlem',
      address: { street: 'Lillegade 7', city: 'Randers', zipCode: '8900' },
      phone: null,
      email: members.mads.email,
      dateOfBirth: '2010-04-01',
    },
  ]);
});

test('the edit form validates like the create form', async () => {
  const { user } = renderApp(`/members/${members.mads.id}/edit`, { as: 'admin' });

  await user.clear(await screen.findByLabelText('Efternavn'));
  await user.click(screen.getByRole('button', { name: 'Gem' }));

  expect(screen.getByLabelText('Efternavn')).toHaveAccessibleDescription('Skal udfyldes.');
  // No PUT handler: a request would fail the test (MSW rejects unhandled requests).
});

test('a plain Member is not offered to edit their profile', async () => {
  renderApp(`/members/${members.mads.id}`, { as: 'member' });

  const personal = await screen.findByRole('region', { name: 'Personlige oplysninger' });
  expect(within(personal).queryByRole('link', { name: 'Rediger' })).not.toBeInTheDocument();
});

test('a plain Member who opens the edit page of their own profile gets no form', async () => {
  renderApp(`/members/${members.mads.id}/edit`, { as: 'member' });

  expect(await screen.findByRole('alert')).toHaveTextContent('Du har ikke adgang til dette.');
  expect(screen.queryByLabelText('Fornavn')).not.toBeInTheDocument();
});

test('a plain Member gets no create link or form', async () => {
  renderApp('/members/new', { as: 'member' });

  expect(await screen.findByRole('alert')).toHaveTextContent('Du har ikke adgang til dette.');
  expect(screen.queryByLabelText('Fornavn')).not.toBeInTheDocument();
});

test('editing a Member the Instructor cannot see shows not found', async () => {
  renderApp(`/members/${members.sofie.id}/edit`, { as: 'instructor' });

  expect(await screen.findByRole('heading', { level: 2, name: 'Ikke fundet' })).toBeInTheDocument();
});
