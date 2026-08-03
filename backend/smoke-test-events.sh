#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
EMAIL="${HARMONIA_TEST_EMAIL:-ibrahim@example.com}"
PASSWORD="${HARMONIA_TEST_PASSWORD:-StrongPassword123}"
ORG_ID="${HARMONIA_ORG_ID:-cms9eoh7c0000prxue4fvntqp}"
PROJECT_ID="${HARMONIA_PROJECT_ID:-cms9fetro0001vsr8df5l754x}"
CONTACT_ID="${HARMONIA_CONTACT_ID:-cmsckoxr90003j2y73bh0jcww}"

TOKEN="$(curl -fsS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")"

echo "Checking protected route..."
STATUS="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/events")"
test "$STATUS" = "401"

START_AT="$(node -e "console.log(new Date(Date.now()+86400000).toISOString())")"
END_AT="$(node -e "console.log(new Date(Date.now()+90000000).toISOString())")"

echo "Creating event..."
EVENT_RESPONSE="$(curl -fsS -X POST "$BASE_URL/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\":\"Day 2 Events Test\",
    \"description\":\"Event created by the automated Harmonia smoke test.\",
    \"type\":\"TOWN_HALL\",
    \"status\":\"CONFIRMED\",
    \"startAt\":\"$START_AT\",
    \"endAt\":\"$END_AT\",
    \"timezone\":\"America/Chicago\",
    \"location\":\"Harper College\",
    \"capacity\":100,
    \"isPublic\":true,
    \"tags\":[\"day-two-test\",\"community\"],
    \"organizationId\":\"$ORG_ID\",
    \"projectId\":\"$PROJECT_ID\"
  }")"

echo "$EVENT_RESPONSE"
EVENT_ID="$(printf '%s' "$EVENT_RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")"

echo "Adding contact attendee..."
curl -fsS -X POST "$BASE_URL/events/$EVENT_ID/contacts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"contactId\":\"$CONTACT_ID\",
    \"status\":\"CONFIRMED\",
    \"role\":\"Community Partner\"
  }"

echo
echo "Fetching full event..."
curl -fsS "$BASE_URL/events/$EVENT_ID" \
  -H "Authorization: Bearer $TOKEN"

echo
echo "Testing search and pagination..."
curl -fsS "$BASE_URL/events?organizationId=$ORG_ID&search=Day%202&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

echo
echo "Testing upcoming events..."
curl -fsS "$BASE_URL/events/upcoming?organizationId=$ORG_ID&limit=10" \
  -H "Authorization: Bearer $TOKEN"

echo
echo "EVENTS SMOKE TEST COMPLETE"
echo "Event ID: $EVENT_ID"
