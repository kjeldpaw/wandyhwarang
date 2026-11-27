import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, members } from '../test/memberService';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

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
