import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test('the shell shows the Wandy Wha Rang header on the start page', () => {
  renderAt('/');

  expect(screen.getByRole('banner')).toHaveTextContent('Wandy Wha Rang');
});
