import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import AppProviders from './AppProviders';
import { createUserManager } from './auth/userManager';
import './styles/tokens.css';
import './styles/App.css';

const userManager = createUserManager();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders userManager={userManager}>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
);
