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
