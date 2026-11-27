import { screen, within } from '@testing-library/react';
import { renderApp } from '../test/renderApp';

test.each(['admin', 'instructor', 'member'])('the header links the %s to their Profile', async (as) => {
  renderApp('/clubs', { as });

  const nav = await screen.findByRole('navigation');
  expect(within(nav).getByRole('link', { name: 'Min profil' })).toHaveAttribute('href', '/profile');
});
