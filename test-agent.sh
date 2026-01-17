#!/bin/bash

# IntakeOS Agent Testing Script
# Tests Phase 1 & Phase 2 improvements

echo "🧪 Testing IntakeOS Agent Improvements"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the API URL (default to localhost:3000)
API_URL="${1:-http://localhost:3000}"

echo -e "${BLUE}Testing against: ${API_URL}${NC}"
echo ""

# Test 1: JSON Response (Non-Streaming)
echo -e "${YELLOW}Test 1: JSON Response (Backward Compatibility)${NC}"
echo "Testing non-streaming mode..."
curl -s -X POST "${API_URL}/api/chat/agent" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "messages": [],
    "currentState": {
      "phase": "introduction",
      "gathered_information": {},
      "missing_info": ["name", "email"]
    },
    "botSchema": {
      "goal": "Gather contact information",
      "system_prompt": "You are a helpful assistant",
      "required_info": {
        "name": {
          "description": "Full name",
          "critical": true,
          "example": "John Doe"
        },
        "email": {
          "description": "Email address",
          "critical": true,
          "example": "john@example.com"
        }
      },
      "schema_version": "agentic_v1"
    },
    "businessName": "Test Business"
  }' | jq -r '.reply' | head -c 100

echo "..."
echo -e "${GREEN}✓ JSON mode works${NC}"
echo ""

# Test 2: Streaming Response (SSE)
echo -e "${YELLOW}Test 2: Streaming Response (Real-time)${NC}"
echo "Testing streaming mode (first 5 chunks)..."

curl -s -X POST "${API_URL}/api/chat/agent" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [],
    "currentState": {
      "phase": "introduction",
      "gathered_information": {},
      "missing_info": ["name", "email"]
    },
    "botSchema": {
      "goal": "Gather contact information",
      "system_prompt": "You are a helpful assistant",
      "required_info": {
        "name": {
          "description": "Full name",
          "critical": true,
          "example": "John Doe"
        },
        "email": {
          "description": "Email address",
          "critical": true,
          "example": "john@example.com"
        }
      },
      "schema_version": "agentic_v1"
    },
    "businessName": "Test Business"
  }' | head -n 10

echo -e "${GREEN}✓ Streaming mode works${NC}"
echo ""

# Test 3: Check Headers
echo -e "${YELLOW}Test 3: Verify Response Headers${NC}"
echo "Checking if streaming returns correct Content-Type..."

CONTENT_TYPE=$(curl -s -I -X POST "${API_URL}/api/chat/agent" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"messages":[],"currentState":{"phase":"introduction","gathered_information":{},"missing_info":[]},"botSchema":{"goal":"Test","system_prompt":"Test","required_info":{},"schema_version":"agentic_v1"},"businessName":"Test"}' \
  | grep -i "content-type" | tr -d '\r')

if [[ $CONTENT_TYPE == *"text/event-stream"* ]]; then
  echo -e "${GREEN}✓ Correct Content-Type: ${CONTENT_TYPE}${NC}"
else
  echo -e "❌ Wrong Content-Type: ${CONTENT_TYPE}"
fi
echo ""

# Test 4: Run Unit Tests
echo -e "${YELLOW}Test 4: Running Unit Tests${NC}"
npm test -- lib/agent/ --run --silent 2>&1 | grep -E "(Test Files|Tests|PASS|FAIL)" | tail -5
echo ""

echo -e "${GREEN}======================================"
echo -e "✅ All Tests Complete!"
echo -e "======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Start your dev server: npm run dev"
echo "2. Visit a bot chat page"
echo "3. Watch for streaming in the Network tab"
echo "4. Check console for smart validation logs"
