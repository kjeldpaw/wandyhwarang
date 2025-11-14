# Testing Guide for Wandyhwarang

This document describes how to run and write tests for the Wandyhwarang project.

## Table of Contents

- [Backend Tests (PHP)](#backend-tests-php)
- [Frontend Tests (React)](#frontend-tests-react)
- [Running All Tests](#running-all-tests)
- [Test Coverage](#test-coverage)

## Backend Tests (PHP)

### Installation

The backend uses PHPUnit for testing. Dependencies are managed through Composer.

```bash
cd backend
composer install
```

### Running Backend Tests

Run all tests:
```bash
composer test
```

Or directly with PHPUnit:
```bash
./vendor/bin/phpunit
```

Run specific test suite:
```bash
./vendor/bin/phpunit tests/AuthControllerTest.php
```

Run with verbose output:
```bash
./vendor/bin/phpunit --verbose
```

### Backend Test Structure

Tests are located in the `backend/tests/` directory.

#### AuthControllerTest.php

Tests for user authentication and JWT token management:

- **testRegistrationWithValidCredentials** - Verify successful user registration
- **testLoginWithValidCredentials** - Verify successful login with valid credentials
- **testLoginWithInvalidEmail** - Verify login fails with non-existent email
- **testLoginWithInvalidPassword** - Verify login fails with wrong password
- **testTokenVerificationWithValidToken** - Verify JWT token validation works
- **testTokenVerificationWithInvalidToken** - Verify invalid tokens are rejected
- **testTokenVerificationWithMissingHeader** - Verify missing auth header is rejected
- **testRegistrationWithDuplicateEmail** - Verify duplicate email prevention
- **testRegistrationWithMissingFields** - Verify required fields validation

#### UserControllerTest.php

Tests for user CRUD operations:

- **testGetAllUsers** - Verify retrieving all users (public endpoint)
- **testCreateUser** - Verify creating a new user (requires auth)
- **testCreateUserWithoutAuth** - Verify unauthenticated user creation fails
- **testGetUserById** - Verify retrieving a specific user
- **testGetNonExistentUser** - Verify error when user not found
- **testUpdateUser** - Verify updating user data (requires auth)
- **testUpdateUserWithoutAuth** - Verify unauthenticated update fails
- **testDeleteUser** - Verify deleting a user (requires auth)
- **testDeleteUserWithoutAuth** - Verify unauthenticated deletion fails
- **testCreateUserWithMissingFields** - Verify required fields validation
- **testCreateUserWithDuplicateEmail** - Verify duplicate email prevention

### Backend Test Coverage

The test suite uses an in-memory SQLite database for isolation and speed. Each test:

1. Sets up the database schema
2. Runs the test in isolation
3. Cleans up after itself

This ensures tests don't interfere with each other or require external infrastructure.

## Frontend Tests (React)

### Installation

The frontend uses Jest and React Testing Library. Dependencies are in package.json.

```bash
cd frontend
npm install
```

### Running Frontend Tests

Run all tests once:
```bash
npm test
```

Run tests in watch mode (re-runs on file changes):
```bash
npm run test:watch
```

Run specific test file:
```bash
npm test -- LoginPage.test.js
```

Run tests with coverage report:
```bash
npm test -- --coverage
```

### Frontend Test Structure

Tests are located in the `frontend/src/` directory next to their corresponding components.

#### LoginPage.test.js

Tests for the login page component:

- **renders login form with email and password inputs** - Verify form elements exist
- **displays demo credentials** - Verify demo credentials are shown
- **shows error when email is empty** - Verify validation message
- **shows error when password is empty** - Verify validation message
- **submits login form with valid credentials** - Verify API call and success callback
- **displays error message on login failure** - Verify error handling
- **disables form inputs while logging in** - Verify loading state
- **clears form errors when user changes input** - Verify error clearing behavior

#### AuthContext.test.js

Tests for authentication context and hooks:

**Login function tests:**
- **successful login returns success with token** - Verify token and admin state are set
- **failed login returns success false with error message** - Verify error handling
- **login without response data returns error** - Verify network error handling
- **sets loading state during login** - Verify loading state management
- **sets error message on failed login** - Verify error state

**Logout function tests:**
- **clears authentication state** - Verify complete logout cleanup

**Register function tests:**
- **successful registration returns success** - Verify successful registration
- **failed registration returns error message** - Verify error handling

**isAuthenticated state tests:**
- **returns true when token and admin exist** - Verify authenticated state
- **returns false when no token or admin** - Verify unauthenticated state
- **returns false after logout** - Verify logout updates state

**API call tests:**
- **login sends correct request to API** - Verify correct endpoint and payload
- **register sends correct request to API** - Verify correct endpoint and payload

### Frontend Test Utilities

The tests use:

- **React Testing Library** - For testing components from a user's perspective
- **Jest** - For test framework and assertions
- **@testing-library/user-event** - For simulating user interactions
- **setupTests.js** - For global test configuration and mocks

### Mocking

API calls are mocked using Jest's mock functionality:

```javascript
jest.mock('axios');
import api from '../services/api';

// Mock successful response
api.post.mockResolvedValueOnce({
  data: {
    success: true,
    token: 'test-token',
    admin: { id: 1, email: 'admin@example.com', name: 'Admin' }
  }
});

// Mock error response
api.post.mockRejectedValueOnce({
  response: {
    data: {
      error: 'Invalid credentials'
    }
  }
});
```

## Running All Tests

To run both backend and frontend tests:

```bash
# Backend tests
cd backend && composer test

# Frontend tests
cd frontend && npm test
```

Or create a Makefile target (optional):

```make
test:
	cd backend && composer test
	cd frontend && npm test
```

Then run: `make test`

## Test Coverage

### Backend Coverage Goals

- **AuthController**: 95%+ - Critical authentication logic
- **UserController**: 90%+ - Core business logic
- **Overall**: 85%+ - Comprehensive coverage

### Frontend Coverage Goals

- **Components**: 80%+ - Key user interactions
- **Context**: 90%+ - State management logic
- **Overall**: 80%+ - Good coverage of business logic

### Generating Coverage Reports

**Backend:**
```bash
cd backend
./vendor/bin/phpunit --coverage-html coverage/
```

Coverage report will be generated in `backend/coverage/` directory.

**Frontend:**
```bash
cd frontend
npm test -- --coverage
```

Coverage report will be displayed in the terminal and generated in `frontend/coverage/` directory.

## Continuous Integration

For CI/CD pipelines, use:

```bash
# Backend
composer install
composer test

# Frontend
npm install
npm test
```

Both commands exit with appropriate status codes for CI systems.

## Writing New Tests

### Backend (PHP)

1. Create a test file in `backend/tests/`
2. Extend `PHPUnit\Framework\TestCase`
3. Use `setUp()` for test initialization
4. Use descriptive test method names starting with `test`

Example:
```php
public function testFeatureWorksCorrectly()
{
    // Arrange
    $_POST = ['key' => 'value'];

    // Act
    $response = $this->controller->method();
    $decoded = json_decode($response, true);

    // Assert
    $this->assertTrue($decoded['success']);
}
```

### Frontend (React)

1. Create a `.test.js` file next to the component
2. Use React Testing Library for user-centric testing
3. Mock external dependencies (API calls)
4. Test user interactions, not implementation

Example:
```javascript
test('displays success message after form submission', async () => {
  api.post.mockResolvedValueOnce({ data: { success: true } });

  render(<MyComponent />);

  const input = screen.getByLabelText(/label/i);
  await userEvent.type(input, 'value');

  fireEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Backend Tests Fail

- Ensure Composer dependencies are installed: `composer install`
- Check PHP version is 7.4+: `php -v`
- Verify SQLite is available: `php -m | grep pdo`

### Frontend Tests Fail

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Jest cache: `npm test -- --clearCache`
- Check Node version is 14+: `node -v`

### Mock Issues

- Ensure mocks are set up before the component renders
- Clear mocks between tests: `jest.clearAllMocks()`
- Use `mockResolvedValueOnce()` for single use, `mockResolvedValue()` for multiple uses

## Resources

- [PHPUnit Documentation](https://phpunit.de/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
