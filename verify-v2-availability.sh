#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Checking V2 Availability module..."
test -f "$ROOT/backend/prisma/migrations/20260807023000_add_availability/migration.sql"
test -f "$ROOT/backend/src/users/dto/update-availability.dto.ts"
test -f "$ROOT/admin/js/availability/availabilityPage.js"
grep -q "me/availability" "$ROOT/backend/src/users/users.controller.ts"
grep -q "AvailabilityProfile" "$ROOT/backend/prisma/schema.prisma"
node --check "$ROOT/account.js"
node --check "$ROOT/admin/js/availability/availabilityPage.js"
node --check "$ROOT/admin/js/core/roleExperience.js"
echo "Building backend..."
(cd "$ROOT/backend" && npm run build)
echo
echo "V2 AVAILABILITY PREFLIGHT PASSED"
echo
echo "Browser tests:"
echo "  1. Member sees Availability only after opting into volunteer opportunities."
echo "  2. Member can save recurring weekly windows and commitment preferences."
echo "  3. Team/Admin can update personal availability in the workspace."
echo "  4. SUPER_ADMIN can search organization availability by day and time."
