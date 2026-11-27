import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { api, clubs } from '../test/memberService';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

test('the Clubs page lists the Clubs from member-service, sent with the bearer token', async () => {
  let authorization;
  server.use(
    http.get(api('/clubs'), ({ request }) => {
      authorization = request.headers.get('Authorization');
      return HttpResponse.json([clubs.randers, clubs.aarhus]);
    }),
  );

  const { accessToken } = renderApp('/clubs', { as: 'member' });

  expect(await screen.findByRole('heading', { name: 'Klubber' })).toBeInTheDocument();
  const items = await screen.findAllByRole('listitem');
  expect(items.map((item) => item.textContent)).toEqual([
    expect.stringContaining('Randers Taekwondo Klub'),
    expect.stringContaining('Taekwondoklubben Hwa Rang Aarhus'),
  ]);
  expect(screen.getByText(/Mariagervej 180, 8920 Randers/)).toBeInTheDocument();
  expect(authorization).toBe(`Bearer ${accessToken}`);
});

test('the header links to the Clubs page', async () => {
  const { user } = renderApp('/', { as: 'instructor' });

  await user.click(await screen.findByRole('link', { name: 'Klubber' }));

  expect(await screen.findByText('Midtdjurs Taekwondo Klub')).toBeInTheDocument();
});
