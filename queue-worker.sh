#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || exit 1

php artisan queue:work --stop-when-empty --tries=3 --max-time=60 >> storage/logs/worker-cron.log 2>&1
