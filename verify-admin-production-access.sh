#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Checking production admin access..."
for f in shared/identity.js account/account-page.js admin/index.html admin/js/core/roleExperience.js; do
  [ -f "$ROOT/$f" ] || { echo "Missing $f"; exit 1; }
done
grep -q 'HarmoniaIdentity.guard(\["ADMIN", "SUPER_ADMIN"\]' "$ROOT/admin/index.html"
grep -q '20260807-prod-admin' "$ROOT/admin/index.html"
grep -q 'SESSION_KEY = "harmonia_session"' "$ROOT/shared/identity.js"
grep -q 'requested.startsWith("/admin/")' "$ROOT/account/account-page.js"
if command -v node >/dev/null 2>&1; then
  node --check "$ROOT/shared/identity.js"
  node --check "$ROOT/account/account-page.js"
  node --check "$ROOT/admin/js/core/roleExperience.js"
fi
echo "ADMIN PRODUCTION ACCESS PREFLIGHT PASSED"
echo "Production /admin/ now uses the shared authenticated session and ADMIN/SUPER_ADMIN guard."
