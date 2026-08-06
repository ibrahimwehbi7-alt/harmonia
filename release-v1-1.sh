#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$HOME/Downloads/Harmonia_Project_Live_Ready}"
cd "$ROOT"
./verify-v1-1.sh
read -r -p "Type PUBLISH to release the Public CMS workflow: " answer
[[ "$answer" == "PUBLISH" ]] || { echo "Release cancelled."; exit 0; }
git add index.html script.js styles.css admin backend/prisma backend/src verify-v1-1.sh release-v1-1.sh
git commit -m "Add Harmonia public CMS draft preview publish workflow" || true
git push origin main
echo "PUBLIC CMS RELEASE PUSHED"
