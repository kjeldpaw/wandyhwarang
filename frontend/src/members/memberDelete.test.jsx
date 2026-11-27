import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, members } from '../test/memberService';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

test('an Admin deletes a Member after confirming, and returns to the Member list', async () => {
  let deleted;
  server.use(
    http.delete(api('/members/:id'), ({ params }) => {
      deleted = params.id;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const { user } = renderApp(`/members/${members.sofie.id}`, { as: 'admin' });

  await user.click(await screen.findByRole('button', { name: 'Slet medlem' }));

  expect(deleted).toBeUndefined();
  expect(
    screen.getByText(
      'Slet Sofie Berg? Medlemmets login, gradueringer og referencer slettes også. Det kan ikke fortrydes.',
    ),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Ja, slet' }));

  expect(await screen.findByRole('table', { name: 'Medlemmer' })).toBeInTheDocument();
  expect(deleted).toBe(members.sofie.id);
});

test('an Admin can cancel deleting a Member', async () => {
  const { user } = renderApp(`/members/${members.sofie.id}`, { as: 'admin' });

  await user.click(await screen.findByRole('button', { name: 'Slet medlem' }));
  await user.click(screen.getByRole('button', { name: 'Annuller' }));

  expect(screen.queryByRole('button', { name: 'Ja, slet' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Slet medlem' })).toBeInTheDocument();
});

test('a 403 on delete shows a translated message and stays on the Member', async () => {
  server.use(http.delete(api('/members/:id'), () => new HttpResponse(null, { status: 403 })));
  const { user } = renderApp(`/members/${members.sofie.id}`, { as: 'admin' });

  await user.click(await screen.findByRole('button', { name: 'Slet medlem' }));
  await user.click(screen.getByRole('button', { name: 'Ja, slet' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Du har ikke adgang til dette.');
  expect(screen.getByRole('heading', { level: 2, name: 'Sofie Berg' })).toBeInTheDocument();
});

test('an Instructor does not see the delete action', async () => {
  renderApp(`/members/${members.kim.id}`, { as: 'instructor' });

  await screen.findByRole('button', { name: 'Fjern Midtdjurs Taekwondo Klub' });
  expect(screen.queryByRole('button', { name: 'Slet medlem' })).not.toBeInTheDocument();
});
