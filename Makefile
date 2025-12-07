.PHONY: help build up down logs clean restart test prod

help:
	@echo "Wandyhwarang Docker Commands"
	@echo "=============================="
	@echo "make build       - Build Docker images"
	@echo "make up          - Start all services"
	@echo "make down        - Stop all services"
	@echo "make restart     - Restart all services"
	@echo "make logs        - View service logs"
	@echo "make logs-php    - View PHP logs"
	@echo "make logs-mysql  - View MySQL logs"
	@echo "make logs-react  - View React logs"
	@echo "make clean       - Remove containers and volumes"
	@echo "make test        - Run tests"
	@echo "make shell-php   - Open PHP container shell"
	@echo "make shell-mysql - Open MySQL container shell"
	@echo "make prod        - Build production zip file for deployment"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-php:
	docker-compose logs -f php

logs-mysql:
	docker-compose logs -f mysql

logs-react:
	docker-compose logs -f react

clean:
	docker-compose down -v
	docker system prune -f

test:
	docker-compose exec php php -v

shell-php:
	docker-compose exec php sh

shell-mysql:
	docker-compose exec mysql mysql -u wandyhwarang -pwandhywarang wandyhwarang

status:
	docker-compose ps

prod:
	@echo "Building production package..."
	@echo "Step 1: Building React frontend..."
	cd frontend && npm ci && npm run build
	@echo "Step 2: Installing PHP dependencies (production)..."
	cd backend && composer install --no-dev --optimize-autoloader
	@echo "Step 3: Creating production zip file..."
	@mkdir -p dist
	@rm -f dist/wandyhwarang-prod.zip
	zip -r dist/wandyhwarang-prod.zip \
		backend/public \
		backend/src \
		backend/database \
		backend/composer.json \
		backend/composer.lock \
		backend/.env.example \
		frontend/build \
		.env.example \
		README.md \
		DEPLOYMENT.md \
		-x "*.DS_Store" "*.git*" "*.idea*" "*node_modules*" "*vendor*" "*tests*" "*.phpunit.cache*"
	@echo "Step 4: Reinstalling dev dependencies..."
	cd backend && composer install
	@echo ""
	@echo "Production package created: dist/wandyhwarang-prod.zip"
	@echo "Ready to upload to your hosting partner!"
