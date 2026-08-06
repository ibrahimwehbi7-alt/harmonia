#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$HOME/Downloads/Harmonia_Project_Live_Ready}"
API="${HARMONIA_API_URL:-https://harmonia-production-720f.up.railway.app}"
cd "$ROOT"
echo "Checking JavaScript syntax..."
find admin/js -name '*.js' -print0 | while IFS= read -r -d '' f; do node --check "$f" >/dev/null; done
echo "Checking backend health..."
curl --max-time 20 -fsS "$API/health" >/dev/null
for route in tasks events notes files contacts; do
  code="$(curl --max-time 20 -s -o /dev/null -w '%{http_code}' "$API/$route")"
  if [[ "$code" != "401" ]]; then echo "Expected 401 for /$route, got $code"; exit 1; fi
done
echo "Checking required frontend files..."
for f in admin/js/core/apiClient.js admin/js/core/authManager.js admin/js/app.js admin/js/router.js admin/js/work/workManager.js admin/js/events/eventManager.js admin/js/notes/notesManager.js admin/js/files/filesManager.js admin/js/partners/partnersManager.js; do test -s "$f"; done
echo "V1 PREFLIGHT PASSED"
