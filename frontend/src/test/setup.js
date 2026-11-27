import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setBrowserLanguages } from './browser';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  sessionStorage.clear();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  setBrowserLanguages(['da-DK', 'da']); // tests run in Danish unless they say otherwise
});

afterAll(() => server.close());
