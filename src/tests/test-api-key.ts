import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testAPIKey() {
  console.log('🔑 Testing Claude API key...');
  console.log('API Key exists:', !!process.env.CLAUDE_API_KEY);
  console.log('API Key starts with:', process.env.CLAUDE_API_KEY?.substring(0, 15) + '...');
  
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Just say "Hello, API test successful!"'
          }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ API Key is valid!');
    console.log('Response:', response.data.content[0].text);
    return true;
    
  } catch (error: any) {
    console.error('❌ API Key test failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n💡 This means your API key is invalid. Please:');
      console.error('1. Go to https://console.anthropic.com');
      console.error('2. Generate a new API key');
      console.error('3. Update your .env file');
      console.error('4. Make sure the key starts with "sk-ant-api03-"');
    }
    return false;
  }
}

testAPIKey();