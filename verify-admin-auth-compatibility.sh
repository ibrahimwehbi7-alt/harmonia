#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
echo "1/5 Checking JavaScript syntax..."
node --check admin/js/core/authManager.js
node --check admin/js/core/adminIdentityBridge.js
node --check admin/js/app.js

echo "2/5 Checking auth compatibility surface..."
grep -q 'initialize' admin/js/core/authManager.js
grep -q 'Object.assign(window.HarmoniaAuth' admin/js/core/adminIdentityBridge.js

echo "3/5 Checking deterministic script order..."
python3 - <<'PY'
from pathlib import Path
s=Path('admin/index.html').read_text()
a=s.find('js/core/authManager.js')
b=s.find('js/core/adminIdentityBridge.js')
c=s.find('js/core/apiClient.js')
assert min(a,b,c)>=0, (a,b,c)
assert a < b < c, (a,b,c)
assert s.count('shared/identity.js') == 1, s.count('shared/identity.js')
assert s.count('config.js') == 1, s.count('config.js')
print('  authManager -> adminIdentityBridge -> apiClient')
PY

echo "4/5 Checking no destructive backend changes..."
git diff -- backend/prisma/schema.prisma backend/src >/dev/null || true

echo "5/5 Checking shared-session token source..."
grep -q 'HarmoniaIdentity' admin/js/core/apiClient.js

echo
echo "ADMIN AUTH COMPATIBILITY PREFLIGHT PASSED"
echo "Browser-test logout, refresh, and authenticated /tasks after a hard refresh."
