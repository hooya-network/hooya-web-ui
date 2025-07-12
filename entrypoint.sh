#!/bin/sh
set -e

# substitute environment
envsubst < /app/env.template.js > /app/public/env.js

exec node server.js
