### Project Overview
The Wandyhwarang project is a full-stack application for managing users and belts. It consists of a PHP backend and a React frontend.

### Build/Configuration Instructions

#### Backend (PHP)
- **Environment**: Requires PHP 7.4+ and MySQL 5.7+.
- **Setup**:
  1. Navigate to `backend/`.
  2. Run `composer install` to install dependencies.
  3. Copy `.env.example` to `.env` and configure your database credentials.
  4. Use `php -S localhost:8000 -t public` to start the development server.
- **Autoloading**: Uses PSR-4 autoloading via Composer (`App\` mapped to `src/`). A manual autoloader is also present in `backend/src/index.php` for fallback.
- **Architecture**: Follows a basic MVC-like pattern with `Models` extending `BaseModel` and `Controllers` handling requests. `Router.php` handles API routing.

#### Frontend (React)
- **Environment**: Requires Node.js 14+ and npm.
- **Setup**:
  1. Navigate to `frontend/`.
  2. Run `npm install` to install dependencies.
  3. Start the development server with `npm start`.
- **Proxy**: The frontend is configured to proxy requests to `http://localhost:8000` via `package.json`.

#### Docker
- Use `make up` or `docker-compose up -d` to start the entire stack (PHP, React, MySQL).
- Services are available at:
    - Frontend: `http://localhost:3000`
    - API: `http://localhost:8000/api`

### Testing Information

#### Backend Testing (PHPUnit)
- **Configuration**: PHPUnit is configured via `backend/phpunit.xml`. It uses a bootstrap file `backend/tests/bootstrap.php`.
- **Running Tests**:
  ```bash
  cd backend
  ./vendor/bin/phpunit
  ```
- **Adding New Tests**: Create a new test class in `backend/tests/` extending `PHPUnit\Framework\TestCase`. Ensure the file ends with `Test.php`.
- **Test Example**:
  ```php
  <?php
  namespace Tests;
  use PHPUnit\Framework\TestCase;

  class ExampleTest extends TestCase {
      public function testBasic() {
          $this->assertTrue(true);
      }
  }
  ```

#### Frontend Testing (Jest)
- **Configuration**: Uses `react-scripts test` (Jest).
- **Running Tests**:
  ```bash
  cd frontend
  npm test -- --watchAll=false
  ```
- **Adding New Tests**: Create a file with `.test.js` suffix in `frontend/src/`.
- **Test Example**:
  ```javascript
  import { render, screen } from '@testing-library/react';
  import React from 'react';

  test('simple assertion', () => {
    render(<div>Test</div>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  ```

### Additional Development Information

#### Code Style
- **PHP**: Follow PSR-12 coding standards. Use camelCase for controller methods and PascalCase for classes. Database tables and columns use snake_case.
- **JavaScript/React**: Use functional components with hooks. Follow standard ES6+ practices. camelCase for variables/functions, PascalCase for components.
- **API Response Format**: All API responses should return JSON with a `success` boolean and either `data` or `error`/`message` keys.

#### Key Directories
- `backend/src/Models`: Database logic.
- `backend/src/Controllers`: Request handling logic.
- `frontend/src/components`: Reusable UI components.
- `frontend/src/services`: API communication layer (using Axios).
