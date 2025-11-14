# Deployment Guide - Wandyhwarang

This guide covers deploying Wandyhwarang in both development and production environments.

## Overview

The project supports two deployment modes:

1. **Development Mode** - Separate containers for easy debugging and development
   - PHP API server (port 8000)
   - React dev server (port 3000)
   - MySQL database (port 3306)

2. **Production Mode** - Single unified container with both PHP and React
   - Optimized build of React app served by Apache
   - PHP backend API
   - MySQL database (port 3306)

---

## Development Deployment

### Quick Start

```bash
# Build development images
make build-dev

# Start development services
make up-dev

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - MySQL: localhost:3306
```

### What Runs in Development

**separate containers:**
- **PHP Container** - Runs PHP built-in server for API development
  - Serves `/api/*` endpoints
  - File changes are reflected immediately (via volume mount)

- **React Container** - Runs React dev server
  - Hot reloading on code changes
  - Debugging tools enabled
  - Proxy to API: http://localhost:8000

- **MySQL Container** - Database
  - Initialized with schema.sql
  - Data persisted in named volume

### Development Commands

```bash
# View logs
make logs-dev

# Access PHP shell
make shell-php

# Access MySQL shell
make shell-mysql

# Stop services
make down-dev

# Run tests
make test
```

### Development Notes

- Frontend app runs separately, so you see compile errors immediately
- Backend API changes don't require container restart (volume mounted)
- Good for debugging and development workflow
- Uses the original `docker-compose.dev.yml`

---

## Production Deployment

### Architecture

The production setup uses a **multi-stage Docker build** that:

1. **Stage 1 (Frontend Builder)**: Node.js container
   - Builds optimized React production bundle
   - Output: `/build` directory with static files

2. **Stage 2 (App)**: PHP + Apache container
   - Includes built React app
   - Serves both static files and API endpoints
   - Single unified container
   - Optimized image size

### Quick Start

```bash
# Build production image (this takes ~2-3 minutes)
make build-prod

# Start production services
make up-prod

# Application will be available at:
# - http://localhost
# - API at: http://localhost/api
```

### Production Features

✅ **Multi-stage Build**
- React is built once during image creation
- No Node.js needed at runtime (smaller image)
- Optimized bundle included in image

✅ **Single Container**
- One app container = easier deployment
- Lower resource usage
- Simpler orchestration

✅ **Apache + PHP**
- Apache handles static file serving
- PHP processes API requests
- Rewrite rules direct traffic correctly

✅ **Environment Configuration**
- Uses environment variables
- Can be easily configured at deployment time
- Secrets managed via .env files

### Production Commands

```bash
# View logs
make logs-prod

# Stop services
make down-prod

# Check status
make status
```

---

## Configuration

### Environment Variables

Create a `.env` file (based on `.env.example`):

```bash
# Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=wandyhwarang
DB_USER=wandyhwarang
DB_PASSWORD=your-secure-password

# JWT
JWT_SECRET=your-long-random-secret-key

# MySQL Root
MYSQL_ROOT_PASSWORD=root-password
```

### Using Environment Files

**For development:**
```bash
# Edit .env for development settings
make up-dev
```

**For production:**
```bash
# Create .env with production settings
cp .env.example .env
# Edit .env with production values
make build-prod
make up-prod
```

---

## File Structure

After production build, the container includes:

```
/var/www/html/
├── public/               # Apache document root
│   ├── index.php        # PHP router
│   ├── app/             # React production build (static files)
│   │   ├── index.html
│   │   ├── js/
│   │   ├── css/
│   │   └── ...
│   └── ...
├── src/                 # PHP source code
│   ├── Controllers/
│   ├── Models/
│   ├── Middleware/
│   └── ...
├── config/              # PHP configuration
├── database/            # Database schema
└── vendor/              # PHP dependencies (from Composer)
```

---

## Routing

### Development Routing

- **React Dev Server** (port 3000)
  - Serves React app with hot reload
  - Proxies API requests to http://localhost:8000

- **PHP API Server** (port 8000)
  - Handles `/api/*` requests
  - Uses custom router in `public/index.php`

### Production Routing

Apache handles routing via `mod_rewrite`:

