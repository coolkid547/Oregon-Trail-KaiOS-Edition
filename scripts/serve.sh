#!/usr/bin/env bash
set -euo pipefail

# Serve the site locally from dist/ or project root
# Usage:
#   ./scripts/serve.sh            # serves dist/ if present else .
#   ./scripts/serve.sh 9000       # custom port
#   ./scripts/serve.sh .          # serve project root
#   ./scripts/serve.sh dist 8080  # serve dist on port 8080

PORT="8000"
DIR=""

if [[ $# -ge 1 ]]; then
  if [[ "$1" =~ ^[0-9]+$ ]]; then
    PORT="$1"
  else
    DIR="$1"
  fi
fi
if [[ $# -ge 2 ]]; then
  PORT="$2"
fi

if [[ -z "$DIR" ]]; then
  if [[ -d "dist" ]]; then
    DIR="dist"
  else
    DIR="."
  fi
fi

echo "Serving \"$DIR\" on http://localhost:$PORT"
python3 -m http.server "$PORT" --directory "$DIR"