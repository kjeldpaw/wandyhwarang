import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, clubs, members } from '../test/memberService';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

const region = (name) => screen.getByRole('region', { name });
const clubsRegion = () => region('Klubber');
const listedClubs = () => within(clubsRegion()).getAllByRole('listitem').map((item) => item.firstChild.textContent);
const options = (select) => within(select).getAllByRole('option').map((option) => option.textContent);

test('an Instructor adds one of their own Clubs to a Member, and the detail page shows it', async () => {
  let added;
  server.use(
    http.put(api('/members/:id/clubs/:clubId'), ({ params }) => {
      added = params;
      return HttpResponse.json({ ...members.kim, clubs: [clubs.midtdjurs, clubs.randers] });
    }),
  );
  const { user } = renderApp(`/members/${members.kim.id}`, { as: 'instructor' });

  const picker = await within(await screen.findByRole('region', { name: 'Klubber' })).findByRole('combobox', {
    name: 'Tilføj klub',
  });
  await within(picker).findByRole('option', { name: 'Randers Taekwondo Klub' });
  // Only the Instructor's own Clubs the Member isn't in yet.
  expect(options(picker)).toEqual(['Vælg klub', 'Randers Taekwondo Klub']);

  await user.selectOptions(picker, 'Randers Taekwondo Klub');
  await user.click(within(clubsRegion()).getByRole('button', { name: 'Tilføj' }));

  await within(clubsRegion()).findByText('Randers Taekwondo Klub', { selector: 'li > span' });
  expect(added).toEqual({ id: members.kim.id, clubId: clubs.randers.id });
  expect(listedClubs()).toEqual(['Midtdjurs Taekwondo Klub', 'Randers Taekwondo Klub']);
});

test('an Instructor removes one of their own Clubs, and cannot remove a Club that is not theirs', async () => {
  const member = { ...members.kim, clubs: [clubs.midtdjurs, clubs.nordjysk] };
  let removed;
  server.use(
    http.get(api(`/members/${member.id}`), () => HttpResponse.json(member)),
    http.delete(api('/members/:id/clubs/:clubId'), ({ params }) => {
      removed = params;
      return HttpResponse.json({ ...member, clubs: [clubs.nordjysk] });
    }),
  );
  const { user } = renderApp(`/members/${member.id}`, { as: 'instructor' });

  const remove = await screen.findByRole('button', { name: 'Fjern Midtdjurs Taekwondo Klub' });
  expect(screen.queryByRole('button', { name: 'Fjern Nordjysk Taekwondo Center' })).not.toBeInTheDocument();

  await user.click(remove);

  await within(clubsRegion()).findByRole('button', { name: 'Tilføj' });
  expect(removed).toEqual({ id: member.id, clubId: clubs.midtdjurs.id });
  expect(listedClubs()).toEqual(['Nordjysk Taekwondo Center']);
});

test("removing a Member's last Club shows why it is refused", async () => {
  server.use(
    http.delete(api('/members/:id/clubs/:clubId'), () =>
      HttpResponse.json({ message: 'Member must belong to at least one Club' }, { status: 409 }),
    ),
  );
  const { user } = renderApp(`/members/${members.kim.id}`, { as: 'instructor' });

  await user.click(await screen.findByRole('button', { name: 'Fjern Midtdjurs Taekwondo Klub' }));

  expect(await within(clubsRegion()).findByRole('alert')).toHaveTextContent(
    'Et medlem skal være i mindst én klub. Tilføj en anden klub, før du fjerner denne.',
  );
  expect(listedClubs()).toEqual(['Midtdjurs Taekwondo Klub']);
});

test('a 403 from member-service on a Club change shows a translated message', async () => {
  server.use(http.put(api('/members/:id/clubs/:clubId'), () => new HttpResponse(null, { status: 403 })));
  const { user } = renderApp(`/members/${members.kim.id}`, { as: 'instructor' });

  const picker = await screen.findByRole('combobox', { name: 'Tilføj klub' });
  await within(picker).findByRole('option', { name: 'Randers Taekwondo Klub' });
  await user.selectOptions(picker, 'Randers Taekwondo Klub');
  await user.click(screen.getByRole('button', { name: 'Tilføj' }));

  expect(await within(clubsRegion()).findByRole('alert')).toHaveTextContent('Du har ikke adgang til dette.');
  expect(listedClubs()).toEqual(['Midtdjurs Taekwondo Klub']);
});

test('an Admin moves a Member to another Club: any Club can be added and any removed', async () => {
  const requests = [];
  let current = members.sofie;
  server.use(
    http.put(api('/members/:id/clubs/:clubId'), ({ params }) => {
      requests.push(['PUT', params.id, params.clubId]);
      current = { ...current, clubs: [...current.clubs, clubs.nordjysk] };
      return HttpResponse.json(current);
    }),
    http.delete(api('/members/:id/clubs/:clubId'), ({ params }) => {
      requests.push(['DELETE', params.id, params.clubId]);
      current = { ...current, clubs: current.clubs.filter((club) => club.id !== params.clubId) };
      return HttpResponse.json(current);
    }),
  );
  const { user } = renderApp(`/members/${members.sofie.id}`, { as: 'admin' });

  const picker = await screen.findByRole('combobox', { name: 'Tilføj klub' });
  await within(picker).findByRole('option', { name: 'Nordjysk Taekwondo Center' });
  expect(options(picker)).toEqual([
    'Vælg klub',
    'Midtdjurs Taekwondo Klub',
    'Nordjysk Taekwondo Center',
    'Randers Taekwondo Klub',
  ]);

  await user.selectOptions(picker, 'Nordjysk Taekwondo Center');
  await user.click(screen.getByRole('button', { name: 'Tilføj' }));
  await user.click(await screen.findByRole('button', { name: 'Fjern Taekwondoklubben Hwa Rang Aarhus' }));

  await within(clubsRegion()).findByRole('option', { name: 'Taekwondoklubben Hwa Rang Aarhus' });
  expect(listedClubs()).toEqual(['Nordjysk Taekwondo Center']);
  expect(requests).toEqual([
    ['PUT', members.sofie.id, clubs.nordjysk.id],
    ['DELETE', members.sofie.id, clubs.aarhus.id],
  ]);
});
