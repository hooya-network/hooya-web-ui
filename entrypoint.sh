#!/bin/sh
set -e

# substitute environment variables in config template
export HOOYA_WEB_PROXY_URL="${HOOYA_WEB_PROXY_URL:-http://localhost:8532}"
envsubst < /app/public/config.template.js > /app/public/config.js

exec node server.js