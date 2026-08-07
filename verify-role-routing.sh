#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Checking role-aware sign-in routing..."
node --check "$ROOT/account.js"
grep -q 'function destinationForRole' "$ROOT/account.js"
grep -q 'window.location.assign(destination)' "$ROOT/account.js"
grep -q 'id="harmonia-my-work"' "$ROOT/account.js"
grep -q 'account.js?v=20260806-s21' "$ROOT/index.html"
echo
echo "ROLE-AWARE SIGN-IN PREFLIGHT PASSED"
echo
echo "Browser tests:"
echo "  1. ADMIN signs in on public site → /admin/#dashboard"
echo "  2. TEAM_MEMBER signs in → /admin/#work"
echo "  3. VIEWER signs in → stays on account and sees My assigned work"
