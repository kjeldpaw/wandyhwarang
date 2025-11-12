# Docker Setup Guide

This guide explains how to use Docker Compose to run the Wandyhwarang project.

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v1.29+)

## Quick Start

### 1. Build Docker Images

```bash
docker-compose build
```

Or use the Makefile:

```bash
make build
```

### 2. Start All Services

```bash
docker-compose up -d
```

Or:

```bash
make up
```

The services will be available at:
- Frontend (React): http://localhost:3000
- Backend (PHP API): http://localhost:8000/backend/public/api
- MySQL: localhost:3306

### 3. Verify Services Are Running

```bash
docker-compose ps
```

Or:

```bash
make status
```

Expected output:
```
NAME                      COMMAND                  STATUS
wandyhwarang-mysql        "docker-entrypoint.s…"   Up (healthy)
wandyhwarang-php          "php -S 0.0.0.0:8000"    Up
wandyhwarang-react        "npm start"              Up
```

## Service Details

### MySQL Database

- **Host**: localhost:3306 (from host machine) or mysql:3306 (from containers)
- **Database**: wandyhwarang
- **Username**: wandyhwarang
- **Password**: wandyhwarang
- **Root Password**: root

The database schema is automatically initialized from `backend/database/schema.sql`

### PHP Backend

- **Image**: Custom PHP 8.1 CLI with PDO MySQL extension
- **Port**: 8000
- **Command**: `php -S 0.0.0.0:8000 -t public`
- **Volume**: ./backend mounted to /var/www

### React Frontend

- **Image**: Node 18 Alpine
- **Port**: 3000
- **Command**: `npm start` (development server)
- **Volumes**: ./frontend mounted to /app, node_modules excluded

## Common Commands

### View Logs

View all logs:
```bash
docker-compose logs -f
```

View specific service logs:
```bash
docker-compose logs -f php
docker-compose logs -f mysql
docker-compose logs -f react
```

Or use Makefile:
```bash
make logs
make logs-php
make logs-mysql
make logs-react
```

### Stop Services

```bash
docker-compose down
```

This stops and removes containers but keeps volumes.

To remove volumes as well (cleans everything):

```bash
docker-compose down -v
make clean
```

### Restart Services

```bash
docker-compose restart
make restart
```

### Access Container Shell

PHP container:
```bash
docker-compose exec php sh
make shell-php
```

MySQL container:
```bash
docker-compose exec mysql mysql -u wandyhwarang -pwandhywarang wandyhwarang
make shell-mysql
```

## Testing the API

### Using cURL

Get all users:
```bash
curl http://localhost:8000/backend/public/api/users
```

Create a user:
```bash
curl -X POST http://localhost:8000/backend/public/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

Get user by ID:
```bash
curl http://localhost:8000/backend/public/api/users/1
```

Update a user:
```bash
curl -X PUT http://localhost:8000/backend/public/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com"}'
```

Delete a user:
```bash
curl -X DELETE http://localhost:8000/backend/public/api/users/1
```

### Using the React UI

1. Open http://localhost:3000 in your browser
2. Fill in the form with user details
3. Click "Save" to create/update
4. View the user list below the form
5. Click "Edit" to modify or "Delete" to remove

## Environment Variables

### PHP/Backend

Set in docker-compose.yml or .env.docker:
- `DB_HOST`: MySQL host (default: mysql)
- `DB_PORT`: MySQL port (default: 3306)
- `DB_NAME`: Database name (default: wandyhwarang)
- `DB_USER`: Database user (default: wandyhwarang)
- `DB_PASSWORD`: Database password (default: wandyhwarang)

### React/Frontend

Set in docker-compose.yml:
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:8000/backend/public)

## Troubleshooting

### Database Connection Error

**Problem**: PHP cannot connect to MySQL

**Solution**:
1. Check MySQL is healthy: `docker-compose ps`
2. View MySQL logs: `docker-compose logs mysql`
3. Wait a few seconds (MySQL takes time to start)
4. Restart services: `docker-compose restart`

### Port Already in Use

**Problem**: Error like "Port 3000 is already allocated"

**Solution**: Edit docker-compose.yml and change the port mapping:
```yaml
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

### React Not Updating

**Problem**: Changes to React code aren't reflected

**Solution**:
1. Check volume mount is correct in docker-compose.yml
2. Restart React service: `docker-compose restart react`
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Database Data Persists After Down

**Problem**: Want to start fresh but old data remains

**Solution**:
```bash
docker-compose down -v
docker-compose up -d
```

This removes named volumes (mysql_data).

## Performance Tips

1. Use `.dockerignore` files to exclude unnecessary files
2. Keep container images small (alpine variants when possible)
3. Use named volumes for persistent data
4. Use health checks to ensure dependencies are ready

## Production Deployment

For production, consider:

1. Use environment-specific Dockerfiles
2. Add health checks and restart policies
3. Use a proper web server (Apache/Nginx) instead of PHP built-in
4. Set proper resource limits
5. Use Docker secrets for sensitive data
6. Implement logging and monitoring
7. Use tagged images instead of latest

Example for production:
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0-alpine
    restart: always
    healthcheck:
      test: ["CMD", "mysqladmin", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PHP Docker Official Image](https://hub.docker.com/_/php)
- [MySQL Docker Official Image](https://hub.docker.com/_/mysql)
- [Node Docker Official Image](https://hub.docker.com/_/node)
