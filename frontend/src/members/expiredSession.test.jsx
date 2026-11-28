import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, belts, clubs, graduations, members } from '../test/memberService';
import { completeLogin, renderApp } from '../test/renderApp';
import { server } from '../test/server';

// A save whose session can't be renewed sends the browser to the Keycloak login. What was
// typed survives that trip: the form comes back filled in, and nothing is sent until the
// person clicks again.

const created = {
  id: '66666666-6666-6666-6666-666666666666',
  firstName: 'Lotte',
  lastName: 'Jensen',
  address: { street: 'Havnegade 4', city: 'Randers', zipCode: '8900' },
  phone: null,
  email: 'lotte@example.com',
  dateOfBirth: null,
  clubs: [clubs.randers],
  graduation: null,
  references: [],
};

// Answers a write with 401 while `expired` is true; the default token endpoint refuses
// the renew, so the client sends the browser to the login.
function expiringWrite(method, path, { onSaved }) {
  const state = { expired: true, requests: [] };
  server.use(
    http[method](api(path), async ({ request }) => {
      state.requests.push(await request.json());
      if (state.expired) return new HttpResponse(null, { status: 401 });
      return onSaved();
    }),
  );
  return state;
}

/** Waits for the login redirect, then logs back in as `as` and returns renderApp's result. */
async function logInAgain(first, as) {
  await waitFor(() => expect(first.navigator.urls).toHaveLength(1));
  first.unmount(); // the browser leaves the page: React never runs its cleanup
  return completeLogin(first.navigator, { as });
}

test('an expired session while creating a Member brings the form back filled in, and nothing is sent again by itself', async () => {
  const save = expiringWrite('post', '/members', { onSaved: () => HttpResponse.json(created, { status: 201 }) });
  server.use(http.get(api(`/members/${created.id}`), () => HttpResponse.json(created)));
  const first = renderApp('/members/new', { as: 'admin' });

  await first.user.type(await screen.findByLabelText('Fornavn'), 'Lotte');
  await first.user.type(screen.getByLabelText('Efternavn'), 'Jensen');
  await first.user.type(screen.getByLabelText('Vej'), 'Havnegade 4');
  await first.user.type(screen.getByLabelText('Postnummer'), '8900');
  await first.user.type(screen.getByLabelText('By'), 'Randers');
  await first.user.type(screen.getByLabelText('E-mail'), 'lotte@example.com');
  await first.user.click(screen.getByRole('checkbox', { name: 'Randers Taekwondo Klub' }));
  await first.user.selectOptions(screen.getByLabelText('Rolle'), 'instructor');
  await first.user.click(screen.getByRole('button', { name: 'Opret medlem' }));

  const { user } = await logInAgain(first, 'admin');

  expect(await screen.findByRole('heading', { level: 2, name: 'Nyt medlem' })).toBeInTheDocument();
  expect(await screen.findByLabelText('Fornavn')).toHaveValue('Lotte');
  expect(screen.getByLabelText('E-mail')).toHaveValue('lotte@example.com');
  expect(screen.getByRole('checkbox', { name: 'Randers Taekwondo Klub' })).toBeChecked();
  expect(screen.getByLabelText('Rolle')).toHaveValue('instructor');
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Din session udløb, før oplysningerne blev gemt. Tjek dem, og klik på "Opret medlem" igen.',
  );
  expect(save.requests).toHaveLength(1);

  save.expired = false;
  await user.click(screen.getByRole('button', { name: 'Opret medlem' }));

  expect(await screen.findByRole('heading', { level: 2, name: 'Lotte Jensen' })).toBeInTheDocument();
  expect(save.requests).toHaveLength(2);
  expect(save.requests[1]).toEqual(save.requests[0]);
});

