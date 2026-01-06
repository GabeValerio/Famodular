import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testGeminiAPI() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('No Gemini API key found');
    return;
  }

  console.log('Testing Gemini API key...');

  try {
    const genAI = new GoogleGenAI({ apiKey });

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        role: 'user',
        parts: [{ text: 'Say "Hello, world!"' }]
      }]
    });

    const text = result.text;
    console.log('Gemini API test successful:', text);
  } catch (error) {
    console.error('Gemini API test failed:', error);
  }
}

testGeminiAPI();
