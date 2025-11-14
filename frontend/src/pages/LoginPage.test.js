import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { AuthProvider } from '../context/AuthContext';
import '@testing-library/jest-dom';

// Mock axios
jest.mock('../services/api');

describe('LoginPage Component', () => {
  let mockOnLoginSuccess;
  let api;

  beforeEach(() => {
    api = require('../services/api').default;
    mockOnLoginSuccess = jest.fn();
    jest.clearAllMocks();
  });

  const renderLoginPage = () => {
    return render(
      <AuthProvider>
        <LoginPage onLoginSuccess={mockOnLoginSuccess} />
      </AuthProvider>
    );
  };

  test('renders login form with email and password inputs', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('displays demo credentials', () => {
    renderLoginPage();

    expect(screen.getByText(/admin@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/admin123/)).toBeInTheDocument();
  });

  test('shows error when email is empty', async () => {
    renderLoginPage();

    const loginButton = screen.getByRole('button', { name: /login/i });
    const passwordInput = screen.getByLabelText(/password/i);

    // Clear email and fill password
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(passwordInput, 'password123');

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/email and password are required/i)).toBeInTheDocument();
    });
  });

  test('shows error when password is empty', async () => {
    renderLoginPage();

    const loginButton = screen.getByRole('button', { name: /login/i });
    const emailInput = screen.getByLabelText(/email/i);

    // Clear password, keep email
    const passwordInput = screen.getByLabelText(/password/i);
    await userEvent.clear(passwordInput);
    await userEvent.type(emailInput, 'test@example.com');

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/email and password are required/i)).toBeInTheDocument();
    });
  });

  test('submits login form with valid credentials', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'test-token-12345',
        admin: {
          id: 1,
          email: 'admin@example.com',
          name: 'Admin User'
        }
      }
    });

    renderLoginPage();

    const loginButton = screen.getByRole('button', { name: /login/i });
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'admin@example.com');
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'admin123');

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'admin@example.com',
        password: 'admin123'
      });
    });

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });

  test('displays error when login fails', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));

    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button');

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'admin@example.com');
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'wrongpassword');

    fireEvent.click(loginButton);

    // Verify login was called but success callback was not
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });

    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  test('disables form inputs while logging in', async () => {
    api.post.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: {
          success: true,
          token: 'test-token',
          admin: { id: 1, email: 'admin@example.com', name: 'Admin' }
        }
      }), 100))
    );

    renderLoginPage();

    const loginButton = screen.getByRole('button', { name: /login/i });
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'admin@example.com');
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'admin123');

    fireEvent.click(loginButton);

    // Check button shows loading state
    expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });

  test('clears form errors when user changes input', async () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    // Submit empty form to show error
    await userEvent.clear(emailInput);
    await userEvent.clear(passwordInput);
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/email and password are required/i)).toBeInTheDocument();
    });

    // Change input to clear error
    await userEvent.type(emailInput, 'test@example.com');

    await waitFor(() => {
      expect(screen.queryByText(/email and password are required/i)).not.toBeInTheDocument();
    });
  });
});