- **Static Files** (`/app/*`, `*.js`, `*.css`, etc.)
  - Served directly by Apache from `/public/app/`

- **API Requests** (`/api/*`)
  - Routed to PHP via `public/index.php`
  - PHP router dispatches to controllers

- **Other Requests**
  - Routed to PHP for handling (e.g., React app entry)

---

## Building and Deploying

### Local Testing of Production Build

```bash
# Build production image locally
make build-prod

# Start services
make up-prod

# Test at http://localhost
# - React app should load
# - API should be accessible at http://localhost/api

# Stop when done
make down-prod
```

### Pushing to Registry

```bash
# Build with tag
docker build -t your-registry/wandyhwarang:latest .

# Push to registry
docker push your-registry/wandyhwarang:latest
```

### Deploying to Cloud

**Docker Hub:**
```bash
docker build -t yourusername/wandyhwarang:1.0.0 .
docker push yourusername/wandyhwarang:1.0.0
```

**AWS ECR:**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t <account>.dkr.ecr.us-east-1.amazonaws.com/wandyhwarang:latest .
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/wandyhwarang:latest
```

**Kubernetes:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: wandyhwarang
spec:
  containers:
  - name: app
    image: your-registry/wandyhwarang:latest
    ports:
    - containerPort: 80
    env:
    - name: DB_HOST
      value: "mysql-service"
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password
    - name: JWT_SECRET
      valueFrom:
        secretKeyRef:
          name: jwt-secret
          key: secret
```

---

## Database Migrations

The database schema is initialized automatically from `backend/database/schema.sql`.

To modify the schema:

1. Edit `backend/database/schema.sql`
2. Rebuild the container:
   ```bash
   make clean         # Remove old volumes
   make build-prod    # Rebuild
   make up-prod       # Start fresh
   ```

---

## Troubleshooting

### Production build fails

**Check build logs:**
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
```

**Common issues:**
- Missing Composer dependencies: Ensure `backend/composer.lock` exists
- Node modules: Run `npm install` in frontend directory before building
- Port conflicts: Stop dev containers with `make down-dev`

### React app not loading

**Check Apache logs:**
```bash
docker-compose -f docker-compose.prod.yml logs app | grep apache
```

**Verify React build:**
- Check that frontend `/build` directory exists (build should create it)
- React app should be copied to `/public/app`

### API not responding

**Check PHP setup:**
```bash
docker-compose -f docker-compose.prod.yml exec app php -v
```

**Verify database connection:**
```bash
docker-compose -f docker-compose.prod.yml exec mysql mysql -u wandyhwarang -p -h mysql wandyhwarang
```

### Permission issues

Reset permissions:
```bash
docker-compose -f docker-compose.prod.yml exec app chown -R www-data:www-data /var/www/html
```

---

## Switching Between Development and Production

```bash
# Stop development
make down-dev

# Start production
make build-prod
make up-prod
```

Or vice versa:

```bash
# Stop production
make down-prod

# Start development
make build-dev
make up-dev
```

---

## Performance Tuning

### Production Optimization

**Image size:**
- Multi-stage build keeps image small (~500MB)
- Only production dependencies included
- No build tools in final image

**Caching:**
- Docker layer caching used for faster rebuilds
- PHP dependencies cached
- React build cached separately

**Runtime:**
- Apache with PHP-FPM ready (can be enabled)
- Health checks configured
- Restart policy: `unless-stopped`

---

## Security

### Production Considerations

1. **Change default secrets:**
   ```bash
   # In .env file
   JWT_SECRET=generate-a-long-random-key
   DB_PASSWORD=use-a-strong-password
   MYSQL_ROOT_PASSWORD=strong-root-password
   ```

2. **Use HTTPS:**
   - Configure reverse proxy (nginx, CloudFlare)
   - Or add SSL certificate to Apache

3. **Database security:**
   - Don't expose port 3306 in production
   - Use managed database service
   - Regular backups

4. **Environment variables:**
   - Never commit .env files
   - Use Docker secrets in Kubernetes
   - Use secrets management in cloud providers

---

## Support

For issues or questions, refer to:
- `TESTING.md` - Running tests
- `README.md` - Project overview
- Docker Compose documentation
