.PHONY: help build up down logs clean restart test

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