test('once a Member is created, the new Member form starts empty again', async () => {
  const save = expiringWrite('post', '/members', { onSaved: () => HttpResponse.json(created, { status: 201 }) });
  server.use(http.get(api(`/members/${created.id}`), () => HttpResponse.json(created)));
  const first = renderApp('/members/new', { as: 'admin' });
  await first.user.type(await screen.findByLabelText('Fornavn'), 'Lotte');
  await first.user.type(screen.getByLabelText('Efternavn'), 'Jensen');
  await first.user.type(screen.getByLabelText('Vej'), 'Havnegade 4');
  await first.user.type(screen.getByLabelText('Postnummer'), '8900');
  await first.user.type(screen.getByLabelText('By'), 'Randers');
  await first.user.type(screen.getByLabelText('E-mail'), 'lotte@example.com');
  await first.user.click(screen.getByRole('checkbox', { name: 'Randers Taekwondo Klub' }));
  await first.user.click(screen.getByRole('button', { name: 'Opret medlem' }));
  const again = await logInAgain(first, 'admin');
  save.expired = false;
  await again.user.click(await screen.findByRole('button', { name: 'Opret medlem' }));
  await screen.findByRole('heading', { level: 2, name: 'Lotte Jensen' });
  again.unmount();
  window.history.replaceState(null, '', '/members/new'); // off the login callback's ?code&state URL

  renderApp('/members/new', { as: 'admin' });

  expect(await screen.findByLabelText('Fornavn')).toHaveValue('');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('a save that fails for another reason does not come back on the next visit', async () => {
  server.use(http.post(api('/members'), () => HttpResponse.json({}, { status: 409 })));
  const first = renderApp('/members/new', { as: 'admin' });
  await first.user.type(await screen.findByLabelText('Fornavn'), 'Lotte');
  await first.user.type(screen.getByLabelText('Efternavn'), 'Jensen');
  await first.user.type(screen.getByLabelText('Vej'), 'Havnegade 4');
  await first.user.type(screen.getByLabelText('Postnummer'), '8900');
  await first.user.type(screen.getByLabelText('By'), 'Randers');
  await first.user.type(screen.getByLabelText('E-mail'), 'lotte@example.com');
  await first.user.click(screen.getByRole('checkbox', { name: 'Randers Taekwondo Klub' }));
  await first.user.click(screen.getByRole('button', { name: 'Opret medlem' }));
  await screen.findByRole('alert');
  first.unmount();

  renderApp('/members/new', { as: 'admin' });

  expect(await screen.findByLabelText('Fornavn')).toHaveValue('');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test("an expired session while editing a Member brings back the edited details", async () => {
  let mads = members.mads;
  server.use(http.get(api(`/members/${mads.id}`), () => HttpResponse.json(mads)));
  const save = expiringWrite('put', `/members/${mads.id}`, {
    onSaved: () => HttpResponse.json((mads = { ...mads, address: { ...mads.address, street: 'Lillegade 7' } })),
  });
  const first = renderApp(`/members/${mads.id}/edit`, { as: 'instructor' });
  await first.user.clear(await screen.findByLabelText('Vej'));
  await first.user.type(screen.getByLabelText('Vej'), 'Lillegade 7');
  await first.user.click(screen.getByRole('button', { name: 'Gem' }));

  const { user } = await logInAgain(first, 'instructor');

  expect(await screen.findByLabelText('Vej')).toHaveValue('Lillegade 7');
  expect(screen.getByRole('alert')).toHaveTextContent('klik på "Gem" igen');
  save.expired = false;
  await user.click(screen.getByRole('button', { name: 'Gem' }));
  expect(await screen.findByText('Lillegade 7, 8900 Randers')).toBeInTheDocument();
});

test('an expired session while editing the Profile reopens the edit form with the edited details', async () => {
  let profile = { ...members.mads, references: [] };
  server.use(http.get(api('/profile'), () => HttpResponse.json(profile)));
  const save = expiringWrite('put', '/profile', {
    onSaved: () => HttpResponse.json((profile = { ...profile, phone: '87654321' })),
  });
  const first = renderApp('/profile', { as: 'member' });
  await first.user.click(await screen.findByRole('button', { name: 'Rediger' }));
  await first.user.clear(screen.getByLabelText('Telefon (valgfri)'));
  await first.user.type(screen.getByLabelText('Telefon (valgfri)'), '87654321');
  await first.user.click(screen.getByRole('button', { name: 'Gem' }));

  const { user } = await logInAgain(first, 'member');

  expect(await screen.findByLabelText('Telefon (valgfri)')).toHaveValue('87654321');
  save.expired = false;
  await user.click(screen.getByRole('button', { name: 'Gem' }));
  const personal = await screen.findByRole('region', { name: 'Personlige oplysninger' });
  expect(within(personal).getByText('87654321')).toBeInTheDocument();
});

test('an expired session while correcting a Graduation reopens that Graduation with the changes', async () => {
  const mads = members.mads;
  const middle = 'graduation-2023-11-15-11';
  server.use(http.get(api(`/members/${mads.id}`), () => HttpResponse.json(mads)));
  const save = expiringWrite('put', `/members/${mads.id}/graduation/${middle}`, {
    onSaved: () =>
      HttpResponse.json({
        ...mads,
        graduation: graduations(
          { date: '2024-05-01', belt: belts.kup8, graduatedBy: [members.ida, members.ole] },
          { date: '2023-11-20', belt: belts.kup9, graduatedBy: [members.ida] },
          { date: '2023-05-01', belt: belts.kup10, graduatedBy: [members.ida] },
        ),
      }),
  });
  const first = renderApp(`/members/${mads.id}`, { as: 'instructor' });
  await first.user.click(await screen.findByRole('button', { name: 'Ret gradueringen 15. november 2023' }));
  const form = await screen.findByRole('form', { name: 'Ret graduering' });
  await first.user.clear(within(form).getByLabelText('Dato'));
  await first.user.type(within(form).getByLabelText('Dato'), '2023-11-20');
  await within(form).findByRole('option', { name: '9. Kup', selected: true });
  await first.user.click(within(form).getByRole('button', { name: 'Gem' }));

  const { user } = await logInAgain(first, 'instructor');

  const restored = await screen.findByRole('form', { name: 'Ret graduering' });
  expect(within(restored).getByLabelText('Dato')).toHaveValue('2023-11-20');
  expect(await within(restored).findByRole('option', { name: '9. Kup', selected: true })).toBeInTheDocument();
  expect(within(restored).getByRole('button', { name: 'Fjern Ida Instruktør' })).toBeInTheDocument();
  expect(within(restored).getByRole('alert')).toHaveTextContent('klik på "Gem" igen');
  expect(save.requests).toHaveLength(1);

  save.expired = false;
  await user.click(within(restored).getByRole('button', { name: 'Gem' }));
  expect(await screen.findByText('20. november 2023')).toBeInTheDocument();
  expect(save.requests[1]).toEqual(save.requests[0]);
});

test('an expired session while adding a Reference reopens the add form with the type and number', async () => {
  const kim = members.kim;
  server.use(http.get(api(`/members/${kim.id}`), () => HttpResponse.json(kim)));
  const save = expiringWrite('post', `/members/${kim.id}/reference`, {
    onSaved: () =>
      HttpResponse.json(
        { ...kim, references: [{ id: 'reference-new', type: 'KukkiWon', reference: '05987654' }] },
        { status: 201 },
      ),
  });
  const first = renderApp(`/members/${kim.id}`, { as: 'instructor' });
  const section = () => screen.getByRole('region', { name: 'Referencer' });
  await first.user.click(await screen.findByRole('button', { name: 'Tilføj reference' }));
  await first.user.selectOptions(within(section()).getByLabelText('Type'), 'Kukkiwon');
  await first.user.type(within(section()).getByLabelText('Nummer'), '05987654');
  await first.user.click(within(section()).getByRole('button', { name: 'Gem' }));

  const { user } = await logInAgain(first, 'instructor');

  expect(await screen.findByLabelText('Nummer')).toHaveValue('05987654');
  expect(within(section()).getByLabelText('Type')).toHaveValue('KukkiWon');
  expect(within(section()).getByRole('alert')).toHaveTextContent('klik på "Gem" igen');
  expect(save.requests).toHaveLength(1);

  save.expired = false;
  await user.click(within(section()).getByRole('button', { name: 'Gem' }));
  expect(await within(section()).findByText('05987654')).toBeInTheDocument();
  expect(save.requests[1]).toEqual(save.requests[0]);
});
