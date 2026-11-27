import { screen, within } from '@testing-library/react';
import { renderApp } from '../test/renderApp';

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
