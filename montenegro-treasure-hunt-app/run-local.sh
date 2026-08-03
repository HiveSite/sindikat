#!/usr/bin/env sh
set -e
cd "$(dirname "$0")"
if [ ! -f .env ]; then cp .env.example .env; fi
node server.mjs
