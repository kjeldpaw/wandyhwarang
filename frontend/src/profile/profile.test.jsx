import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setBrowserLanguages } from '../test/browser';
import { people } from '../test/keycloak';
import { api, clubs, members } from '../test/memberService';
import { completeLogin, renderApp } from '../test/renderApp';
import { server } from '../test/server';

// Someone who can log in but has no Member record yet, so no Profile.
const newcomer = {
  sub: '77777777-7777-7777-7777-777777777777',
  given_name: 'Nina',
  family_name: 'Nielsen',
  email: 'nina@example.com',
  roles: ['default-roles-wandywharang', 'member'],
};

// Records the bodies of POST /profile and answers with `response(body)` (default: the new Member).
function onCreate(response = (body) => HttpResponse.json(newProfile(body), { status: 201 })) {
  const requests = [];
  server.use(
    http.post(api('/profile'), async ({ request }) => {
      const body = await request.json();
      requests.push(body);
      return response(body);
    }),
  );
  return requests;
}

const newProfile = ({ clubIds, ...body }) => ({
  id: newcomer.sub,
  email: newcomer.email,
  ...body,
  clubs: Object.values(clubs).filter((club) => clubIds.includes(club.id)),
  graduation: null,
  references: [],
});

// Records the bodies of PUT /profile and answers with the Profile updated from the body.
function onUpdate(profile = members.mads) {
  const requests = [];
  server.use(
    http.put(api('/profile'), async ({ request }) => {
      const body = await request.json();
      requests.push(body);
      return HttpResponse.json({ ...profile, ...body });
    }),
  );
  return requests;
}

test.each(['admin', 'instructor', 'member'])('the header links the %s to their Profile', async (as) => {
  renderApp('/clubs', { as });

  const nav = await screen.findByRole('navigation');
  expect(within(nav).getByRole('link', { name: 'Min profil' })).toHaveAttribute('href', '/profile');
});

test('a Member sees their Profile with an Edit button', async () => {
  renderApp('/profile', { as: 'member' });

  expect(await screen.findByRole('heading', { level: 2, name: 'Mads Medlem' })).toBeInTheDocument();
  const personal = screen.getByRole('region', { name: 'Personlige oplysninger' });
  expect(within(personal).getByText('Storegade 12, 8900 Randers')).toBeInTheDocument();
  expect(within(personal).getByText('12345678')).toBeInTheDocument();
  expect(within(personal).getByText('mads@example.com')).toBeInTheDocument();
  expect(within(personal).getByRole('button', { name: 'Rediger' })).toBeInTheDocument();
  const clubList = screen.getByRole('region', { name: 'Klubber' });
  expect(within(clubList).getByText('Randers Taekwondo Klub')).toBeInTheDocument();
});

test('a Member’s Profile also shows their Belt, Graduations and References, read-only', async () => {
  renderApp('/profile', { as: 'member' });

  const graduations = await screen.findByRole('region', { name: 'Bælte og gradueringer' });
  expect(within(graduations).getByText('Nuværende bælte: 8. Kup')).toBeInTheDocument();
  expect(within(graduations).queryByRole('button')).not.toBeInTheDocument();
  const references = screen.getByRole('region', { name: 'Referencer' });
  expect(within(references).getByText('DK-1234')).toBeInTheDocument();
  expect(within(references).queryByRole('button')).not.toBeInTheDocument();
});

