#!/bin/sh
set -e

PORT="${PORT:-8000}"

if [ -z "$APP_KEY" ]; then
  echo "ERROR: APP_KEY is not set. Generate one with: php artisan key:generate --show"
  exit 1
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache

php artisan migrate --force
php artisan storage:link 2>/dev/null || true

(
  while true; do
    php artisan schedule:run --verbose --no-interaction || true
    sleep 60
  done
) &

exec php artisan serve --host=0.0.0.0 --port="$PORT"
