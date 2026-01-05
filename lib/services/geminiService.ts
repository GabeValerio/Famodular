import { CheckIn, Goal, Message, FamilyMember } from '../../types/family';
import { GoogleGenAI } from '@google/genai';

export const getGoalAdvice = async (goal: Goal): Promise<string[]> => {
  // Mock implementation - replace with actual Google GenAI call
  return [
    "Break your goal into smaller, manageable steps.",
    "Track your progress weekly and celebrate small wins.",
    "Share your goal with family for accountability and support."
  ];
};

export const analyzeCheckIns = async (checkIns: CheckIn[], members: FamilyMember[]): Promise<string> => {
  try {
    if (checkIns.length === 0) return "No check-ins yet to analyze.";

    const checkInText = checkIns.map(c => {
      const member = members.find(m => m.id === c.memberId)?.name || 'Unknown';
      return `${member} is feeling ${c.mood}: "${c.note}"`;
    }).join('\n');

    // Mock AI analysis - replace with actual Google GenAI call
    const moodCounts = checkIns.reduce((acc, c) => {
      acc[c.mood] = (acc[c.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantMood = Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0][0];

    return `The family seems mostly ${dominantMood.toLowerCase()}. Consider planning a relaxing family activity to boost everyone's spirits.`;
  } catch (error) {
    return "Unable to analyze check-ins at the moment.";
  }
};

export const getChatResponse = async (messages: Message[], members: FamilyMember[]): Promise<string> => {
  try {
    // Mock AI response - replace with actual Google GenAI call
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.text.toLowerCase().includes('help')) {
      return "I'm here to help! What can I assist you with today?";
    }
    return "Thanks for sharing! How else can I support your family?";
  } catch (error) {
    return "Sorry, I'm having trouble connecting right now.";
  }
};

export const generateFamilyQuestion = async (topic: string): Promise<string> => {
  // Mock question generation - replace with actual Google GenAI call
  const questions = [
    `What is your favorite memory about ${topic}?`,
    `How does ${topic} make you feel?`,
    `What's one thing you'd like to learn about ${topic}?`,
    `How has ${topic} changed for our family over time?`
  ];
  return questions[Math.floor(Math.random() * questions.length)];
};

export const suggestActivity = async (theme: string): Promise<{ title: string; description: string }> => {
  // Mock activity suggestion - replace with actual Google GenAI call
  const activities = [
    {
      title: "Family Picnic",
      description: "Pack some sandwiches, fruits, and games for a relaxing outdoor picnic in the park."
    },
    {
      title: "Movie Marathon",
      description: "Pick your favorite family movies and have a cozy movie night with popcorn and blankets."
    },
    {
      title: "Kitchen Adventure",
      description: "Try cooking a new recipe together - everyone can help with different parts!"
    },
    {
      title: "Game Tournament",
      description: "Set up different board games or card games and have a friendly family competition."
    }
  ];
  return activities[Math.floor(Math.random() * activities.length)];
};

export interface ParsedTimeEntry {
  date: string; // MM/DD/YYYY format
  startTime: string; // H:MM AM/PM format
  endTime?: string; // H:MM AM/PM format
  description?: string;
}

export const parseTimeEntriesWithGemini = async (inputText: string): Promise<ParsedTimeEntry[]> => {
  try {
    // Check if Google Gemini API key is configured
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Google Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
    }

    const genAI = new GoogleGenAI({ apiKey });

    const prompt = `Parse the following natural language text into structured time tracking entries. Each entry should have:
- date: in MM/DD/YYYY format
- startTime: in H:MM AM/PM format (e.g., "9:30 AM", "2:15 PM")
- endTime: in H:MM AM/PM format (optional, only if specified)
- description: any descriptive text about the activity (optional)

Rules:
- Use 12-hour format with AM/PM
- If no year is specified, assume 2025
- If no date is specified for an entry, infer it from context or previous entries
- Handle various formats like "7/14/25 10:15-12:15pm meeting" or "3-5pm"
- If only one time is given, treat it as start time only (no end time)
- Extract any descriptive text as the description

Input text:
${inputText}

Return ONLY a valid JSON array of objects with the format:
[{"date": "MM/DD/YYYY", "startTime": "H:MM AM/PM", "endTime": "H:MM AM/PM", "description": "optional text"}]`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const text = result.text;

    if (!text) {
      throw new Error('Empty response from AI');
    }

    // Clean up the response to get valid JSON
    const cleanedText = text.trim().replace(/```json\s*/i, '').replace(/```\s*$/, '');

    try {
      const parsed = JSON.parse(cleanedText);
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', cleanedText);
      throw new Error('Failed to parse AI response as valid JSON');
    }
  } catch (error) {
    console.error('Gemini parsing error:', error);
    throw new Error(`Failed to parse time entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

