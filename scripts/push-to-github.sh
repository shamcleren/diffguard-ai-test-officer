#!/usr/bin/env bash
set -euo pipefail

REPO=${1:-shamcleren/diffguard-ai-test-officer}
VISIBILITY=${2:-private}

git init
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "git@github.com:${REPO}.git"
fi

git add .
git commit -m "feat: initialize DiffGuard AI Test Officer" || true

if command -v gh >/dev/null 2>&1; then
  gh repo create "$REPO" "--$VISIBILITY" --source . --remote origin --push || git push -u origin main
else
  git branch -M main
  git push -u origin main
fi