test('a Member edits their Profile, which never sends the email', async () => {
  const requests = onUpdate();
  const { user } = renderApp('/profile', { as: 'member' });

  await user.click(await screen.findByRole('button', { name: 'Rediger' }));
  expect(screen.getByLabelText('Fornavn')).toHaveValue('Mads');
  await user.clear(screen.getByLabelText('Telefon (valgfri)'));
  await user.type(screen.getByLabelText('Telefon (valgfri)'), '87654321');
  await user.clear(screen.getByLabelText('Vej'));
  await user.type(screen.getByLabelText('Vej'), 'Lillegade 3');
  await user.click(screen.getByRole('button', { name: 'Gem' }));

  const personal = await screen.findByRole('region', { name: 'Personlige oplysninger' });
  expect(within(personal).getByText('87654321')).toBeInTheDocument();
  expect(within(personal).getByText('Lillegade 3, 8900 Randers')).toBeInTheDocument();
  expect(requests).toEqual([
    {
      firstName: 'Mads',
      lastName: 'Medlem',
      address: { street: 'Lillegade 3', city: 'Randers', zipCode: '8900' },
      phone: '87654321',
      dateOfBirth: '2010-04-01',
    },
  ]);
});

test('the email is read-only on the edit form, with a hint to ask an Instructor', async () => {
  const { user } = renderApp('/profile', { as: 'member' });

  await user.click(await screen.findByRole('button', { name: 'Rediger' }));

  const email = screen.getByLabelText('E-mail');
  expect(email).toHaveValue('mads@example.com');
  expect(email).toHaveAttribute('readonly');
  expect(email).toHaveAccessibleDescription('Kontakt din instruktør for at ændre din e-mail.');
});

test.each([
  [['en'], 'Edit', 'Email', 'Contact your Instructor to change your email.'],
  [['de'], 'Bearbeiten', 'E-Mail', 'Wende dich an deinen Instruktor, um deine E-Mail zu ändern.'],
])('the email hint is translated for %s', async (languages, editLabel, emailLabel, hint) => {
  setBrowserLanguages(languages);
  const { user } = renderApp('/profile', { as: 'member' });

  await user.click(await screen.findByRole('button', { name: editLabel }));

  expect(screen.getByLabelText(emailLabel)).toHaveAccessibleDescription(hint);
});

