import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { GoogleGenAI } from "@google/genai";

interface PlantIdentificationResult {
  commonName: string;
  recommendedWaterSchedule: string;
  waterAmount: string;
  confidence?: string;
}

/**
 * Identifies a plant from an image using Google Gemini Vision API
 * @param imageBase64 - Base64 encoded image data (with data URI prefix)
 * @returns Plant identification result with common name and water schedule
 */
async function identifyPlantFromImage(imageBase64: string): Promise<PlantIdentificationResult> {
  // Check if Google Gemini API key is configured
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Extract base64 data and MIME type from data URI
    const mimeTypeMatch = imageBase64.match(/^data:image\/(\w+);base64,/);
    const mimeType = mimeTypeMatch ? `image/${mimeTypeMatch[1]}` : 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // Create prompt for plant identification
    const prompt = `You are a plant identification expert. Analyze this image and provide:

1. The common name of the plant (e.g., "Rosemary Bush", "Fiddle Leaf Fig", "Snake Plant", "Bonsai Tree"). Be specific - use the most common name that people would recognize.

2. A recommended watering schedule in a simple format like:
   - "1/week" for weekly watering
   - "2/week" for twice weekly
   - "1/month" for monthly
   - "When soil is dry" for plants that need checking
   - "Daily" for plants needing daily water
   - Or any other clear frequency description

3. The amount of water to use in common measurements. Be specific if possible (e.g., "1 cup", "Soak thoroughly until it drains", "Mist heavily", "Keep soil moist").

Please respond in the following JSON format:
{
  "commonName": "Plant Common Name",
  "recommendedWaterSchedule": "Watering frequency",
  "waterAmount": "Amount of water",
  "confidence": "high/medium/low"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error('Empty response from AI');
    }

    try {
      // Clean up markdown code blocks if present (even with JSON mode, sometimes they appear)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonText);
      
      // Validate the response has required fields
      if (!parsed.commonName || !parsed.recommendedWaterSchedule) {
        throw new Error('Invalid response format from AI');
      }

      return {
        commonName: parsed.commonName,
        recommendedWaterSchedule: parsed.recommendedWaterSchedule,
        waterAmount: parsed.waterAmount || "See water schedule",
        confidence: parsed.confidence || 'medium',
      };
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini response:', text);
      throw new Error('Could not parse plant identification from AI response');
    }
  } catch (error) {
    console.error('Error identifying plant:', error);
    // Helper to get error message safely
    const getErrorMessage = (err: any) => {
      if (err instanceof Error) return err.message;
      return String(err);
    };
    throw new Error(`Failed to identify plant from image: ${getErrorMessage(error)}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Validate that it's a base64 image
    if (!imageBase64.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected base64 data URI.' },
        { status: 400 }
      );
    }

    const identification = await identifyPlantFromImage(imageBase64);

    return NextResponse.json(identification);
  } catch (error) {
    console.error('Plant identification error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to identify plant';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
