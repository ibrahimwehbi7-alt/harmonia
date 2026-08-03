#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
EMAIL="${HARMONIA_TEST_EMAIL:-ibrahim@example.com}"
PASSWORD="${HARMONIA_TEST_PASSWORD:-StrongPassword123}"
ORG_ID="${HARMONIA_ORG_ID:-cms9eoh7c0000prxue4fvntqp}"
PROJECT_ID="${HARMONIA_PROJECT_ID:-cms9fetro0001vsr8df5l754x}"

TOKEN="$(curl -fsS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")"

echo "Checking protected Notes route..."
test "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/notes")" = "401"

echo "Creating note..."
NOTE_RESPONSE="$(curl -fsS -X POST "$BASE_URL/notes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\":\"Day 3 Notes Test\",
    \"content\":\"Notes backend smoke test passed.\",
    \"category\":\"project\",
    \"pinned\":true,
    \"tags\":[\"day-three-test\"],
    \"organizationId\":\"$ORG_ID\",
    \"projectId\":\"$PROJECT_ID\"
  }")"

echo "$NOTE_RESPONSE"
NOTE_ID="$(printf '%s' "$NOTE_RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")"

echo "Searching notes..."
curl -fsS \
  "$BASE_URL/notes?organizationId=$ORG_ID&search=Day%203&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

echo
echo "Uploading general file..."
TEST_FILE="$(mktemp)"
printf 'Harmonia Day 3 general file test\n' > "$TEST_FILE"

FILE_RESPONSE="$(curl -fsS -X POST \
  "$BASE_URL/files?organizationId=$ORG_ID&projectId=$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TEST_FILE;filename=day3-general-file.txt")"

echo "$FILE_RESPONSE"
FILE_ID="$(printf '%s' "$FILE_RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")"

echo "Listing files..."
curl -fsS \
  "$BASE_URL/files?organizationId=$ORG_ID&search=day3&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

echo
echo "Downloading file..."
DOWNLOAD_PATH="$(mktemp)"
curl -fsS \
  "$BASE_URL/files/$FILE_ID/download" \
  -H "Authorization: Bearer $TOKEN" \
  -o "$DOWNLOAD_PATH"

grep -q "Harmonia Day 3 general file test" "$DOWNLOAD_PATH"

rm -f "$TEST_FILE" "$DOWNLOAD_PATH"

echo
echo "DAY 3 SMOKE TEST COMPLETE"
echo "Note ID: $NOTE_ID"
echo "File ID: $FILE_ID"
