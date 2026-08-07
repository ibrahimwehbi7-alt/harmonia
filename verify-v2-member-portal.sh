#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
node --check account.js
node --check admin/js/audience/audiencePage.js
grep -q 'newsletterOptIn' backend/prisma/schema.prisma
grep -q "@Get('audience')" backend/src/users/users.controller.ts
grep -q 'member-portal-shell' styles.css
grep -q 'data-page="audience"' admin/index.html
(cd backend && npx prisma generate >/dev/null && npm run build)
echo
echo 'V2 MEMBER PORTAL PREFLIGHT PASSED'
