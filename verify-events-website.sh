#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "Checking Events → Website integration..."
node --check script.js
node --check admin/js/events/eventModal.js
node --check admin/js/events/eventManager.js

grep -q 'public/site/:slug/events' backend/src/site-content/site-content.controller.ts
grep -q 'isPublic: true' backend/src/site-content/site-content.service.ts
grep -q "status: { in: \['SCHEDULED', 'CONFIRMED'\] }" backend/src/site-content/site-content.service.ts
grep -q 'startAt: { gte: new Date() }' backend/src/site-content/site-content.service.ts
grep -q 'eventRegistrationUrlInput' admin/index.html
grep -q 'eventFeaturedInput' admin/index.html
grep -q 'eventsUnavailable' script.js

if [ -d backend/node_modules ]; then
  echo "Building backend..."
  (cd backend && npm run build)
else
  echo "Backend node_modules not present; skipped TypeScript build."
fi

echo
echo "EVENTS TO WEBSITE PREFLIGHT PASSED"
