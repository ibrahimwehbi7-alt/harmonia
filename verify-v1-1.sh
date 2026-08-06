#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$HOME/Downloads/Harmonia_Project_Live_Ready}"
API="${HARMONIA_API_URL:-http://127.0.0.1:3000}"
cd "$ROOT"

echo "Checking JavaScript syntax..."
find admin/js -type f -name '*.js' -print0 | while IFS= read -r -d '' file; do node --check "$file" >/dev/null; done
node --check script.js >/dev/null
echo "  PASS"

echo "Checking backend build..."
(cd backend && npm run build >/dev/null)
echo "  PASS"

echo "Checking public CMS endpoints..."
curl --max-time 20 -fsS "$API/public/site/the-harmonia-project" >/dev/null
curl --max-time 20 -fsS "$API/public/site/the-harmonia-project/events?limit=3" >/dev/null
echo "  PASS"

echo "Checking protected draft endpoint..."
code="$(curl --max-time 20 -s -o /dev/null -w '%{http_code}' -X PUT -H 'Content-Type: application/json' -d '{"data":{}}' "$API/site-content/about/draft?organizationId=cms9eoh7c0000prxue4fvntqp")"
[[ "$code" == "401" ]] || { echo "Expected 401, got $code"; exit 1; }
echo "  PASS"

echo
echo "PUBLIC CMS PRODUCTION PREFLIGHT PASSED"
