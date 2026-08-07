#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "Checking V2 role experiences..."
node --check admin/js/core/roleExperience.js
node --check admin/js/router.js
grep -q 'roleExperience.js?v=20260807-v2' admin/index.html
grep -q 'People & Audience' admin/index.html
grep -q 'data-harmonia-experience' admin/css/main.css

echo "Building backend to confirm the previous milestone remains healthy..."
(cd backend && npm run build)

echo
echo "V2 ROLE EXPERIENCES PREFLIGHT PASSED"
echo
echo "Browser tests:"
echo "  1. VIEWER opening /admin/ returns to the minimal Member Portal."
echo "  2. TEAM_MEMBER sees Team Workspace and limited navigation."
echo "  3. ADMIN sees organization administration but not People & Audience."
echo "  4. SUPER_ADMIN sees the Owner Command Center and People & Audience."
