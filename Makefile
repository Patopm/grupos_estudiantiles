.PHONY: help build up down logs shell-backend shell-frontend migrate collectstatic test clean format format-backend format-frontend lint lint-backend lint-frontend

help:
	@echo "Available commands:"
	@echo "  build           Build all Docker images"
	@echo "  up              Start development environment"
	@echo "  down            Stop development environment"
	@echo "  logs            Show logs from all services"
	@echo "  shell-backend   Open shell in backend container"
	@echo "  shell-frontend  Open shell in frontend container"
	@echo "  migrate         Run Django migrations"
	@echo "  createcachetable Create Django cache table"
	@echo "  collectstatic   Collect static files"
	@echo "  test            Run tests"
	@echo "  clean           Clean up Docker resources"
	@echo ""
	@echo "Code formatting and linting:"
	@echo "  format          Format both backend and frontend code"
	@echo "  format-backend  Format Python code with Black and isort"
	@echo "  format-frontend Format TypeScript/JavaScript code with Prettier"
	@echo "  lint            Lint both backend and frontend code"
	@echo "  lint-backend    Lint Python code with flake8"
	@echo "  lint-frontend   Lint TypeScript/JavaScript code with ESLint"
	@echo ""
	@echo "Security and monitoring:"
	@echo "  audit-report    Generate security audit report"
	@echo "  cleanup-audit   Clean up old audit logs"
	@echo "  monitor-security Monitor security events and rate limits"
	@echo "  clear-security-locks Clear all security locks"
	@echo ""
	@echo "Email and notifications:"
	@echo "  create-email-templates Create default email templates"
	@echo ""
	@echo "User management:"
	@echo "  cleanup-password-tokens Clean up expired password reset tokens"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

down-volumes:
	docker-compose down -v

logs:
	docker-compose logs -f

shell-backend:
	docker-compose exec backend /bin/bash

shell-frontend:
	docker-compose exec frontend /bin/sh

migrate:
	docker-compose exec backend python manage.py migrate

createcachetable:
	docker-compose exec backend python manage.py createcachetable

collectstatic:
	docker-compose exec backend python manage.py collectstatic --noinput

test:
	docker-compose exec backend python manage.py test
	docker-compose exec frontend npm test

clean:
	docker-compose down -v --rmi all --remove-orphans
	docker system prune -f

# Code formatting commands
format: format-backend format-frontend

format-backend:
	docker-compose exec backend black .
	docker-compose exec backend isort .

format-frontend:
	docker-compose exec frontend npm run format

# Linting commands
lint: lint-backend lint-frontend

lint-backend:
	docker-compose exec backend flake8 .

lint-frontend:
	docker-compose exec frontend npm run lint

# Local development commands (without Docker)
format-local: format-backend-local format-frontend-local

format-backend-local:
	cd backend && black .
	cd backend && isort .

format-frontend-local:
	cd front && npm run format

lint-local: lint-backend-local lint-frontend-local

lint-backend-local:
	cd backend && flake8 .

lint-frontend-local:
	cd front && npm run lint

# Production commands
prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

# Security and monitoring commands
audit-report:
	docker-compose exec backend python manage.py audit_report

audit-report-json:
	docker-compose exec backend python manage.py audit_report --format json

cleanup-audit:
	docker-compose exec backend python manage.py cleanup_audit_logs

cleanup-audit-dry-run:
	docker-compose exec backend python manage.py cleanup_audit_logs --dry-run

monitor-security:
	docker-compose exec backend python manage.py monitor_security

clear-security-locks:
	docker-compose exec backend python manage.py monitor_security --clear-locks

show-security-events:
	docker-compose exec backend python manage.py monitor_security --show-events

show-rate-limits:
	docker-compose exec backend python manage.py monitor_security --show-limits

# Email and notifications commands
create-email-templates:
	docker-compose exec backend python manage.py create_email_templates

# User management commands
cleanup-password-tokens:
	docker-compose exec backend python manage.py cleanup_password_reset_tokens

cleanup-password-tokens-dry-run:
	docker-compose exec backend python manage.py cleanup_password_reset_tokens --dry-run

# Local development versions (without Docker)
audit-report-local:
	cd backend && python manage.py audit_report

cleanup-audit-local:
	cd backend && python manage.py cleanup_audit_logs --dry-run

monitor-security-local:
	cd backend && python manage.py monitor_security

create-email-templates-local:
	cd backend && python manage.py create_email_templates

cleanup-password-tokens-local:
	cd backend && python manage.py cleanup_password_reset_tokens --dry-run
