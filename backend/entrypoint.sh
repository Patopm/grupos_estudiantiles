#!/bin/bash

set -e

echo "Waiting for database..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "Database is ready!"

echo "Waiting for Redis..."
while ! nc -z $(echo $REDIS_URL | cut -d'/' -f3 | cut -d':' -f1) $(echo $REDIS_URL | cut -d'/' -f3 | cut -d':' -f2); do
  sleep 0.1
done
echo "Redis is ready!"

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating cache table..."
python manage.py createcachetable

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Django server..."
exec "$@"
