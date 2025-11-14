.PHONY: help build-dev build-prod up-dev up-prod down-dev down-prod logs clean test shell-php shell-mysql status

help:
	@echo "Wandyhwarang Docker Commands"
	@echo "=============================="
	@echo ""
	@echo "DEVELOPMENT (Separate containers for debugging)"
	@echo "  make build-dev      - Build dev images"
	@echo "  make up-dev         - Start dev services (PHP, React, MySQL separate)"
	@echo "  make down-dev       - Stop dev services"
	@echo "  make logs-dev       - View dev logs"
	@echo "  make shell-php      - Open PHP container shell"
	@echo "  make shell-mysql    - Open MySQL container shell"
	@echo ""
	@echo "PRODUCTION (Single app container with both PHP and React)"
	@echo "  make build-prod     - Build production image (includes React build)"
	@echo "  make up-prod        - Start production services"
	@echo "  make down-prod      - Stop production services"
	@echo "  make logs-prod      - View production logs"
	@echo ""
	@echo "GENERAL"
	@echo "  make test           - Run test suites"
	@echo "  make clean          - Remove all containers and volumes"
	@echo "  make status         - Show container status"
	@echo ""

# Development targets
build-dev:
	docker-compose -f docker-compose.dev.yml build

up-dev:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment is ready:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend: http://localhost:8000"
	@echo "  MySQL: localhost:3306"

down-dev:
	docker-compose -f docker-compose.dev.yml down

logs-dev:
	docker-compose -f docker-compose.dev.yml logs -f

# Production targets
build-prod:
	docker-compose -f docker-compose.prod.yml build

up-prod:
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Production environment is ready:"
	@echo "  Application: http://localhost"
	@echo "  API: http://localhost/api"
	@echo "  MySQL: localhost:3306"

down-prod:
	docker-compose -f docker-compose.prod.yml down

logs-prod:
	docker-compose -f docker-compose.prod.yml logs -f

# Testing
test:
	@echo "Running PHP tests..."
	cd backend && composer test
	@echo ""
	@echo "Running React tests..."
	cd frontend && npm test

# Shell access
shell-php:
	docker-compose -f docker-compose.dev.yml exec php sh

shell-mysql:
	docker-compose -f docker-compose.dev.yml exec mysql mysql -u wandyhwarang -pwandhywarang wandyhwarang

# Cleanup
clean:
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.prod.yml down -v
	docker system prune -f

status:
	@echo "Development services:"
	docker-compose -f docker-compose.dev.yml ps
	@echo ""
	@echo "Production services:"
	docker-compose -f docker-compose.prod.yml ps
