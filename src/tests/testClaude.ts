import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testClaude() {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-haiku-20241022', // ✅ Current Haiku model
        // Alternative options:
        // model: 'claude-3-5-sonnet-20241022', // Sonnet model
        // model: 'claude-3-opus-20240229',     // Opus model (if available)
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: 'Say hello in FHIR-compliant JSON format',
          },
        ],
      },
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('🧠 Claude response:\n', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('❌ Error calling Claude:', error.response?.data || error.message);
    
    // Additional debugging info
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testClaude();