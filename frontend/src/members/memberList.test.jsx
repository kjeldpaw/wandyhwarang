import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, belts, clubs, graduations, members } from '../test/memberService';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

// Names in the list's rows, in order.
async function listedNames() {
  const table = await screen.findByRole('table', { name: 'Medlemmer' });
  const rows = within(table).getAllByRole('row').slice(1);
  return rows.map((row) => within(row).getAllByRole('cell')[0].textContent);
}

const clubOptions = (select) => within(select).getAllByRole('option').map((option) => option.textContent);

test("an Instructor sees the Members of their Clubs with their Clubs and current Belt, sorted by name", async () => {
  renderApp('/', { as: 'instructor' });

  expect(await screen.findByRole('heading', { name: 'Medlemmer' })).toBeInTheDocument();
  expect(await listedNames()).toEqual(['Ida Instruktør', 'Kim Larsen', 'Mads Medlem']);

  const mads = screen.getByRole('row', { name: /Mads Medlem/ });
  expect(within(mads).getByText('Randers Taekwondo Klub')).toBeInTheDocument();
  expect(within(mads).getByText('8. Kup')).toBeInTheDocument();
  const ida = screen.getByRole('row', { name: /Ida Instruktør/ });
  expect(within(ida).getByText('Midtdjurs Taekwondo Klub, Randers Taekwondo Klub')).toBeInTheDocument();
  expect(within(ida).getByText('1. Dan')).toBeInTheDocument();
  expect(within(screen.getByRole('row', { name: /Kim Larsen/ })).getByText('Intet bælte')).toBeInTheDocument();
});

test("an Instructor's Club filter offers only their own Clubs, by name, and filters the list", async () => {
  const { user } = renderApp('/', { as: 'instructor' });

  const filter = await screen.findByRole('combobox', { name: 'Klub' });
  await within(filter).findByRole('option', { name: 'Midtdjurs Taekwondo Klub' });
  expect(clubOptions(filter)).toEqual(['Alle klubber', 'Midtdjurs Taekwondo Klub', 'Randers Taekwondo Klub']);

  await user.selectOptions(filter, 'Midtdjurs Taekwondo Klub');

  expect(await listedNames()).toEqual(['Ida Instruktør', 'Kim Larsen']);
});

test('the list can be searched by first name, last name or full name', async () => {
  const { user } = renderApp('/', { as: 'instructor' });
  const search = await screen.findByRole('searchbox', { name: 'Søg på navn' });
  await listedNames();

  await user.type(search, 'LARS');
  expect(await listedNames()).toEqual(['Kim Larsen']);

  await user.clear(search);
  await user.type(search, 'mads med');
  expect(await listedNames()).toEqual(['Mads Medlem']);

  await user.clear(search);
  await user.type(search, 'nobody');
  expect(await screen.findByText('Ingen medlemmer matcher.')).toBeInTheDocument();
});

test('an Admin sees the Members of all Clubs and can filter by any Club, offered by name', async () => {
  const { user } = renderApp('/', { as: 'admin' });

  expect(await listedNames()).toEqual(['Anne Admin', 'Sofie Berg', 'Ole Hansen', 'Ida Instruktør', 'Kim Larsen', 'Mads Medlem']);
  const filter = screen.getByRole('combobox', { name: 'Klub' });
  await within(filter).findByRole('option', { name: 'Nordjysk Taekwondo Center' });
  expect(clubOptions(filter)).toEqual([
    'Alle klubber',
    'Midtdjurs Taekwondo Klub',
    'Nordjysk Taekwondo Center',
    'Randers Taekwondo Klub',
    'Taekwondoklubben Hwa Rang Aarhus',
  ]);

  await user.selectOptions(filter, 'Taekwondoklubben Hwa Rang Aarhus');

  expect(await listedNames()).toEqual(['Anne Admin', 'Sofie Berg']);
});

test('Belt names are shown normalised, and as returned when they have no grade', async () => {
  const kid = { ...members.kim, graduation: graduations({ date: '2024-01-01', belt: belts.mon9, graduatedBy: [] }) };
  const odd = {
    ...members.sofie,
    clubs: [clubs.randers],
    graduation: graduations({ date: '2024-01-01', belt: { ...belts.kup1, name: 'Special belt' }, graduatedBy: [] }),
  };
  server.use(http.get(api('/members'), () => HttpResponse.json([kid, odd])));

  renderApp('/', { as: 'instructor' });

  expect(await screen.findByText('9. Mon')).toBeInTheDocument();
  expect(screen.getByText('Special belt')).toBeInTheDocument();
});

test("opening a Member in the list shows the Member's detail page", async () => {
  const { user } = renderApp('/', { as: 'instructor' });

  await user.click(await screen.findByRole('link', { name: 'Kim Larsen' }));

  expect(await screen.findByRole('heading', { level: 2, name: 'Kim Larsen' })).toBeInTheDocument();
});

test('the header links to the Member list', async () => {
  const { user } = renderApp('/clubs', { as: 'instructor' });

  await user.click(await screen.findByRole('link', { name: 'Medlemmer' }));

  expect(await listedNames()).toContain('Kim Larsen');
});

test('the list shows a loading indicator, then a translated error if member-service fails', async () => {
  server.use(http.get(api('/members'), () => new HttpResponse(null, { status: 500 })));

  renderApp('/', { as: 'instructor' });

  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(await screen.findByRole('alert')).toHaveTextContent('member-service fejlede. Prøv igen senere.');
});

test('a plain Member is taken straight to their own profile, without a Member list', async () => {
  renderApp('/', { as: 'member' });

  expect(await screen.findByRole('heading', { level: 2, name: 'Mads Medlem' })).toBeInTheDocument();
  expect(screen.queryByRole('table', { name: 'Medlemmer' })).not.toBeInTheDocument();
  const nav = screen.getByRole('navigation');
  expect(within(nav).queryByRole('link', { name: 'Medlemmer' })).not.toBeInTheDocument();
  expect(within(nav).getByRole('link', { name: 'Min profil' })).toHaveAttribute('href', `/members/${members.mads.id}`);
});
