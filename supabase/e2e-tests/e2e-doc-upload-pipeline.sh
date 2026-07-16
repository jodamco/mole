#!/bin/bash

set -e

BASE_URL="http://127.0.0.1:54331"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
EMAIL="test@mole.dev"
PASSWORD="test1234"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILE_PATH="$SCRIPT_DIR/../test-assets/principe.pdf"

echo "$SCRIPT_DIR"
echo "$FILE_PATH"


fail() {
  echo ""
  echo "FAILED: $1"
  echo "$2"
  exit 1
}

echo "1. Signing up / logging in..."
SIGNUP_RESP=$(curl -s -X POST "$BASE_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$SIGNUP_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "   Signup may have succeeded but needs email confirmation. Trying login..."
  LOGIN_RESP=$(curl -s -X POST "$BASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
  TOKEN=$(echo "$LOGIN_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  fail "Authentication failed" "$SIGNUP_RESP"
fi
echo "   Token acquired."

echo "2. Creating collection..."
COL_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/functions/v1/collection" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"E2E Test Collection","description":"Pipeline validation"}')

COL_HTTP=$(echo "$COL_RESP" | tail -1)
COL_BODY=$(echo "$COL_RESP" | sed '$d')

if [ "$COL_HTTP" != "200" ]; then
  fail "Create collection failed (HTTP $COL_HTTP)" "$COL_BODY"
fi

COLLECTION_ID=$(echo "$COL_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
if [ -z "$COLLECTION_ID" ]; then
  fail "Could not parse collection ID" "$COL_BODY"
fi
echo "   Collection created (id=$COLLECTION_ID)."

echo "3. Creating document..."
FILE_SIZE=$(wc -c < "$FILE_PATH" | tr -d ' ')
DOC_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/functions/v1/document" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"jd.pdf\",\"collectionId\":$COLLECTION_ID,\"chunkStrategyId\":1,\"size\":$FILE_SIZE,\"contentType\":\"application/pdf\"}")

DOC_HTTP=$(echo "$DOC_RESP" | tail -1)
DOC_BODY=$(echo "$DOC_RESP" | sed '$d')

if [ "$DOC_HTTP" != "200" ]; then
  fail "Create document failed (HTTP $DOC_HTTP)" "$DOC_BODY"
fi

UPLOAD_URL=$(echo "$DOC_BODY" | grep -o '"upload_url":"[^"]*"' | cut -d'"' -f4 | sed 's|kong:8000|127.0.0.1:54331|g')
UPLOAD_TOKEN=$(echo "$DOC_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
DOCUMENT_ID=$(echo "$DOC_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$UPLOAD_URL" ] || [ -z "$UPLOAD_TOKEN" ] || [ -z "$DOCUMENT_ID" ]; then
  fail "Could not parse document response" "$DOC_BODY"
fi
echo "   Document created (id=$DOCUMENT_ID)."

echo "4. Uploading file..."
echo "   URL: $UPLOAD_URL"
UPLOAD_RESP=$(curl -s -w "\n%{http_code}" -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/pdf" \
  --data-binary @"$FILE_PATH")

UPLOAD_HTTP=$(echo "$UPLOAD_RESP" | tail -1)
UPLOAD_BODY=$(echo "$UPLOAD_RESP" | sed '$d')

echo "   Response (HTTP $UPLOAD_HTTP): $UPLOAD_BODY"

if [ "$UPLOAD_HTTP" != "200" ]; then
  fail "File upload failed (HTTP $UPLOAD_HTTP)" "$UPLOAD_BODY"
fi
echo "   File uploaded."

echo "5. Completing upload..."
COMPLETE_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/functions/v1/document/$DOCUMENT_ID/complete_upload" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

COMPLETE_HTTP=$(echo "$COMPLETE_RESP" | tail -1)
COMPLETE_BODY=$(echo "$COMPLETE_RESP" | sed '$d')

if [ "$COMPLETE_HTTP" != "200" ]; then
  fail "Complete upload failed (HTTP $COMPLETE_HTTP)" "$COMPLETE_BODY"
fi
echo "   Upload completed. Pipeline triggered."

echo ""
echo "All steps passed."
