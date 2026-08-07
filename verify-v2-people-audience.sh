#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Checking V2 People & Audience Center..."
required=(
  "admin/js/audience/audiencePage.js"
  "backend/src/users/dto/create-campaign-draft.dto.ts"
  "backend/prisma/migrations/20260807013000_add_audience_communications/migration.sql"
)
for file in "${required[@]}"; do [[ -f "$ROOT/$file" ]] || { echo "Missing: $file"; exit 1; }; done
node --check "$ROOT/account.js"
node --check "$ROOT/admin/js/audience/audiencePage.js"
grep -q 'CampaignDraft' "$ROOT/backend/prisma/schema.prisma"
grep -q 'campaign-drafts' "$ROOT/backend/src/users/users.controller.ts"
grep -q 'People, Audience & Communications' "$ROOT/admin/index.html"
echo "Building backend..."
(cd "$ROOT/backend" && npm run build)
echo
echo "V2 PEOPLE & AUDIENCE CENTER PREFLIGHT PASSED"
echo
echo "Browser tests:"
echo "  1. Member can independently choose newsletter, event, volunteer, and partner updates."
echo "  2. SUPER_ADMIN can filter/search/export People & Audience."
echo "  3. Recipient preview excludes unsubscribed accounts."
echo "  4. Saving a campaign creates a draft and sends no email."
