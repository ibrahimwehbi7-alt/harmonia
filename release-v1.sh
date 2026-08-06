#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$HOME/Downloads/Harmonia_Project_Live_Ready}"

if [[ ! -d "$ROOT/.git" ]]; then
  echo "ERROR: Git repository was not found at:"
  echo "  $ROOT"
  exit 1
fi

cd "$ROOT"

./verify-v1.sh "$ROOT"

echo
echo "PRE-RELEASE CHECK PASSED"
echo
echo "Before continuing, confirm that browser-verification.js showed PASS"
echo "for projects, tasks, events, notes, files, and partners."
echo
read -r -p "Type RELEASE to commit and push Version 1: " confirmation

if [[ "$confirmation" != "RELEASE" ]]; then
  echo "Release cancelled. No Git changes were made."
  exit 0
fi

git add \
  admin \
  browser-verification.js \
  verify-v1.sh

if git diff --cached --quiet; then
  echo "No staged Version 1 changes were found."
else
  git commit \
    -m "Complete Harmonia Version 1 frontend integration"
fi

git push origin main

echo
echo "VERSION 1 PUSH COMPLETE"
echo "Wait for Railway deployment to finish, then run:"
echo "  ./verify-v1.sh"