test('cancelling the edit form shows the Profile unchanged', async () => {
  const requests = onUpdate();
  const { user } = renderApp('/profile', { as: 'member' });

  await user.click(await screen.findByRole('button', { name: 'Rediger' }));
  await user.type(screen.getByLabelText('Fornavn'), 'x');
  await user.click(screen.getByRole('button', { name: 'Annuller' }));

  expect(screen.getByRole('heading', { level: 2, name: 'Mads Medlem' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Fornavn')).not.toBeInTheDocument();
  expect(requests).toEqual([]);
});

test('a failed save keeps the form and shows the error', async () => {
  server.use(http.put(api('/profile'), () => new HttpResponse(null, { status: 500 })));
  const { user } = renderApp('/profile', { as: 'member' });

  await user.click(await screen.findByRole('button', { name: 'Rediger' }));
  await user.click(screen.getByRole('button', { name: 'Gem' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('member-service fejlede. Prøv igen senere.');
  expect(screen.getByLabelText('Fornavn')).toHaveValue('Mads');
});

test('someone without a Profile creates one, with name and email from their login', async () => {
  const requests = onCreate();
  const { user } = renderApp('/profile', { as: newcomer });

  expect(await screen.findByRole('heading', { level: 2, name: 'Opret din profil' })).toBeInTheDocument();
  await screen.findByRole('checkbox', { name: 'Nordjysk Taekwondo Center' });
  expect(screen.getByLabelText('Fornavn')).toHaveValue('Nina');
  expect(screen.getByLabelText('Efternavn')).toHaveValue('Nielsen');
  expect(screen.getByLabelText('E-mail')).toHaveValue('nina@example.com');
  expect(screen.getByLabelText('E-mail')).toHaveAttribute('readonly');

  await user.type(screen.getByLabelText('Vej'), 'Havnegade 4');
  await user.type(screen.getByLabelText('Postnummer'), '8900');
  await user.type(screen.getByLabelText('By'), 'Randers');
  await user.click(screen.getByRole('checkbox', { name: 'Nordjysk Taekwondo Center' }));
  await user.click(screen.getByRole('checkbox', { name: 'Randers Taekwondo Klub' }));
  await user.click(screen.getByRole('button', { name: 'Opret profil' }));

  expect(await screen.findByRole('heading', { level: 2, name: 'Nina Nielsen' })).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'Klubber' })).getByText('Nordjysk Taekwondo Center')).toBeInTheDocument();
  expect(requests).toEqual([
    {
      firstName: 'Nina',
      lastName: 'Nielsen',
      address: { street: 'Havnegade 4', city: 'Randers', zipCode: '8900' },
      phone: null,
      dateOfBirth: null,
      clubIds: [clubs.nordjysk.id, clubs.randers.id],
    },
  ]);
});

test('creating a Profile needs an address and at least one Club', async () => {
  const requests = onCreate();
  const { user } = renderApp('/profile', { as: newcomer });
  await screen.findByRole('checkbox', { name: 'Randers Taekwondo Klub' });

  await user.click(screen.getByRole('button', { name: 'Opret profil' }));

  expect(screen.getByLabelText('Vej')).toHaveAccessibleDescription('Skal udfyldes.');
  expect(screen.getByRole('group', { name: 'Klubber' })).toHaveAccessibleDescription('Vælg mindst én klub.');
  expect(screen.getByLabelText('Telefon (valgfri)')).toBeValid();
  expect(requests).toEqual([]);
});

test('a conflict on create says a Profile or the email already exists', async () => {
  onCreate(() => HttpResponse.json({ message: 'Member already exists' }, { status: 409 }));
  const { user } = renderApp('/profile', { as: newcomer });
  await screen.findByRole('checkbox', { name: 'Randers Taekwondo Klub' });

  await user.type(screen.getByLabelText('Vej'), 'Havnegade 4');
  await user.type(screen.getByLabelText('Postnummer'), '8900');
  await user.type(screen.getByLabelText('By'), 'Randers');
  await user.click(screen.getByRole('checkbox', { name: 'Randers Taekwondo Klub' }));
  await user.click(screen.getByRole('button', { name: 'Opret profil' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Du har allerede en profil, eller en anden har din e-mail. Kontakt din instruktør.',
  );
});

// Logs in at Keycloak from the start page as `as`, like opening wandywharang.dk.
async function logInFromStartPage(as) {
  const first = renderApp('/', { as: null });
  await waitFor(() => expect(first.navigator.urls).toHaveLength(1));
  first.unmount();
  return completeLogin(first.navigator, { as });
}

test('a plain Member lands on their Profile after login', async () => {
  await logInFromStartPage('member');

  expect(await screen.findByRole('heading', { level: 2, name: 'Mads Medlem' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Rediger' })).toBeInTheDocument();
});

test('a plain Member without a Profile lands on the creation form after login', async () => {
  await logInFromStartPage(newcomer);

  expect(await screen.findByRole('heading', { level: 2, name: 'Opret din profil' })).toBeInTheDocument();
});

// An Admin created in Keycloak only, like the first Admin: no Member record.
const firstAdmin = { ...people.admin, sub: '88888888-8888-8888-8888-888888888888', email: 'first@example.com' };

test('an Admin without a Profile can skip creating one and use the Member list', async () => {
  const { user } = renderApp('/profile', { as: firstAdmin });

  expect(await screen.findByRole('heading', { level: 2, name: 'Opret din profil' })).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Spring over' }));

  const table = await screen.findByRole('table', { name: 'Medlemmer' });
  expect(await within(table).findByText('Kim Larsen')).toBeInTheDocument();
});

test('an Admin without a Profile lands on the Member list after login', async () => {
  await logInFromStartPage(firstAdmin);

  expect(await screen.findByRole('table', { name: 'Medlemmer' })).toBeInTheDocument();
});

test('a plain Member without a Profile is not offered to skip creating one', async () => {
  renderApp('/profile', { as: newcomer });

  await screen.findByRole('heading', { level: 2, name: 'Opret din profil' });
  expect(screen.queryByRole('link', { name: 'Spring over' })).not.toBeInTheDocument();
});
