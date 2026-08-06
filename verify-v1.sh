#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$HOME/Downloads/Harmonia_Project_Live_Ready}"
API="${HARMONIA_API_URL:-https://harmonia-production-720f.up.railway.app}"

if [[ ! -d "$ROOT/admin/js" ]]; then
  echo "ERROR: Harmonia project was not found at:"
  echo "  $ROOT"
  exit 1
fi

cd "$ROOT"

echo "Checking JavaScript syntax..."

checked=0

while IFS= read -r -d '' file; do
  node --check "$file" >/dev/null
  checked=$((checked + 1))
done < <(
  find admin/js \
    -type f \
    -name '*.js' \
    -print0
)

if [[ "$checked" -eq 0 ]]; then
  echo "ERROR: No JavaScript files were found."
  exit 1
fi

echo "  Passed: $checked JavaScript files"

echo "Checking required frontend files..."

required_files=(
  "admin/index.html"
  "admin/js/core/apiClient.js"
  "admin/js/core/authManager.js"
  "admin/js/app.js"
  "admin/js/router.js"
  "admin/js/work/workManager.js"
  "admin/js/work/workPage.js"
  "admin/js/work/workEditor.js"
  "admin/js/events/eventManager.js"
  "admin/js/events/eventsPage.js"
  "admin/js/notes/notesManager.js"
  "admin/js/notes/notesPage.js"
  "admin/js/files/filesManager.js"
  "admin/js/files/filesPage.js"
  "admin/js/partners/partnersManager.js"
  "admin/js/projects/projectWorkspace.js"
)

for file in "${required_files[@]}"; do
  if [[ ! -s "$file" ]]; then
    echo "ERROR: Required file is missing or empty:"
    echo "  $file"
    exit 1
  fi
done

echo "  Passed: required frontend files are present"

echo "Checking production backend health..."

health_code="$(
  curl \
    --max-time 20 \
    -s \
    -o /dev/null \
    -w '%{http_code}' \
    "$API/health"
)"

if [[ "$health_code" != "200" ]]; then
  echo "ERROR: Expected 200 from /health, got $health_code"
  exit 1
fi

echo "  Passed: /health returned 200"

echo "Checking protected production routes..."

protected_routes=(
  tasks
  events
  notes
  files
  contacts
)

for route in "${protected_routes[@]}"; do
  code="$(
    curl \
      --max-time 20 \
      -s \
      -o /dev/null \
      -w '%{http_code}' \
      "$API/$route"
  )"

  if [[ "$code" != "401" ]]; then
    echo "ERROR: Expected 401 for /$route, got $code"
    exit 1
  fi

  echo "  Passed: /$route returned 401"
done

echo
echo "V1 PREFLIGHT PASSED"
echo
echo "This verifies file integrity, JavaScript syntax, Railway health,"
echo "and authentication protection. Complete the browser verification"
echo "before running the release script."
