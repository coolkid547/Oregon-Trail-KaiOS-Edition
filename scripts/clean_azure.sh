#!/usr/bin/env bash
set -euo pipefail

# Clean Azure/CNAME artifacts and commit the change.
# Usage: ./scripts/clean_azure.sh "commit message"

MSG="${1:-Remove Azure artifacts and CNAME, switch to GitHub Pages}" 

# Files to remove (safe if missing)
files=(
  CNAME
  azure-pipelines.yml
  infra/storage-account-template.json
  scripts/azure_deploy.sh
  scripts/azure_deploy_api.py
  docs/jsorg-pr.md
)

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
cd "$ROOT"

for f in "${files[@]}"; do
  if [ -e "$f" ]; then
    git rm -f "$f" || true
    echo "Removed $f"
  else
    echo "Not present: $f"
  fi
done

# Commit if there are changes
if git diff --cached --quiet; then
  echo "No changes staged. Nothing to commit."
else
  git commit -m "$MSG"
  echo "Committed: $MSG"
fi

echo "Done. Run 'git push origin main' or open a PR from your branch."