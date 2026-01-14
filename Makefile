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
	@echo "Step 3: Creating production directory structure..."
	@mkdir -p dist/webroots
	@rm -rf dist/webroots/*
	@echo "Step 4: Copying files to /webroots structure..."
	@cp -r frontend/build/* dist/webroots/
	@cp -r backend/public/* dist/webroots/
	@cp -r backend/src dist/webroots/
	@cp -r backend/database dist/webroots/
	@cp -r backend/vendor dist/webroots/
	@cp backend/composer.json dist/webroots/
	@cp backend/composer.lock dist/webroots/
	@cp backend/config.php.example dist/webroots/config.php.example
	@cp debug.php dist/webroots/debug.php
	@cp .htaccess dist/webroots/.htaccess
	@cp README.md dist/webroots/
	@cp DEPLOYMENT.md dist/webroots/
	@cp ONE.COM-DEPLOYMENT.md dist/webroots/ONE.COM-DEPLOYMENT.md
	@echo "Step 5: Creating production zip file..."
	@rm -f dist/wandyhwarang-prod.zip
	cd dist && zip -r wandyhwarang-prod.zip webroots \
		-x "*.DS_Store" "*.git*" "*.idea*" "*node_modules*" "*tests*" "*.phpunit.cache*"
	@echo "Step 6: Cleaning up staging directory..."
	@rm -rf dist/webroots
	@echo "Step 7: Reinstalling dev dependencies..."
	cd backend && composer install
	@echo ""
	@echo "Production package created: dist/wandyhwarang-prod.zip"
	@echo "Extract and upload the 'webroots' folder to your server!"
	@echo "Note: Remember to create config.php from config.php.example with your settings"
