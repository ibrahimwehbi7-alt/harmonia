#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh"

for cmd in node npm npx; do
  command -v "$cmd" >/dev/null || { echo "$cmd is unavailable. Load NVM first."; exit 1; }
done

required=(
  account.js
  admin/js/users/usersPage.js
  backend/src/users/dto/update-profile.dto.ts
  backend/src/users/dto/update-user-role.dto.ts
  backend/src/users/users.controller.ts
  backend/src/users/users.service.ts
)
for file in "${required[@]}"; do
  [[ -f "$ROOT/$file" ]] || { echo "Missing required file: $file"; exit 1; }
done

node --check "$ROOT/account.js"
node --check "$ROOT/admin/js/users/usersPage.js"
node --check "$ROOT/admin/js/router.js"
node --check "$ROOT/admin/js/app.js"

grep -q 'id="accountButton"' "$ROOT/index.html"
grep -q 'data-page="users"' "$ROOT/admin/index.html"
grep -q "@Patch(':id/role')" "$ROOT/backend/src/users/users.controller.ts"
grep -q 'role UserRole @default(VIEWER)' "$ROOT/backend/prisma/schema.prisma"

echo "Building backend..."
(cd "$ROOT/backend" && npx prisma generate >/dev/null && npm run build)

echo
echo "SPRINT 2 PUBLIC ACCOUNTS PREFLIGHT PASSED"
echo
echo "Browser tests:"
echo "  1. Create an account from the public website."
echo "  2. Confirm the account is VIEWER."
echo "  3. Sign in and edit the profile name."
echo "  4. As an ADMIN, open Admin → Users & Access and promote a test user."
