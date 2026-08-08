#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/backend"
echo "1/5 Checking corrected PrismaService import..."
grep -q "from '../prisma/prisma.service'" src/auth/access-resolver.service.ts
if grep -q "../../prisma/prisma.service" src/auth/access-resolver.service.ts; then
  echo "ERROR: stale incorrect PrismaService import remains"
  exit 1
fi
echo "2/5 Validating Prisma schema..."
npx prisma validate
echo "3/5 Generating Prisma Client..."
npx prisma generate
echo "4/5 Building backend..."
npm run build
echo "5/5 Checking access-resolution wiring..."
grep -q 'membershipRole' src/auth/access-resolver.service.ts
grep -q 'getMe(request.user.userId)' src/auth/auth.controller.ts
grep -q 'AccessResolverService' src/auth/strategies/jwt.strategy.ts
echo
echo "ACCESS RESOLUTION HOTFIX PREFLIGHT PASSED"
echo "No database writes were performed."
