const { performWebSearchWithAI } = require('./dist/controllers/search');

async function testWebSearch() {
  try {
    console.log('Testing web search...');
    
    // Check if environment variables are set
    console.log('Environment variables:');
    console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Set' : 'Not set');
    console.log('SEARCHAPI_KEY:', process.env.SEARCHAPI_KEY ? 'Set' : 'Not set');
    
    const result = await performWebSearchWithAI('What is artificial intelligence?', 'What is artificial intelligence?');
    
    console.log('Web search result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Web search test failed:', error);
  }
}

testWebSearch();

