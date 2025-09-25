#!/bin/sh
set -e

echo "=== DEBUG: Environment Variables ==="
echo "DB_HOST='$DB_HOST'"
echo "DB_PORT='$DB_PORT'"
echo "REDIS_URL='$REDIS_URL'"
echo "=== END DEBUG ==="

echo "Waiting for database..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "DB ready!"

if [ -n "$REDIS_URL" ]; then
  REDIS_HOST=$(echo $REDIS_URL | cut -d'/' -f3 | cut -d':' -f1)
  REDIS_PORT=$(echo $REDIS_URL | cut -d'/' -f3 | cut -d':' -f2)
  echo "Waiting for Redis $REDIS_HOST:$REDIS_PORT..."
  while ! nc -z $REDIS_HOST $REDIS_PORT; do
    sleep 0.1
  done
  echo "Redis ready!"
fi

echo "Run migrations..."
python manage.py migrate --noinput

echo "Collect static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"