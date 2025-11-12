# Wandyhwarang

A full-stack web service for user management with CRUD operations. Built with PHP backend, MySQL database, and React frontend.

## Project Structure

```
wandyhwarang/
├── backend/           # PHP backend
│   ├── src/          # Source files
│   │   ├── BaseModel.php
│   │   ├── Router.php
│   │   ├── Models/
│   │   └── Controllers/
│   ├── public/       # Web root
│   ├── config/       # Configuration
│   ├── database/     # Database schema
│   ├── composer.json
│   └── .env.example
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── styles/
│   │   └── App.js
│   ├── public/
│   └── package.json
└── README.md
```

## Prerequisites

- PHP 7.4+ (for local development)
- MySQL 5.7+ (for local development)
- Node.js 14+ (for local development)
- npm or yarn
- Docker & Docker Compose (for containerized setup)

## Quick Start with Docker

The easiest way to get started is with Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Or use the Makefile
make build
make up
make logs
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/backend/public/api
- MySQL: localhost:3306

See [DOCKER.md](DOCKER.md) for detailed Docker documentation.

## Setup Instructions (Local Development)

### 1. Database Setup

Create the MySQL database and tables:

```bash
mysql -u root -p < backend/database/schema.sql
```

Or manually execute the schema.sql contents in your MySQL client.

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Update `.env` with your database credentials if needed.

Start the PHP development server:

```bash
php -S localhost:8000 -t public
```

The API will be available at `http://localhost:8000/api`

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file (optional):

```bash
echo "REACT_APP_API_URL=http://localhost:8000/backend/public" > .env
```

Start the React development server:

```bash
npm start
```

The UI will open at `http://localhost:3000`

## API Endpoints

### Users

- **GET** `/api/users` - Get all users
- **GET** `/api/users/{id}` - Get user by ID
- **POST** `/api/users` - Create new user
- **PUT** `/api/users/{id}` - Update user
- **DELETE** `/api/users/{id}` - Delete user

### Request/Response Format

**Create/Update User:**

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "User created successfully"
}
```

**Get User:**

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00"
  }
}
```

## Features

- ✅ CRUD operations for users
- ✅ RESTful API
- ✅ React-based UI
- ✅ Form validation
- ✅ Error handling
- ✅ Responsive design
- ✅ CORS enabled

## Development

### Adding New Models

1. Create a new model in `backend/src/Models/` extending `BaseModel`
2. Specify the table name in the model
3. Create corresponding controller in `backend/src/Controllers/`
4. Add routes in `backend/public/index.php`

### Adding New Components

1. Create components in `frontend/src/components/`
2. Create corresponding styles in `frontend/src/styles/`
3. Import and use in `frontend/src/App.js` or other components

## Troubleshooting

**Database connection error:**
- Ensure MySQL is running
- Check database credentials in `backend/.env`
- Verify database exists

**CORS errors:**
- CORS is already enabled in the API
- Check that both frontend and backend URLs are correctly configured

**Port already in use:**
- For PHP: `php -S localhost:8001 -t public`
- For React: `PORT=3001 npm start`

## License

MIT
