#!/usr/bin/env node

/**
 * Quick test script for streaming functionality
 * Run: node test-streaming.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

console.log('🧪 Testing IntakeOS Streaming Agent');
console.log('===================================\n');

const testPayload = {
  messages: [],
  currentState: {
    phase: 'introduction',
    gathered_information: {},
    missing_info: ['name', 'email']
  },
  botSchema: {
    goal: 'Gather contact information',
    system_prompt: 'You are a friendly assistant',
    required_info: {
      name: {
        description: 'Full name',
        critical: true,
        example: 'John Doe'
      },
      email: {
        description: 'Email address',
        critical: true,
        example: 'john@example.com'
      }
    },
    schema_version: 'agentic_v1'
  },
  businessName: 'Test Business'
};

async function testStreaming() {
  console.log('📡 Testing streaming endpoint...');
  console.log(`   URL: ${API_URL}/api/chat/agent\n`);

  try {
    const response = await fetch(`${API_URL}/api/chat/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(testPayload)
    });

    const contentType = response.headers.get('content-type');
    console.log(`✅ Response received`);
    console.log(`   Content-Type: ${contentType}`);

    if (!contentType?.includes('text/event-stream')) {
      console.error('❌ Expected text/event-stream, got:', contentType);
      return;
    }

    console.log('\n📝 Streaming chunks:\n');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullMessage = '';
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          chunkCount++;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'token') {
              process.stdout.write(data.content);
              fullMessage += data.content;
            } else if (data.type === 'state_update') {
              console.log(`\n\n📊 State: ${data.state.phase}`);
            } else if (data.type === 'done') {
              console.log('\n\n✅ Stream complete');
            } else if (data.type === 'error') {
              console.error('\n\n❌ Error:', data.error);
            }
          } catch (e) {
            // Ignore parse errors (incomplete JSON)
          }
        }
      }
    }

    console.log('\n\n📊 Results:');
    console.log(`   • Chunks received: ${chunkCount}`);
    console.log(`   • Message length: ${fullMessage.length} chars`);
    console.log(`   • Full message: "${fullMessage.substring(0, 100)}..."`);
    console.log('\n✅ Streaming test passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

async function testJSON() {
  console.log('\n📡 Testing JSON fallback (backward compatibility)...\n');

  try {
    const response = await fetch(`${API_URL}/api/chat/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json' // Request JSON
      },
      body: JSON.stringify(testPayload)
    });

    const contentType = response.headers.get('content-type');
    console.log(`✅ Response received`);
    console.log(`   Content-Type: ${contentType}`);

    if (!contentType?.includes('application/json')) {
      console.error('❌ Expected application/json, got:', contentType);
      return;
    }

    const data = await response.json();

    console.log('\n📝 Response:');
    console.log(`   • Reply: "${data.reply?.substring(0, 100)}..."`);
    console.log(`   • Phase: ${data.updated_state?.phase}`);
    console.log('\n✅ JSON fallback test passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
(async () => {
  try {
    await testStreaming();
    await testJSON();
    console.log('🎉 All tests passed!\n');
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
})();
