# Google AI Services Guide

This document explains how Google AI services (specifically Google Gemini) are integrated and used in the application for various AI-powered features.

## Overview

The application uses **Google Gemini AI** via the `@google/genai` SDK to provide AI-powered capabilities including:
- Text generation (response drafting, analysis)
- Document extraction (PDF parsing and data extraction)
- Image analysis (inspection photo analysis)
- Structured data extraction (JSON-formatted responses)

## Setup and Configuration

### 1. Install Dependencies

The project uses the official Google GenAI SDK:

```bash
npm install @google/genai
```

Package reference: `"@google/genai": "^1.30.0"`

### 2. Environment Variables

Add the following environment variable to your `.env.local`:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

**Getting Your API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your environment variables

**Important Notes:**
- The API key is prefixed with `NEXT_PUBLIC_` because it's used in client-side code
- For production, consider using server-side only API keys and route all requests through API endpoints
- Keep your API key secure and never commit it to version control

### 3. Initialize the Client

The Google GenAI client is initialized in service files:

```typescript
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
```

## Architecture

### Service Layer Pattern

The application follows a service layer pattern where AI functionality is organized into focused service files:

1. **`/lib/geminiService.ts`** - Main service for ticket management, financial analysis, inspection analysis, and document extraction
2. **`/lib/rentAgreementService.ts`** - Specialized service for extracting data from rental/lease agreements

### Model Configuration

The application uses the **Gemini 2.0 Flash Experimental** model:

```typescript
model: 'gemini-2.0-flash-exp'
```

This model is chosen for:
- Fast response times
- Multimodal capabilities (text, images, PDFs)
- JSON response format support
- Cost-effectiveness for high-volume operations

## Core Services

### 1. Gemini Service (`/lib/geminiService.ts`)

#### Text Generation Functions

**`draftResponseToTicket(ticket, tone)`**
- Generates professional responses to tenant maintenance tickets
- Supports different tones: `'professional' | 'empathetic' | 'firm'`
- Returns a short, contextually appropriate message

```typescript
const response = await draftResponseToTicket(ticket, 'professional');
```

**`analyzeFinancialStatus(totalRevenue, totalOverdue, overdueCount)`**
- Analyzes financial health based on revenue and overdue amounts
- Provides cash flow assessment and recommendations
- Returns a brief analysis string

```typescript
const analysis = await analyzeFinancialStatus(revenue, overdue, count);
```

**`prioritizeTicket(description)`**
- Categorizes maintenance requests by priority (HIGH, MEDIUM, LOW)
- Uses structured JSON response format
- Returns priority level and reasoning

```typescript
const { priority, reason } = await prioritizeTicket(description);
// Returns: { priority: 'HIGH' | 'MEDIUM' | 'LOW', reason: string }
```

#### Image Analysis Functions

**`analyzeInspectionPhotos(imageUrls)`**
- Analyzes move-out inspection photos for damages
- Identifies areas requiring maintenance or repair
- Estimates repair costs and assigns confidence scores
- Returns structured inspection items array

```typescript
const items = await analyzeInspectionPhotos(imageUrls);
// Returns: InspectionItem[]
```

#### Document Extraction Functions

**`extractManagementAgreementData(fileUrl)`**
- Extracts structured data from management agreement PDFs
- Parses parties, property details, lease terms, compensation, etc.
- Returns comprehensive JSON object with document data

```typescript
const data = await extractManagementAgreementData(fileUrl);
```

### 2. Rent Agreement Service (`/lib/rentAgreementService.ts`)

**`extractRentAgreementData(fileUrl)`**
- Extracts tenant details and lease terms from rental agreements
- Returns structured JSON with tenant info and lease terms
- Handles missing fields gracefully

```typescript
const data = await extractRentAgreementData(fileUrl);
// Returns: { tenant_details: {...}, lease_terms: {...} }
```

## File Processing Utilities

### Base64 Conversion

Both services include a utility function for converting files/images to base64 format for API consumption:

```typescript
async function fetchFileAsBase64(url: string): Promise<{ data: string, mimeType: string }> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  let contentType = response.headers.get('content-type');
  
  // Handle missing content types by guessing from URL
  if (!contentType || contentType === 'application/octet-stream') {
    if (url.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (url.toLowerCase().match(/\.(jpg|jpeg)$/)) {
      contentType = 'image/jpeg';
    } else if (url.toLowerCase().endsWith('.png')) {
      contentType = 'image/png';
    } else {
      contentType = 'application/pdf'; // Default
    }
  }

  return {
    data: buffer.toString('base64'),
    mimeType: contentType
  };
}
```

**Supported Formats:**
- PDF documents: `application/pdf`
- JPEG images: `image/jpeg`
- PNG images: `image/png`

## API Integration Pattern

### Request Structure

The application uses a consistent pattern for Gemini API requests:

#### Text-Only Requests

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash-exp',
  contents: prompt,
});
```

#### Structured JSON Responses

For functions requiring structured data, use `responseMimeType`:

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash-exp',
  contents: prompt,
  config: { responseMimeType: "application/json" }
});
```

#### Multimodal Requests (Text + Images/PDFs)

```typescript
const { data, mimeType } = await fetchFileAsBase64(fileUrl);

const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash-exp',
  contents: [
    { 
      role: 'user', 
      parts: [
        { text: prompt },
        { 
          inlineData: {
            data,
            mimeType
          }
        }
      ] 
    }
  ],
  config: { responseMimeType: "application/json" }
});
```

#### Multiple Images

For analyzing multiple images (e.g., inspection photos):

```typescript
const imageParts = await Promise.all(imageUrls.map(async (url) => {
  const { data, mimeType } = await fetchImageAsBase64(url);
  return {
    inlineData: {
      data,
      mimeType
    }
  };
}));

const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash-exp',
  contents: [
    { role: 'user', parts: [{ text: prompt }, ...imageParts] }
  ],
  config: { responseMimeType: "application/json" }
});
```

## API Routes

The service functions are exposed through Next.js API routes:

### Inspection Analysis

**Endpoint:** `POST /api/inspections/analyze`

```typescript
// app/api/inspections/analyze/route.ts
import { analyzeInspectionPhotos } from '@/lib/geminiService';

export async function POST(request: NextRequest) {
  const { imageUrls } = await request.json();
  const inspectionItems = await analyzeInspectionPhotos(imageUrls);
  return NextResponse.json({ success: true, data: inspectionItems });
}
```

### Document Extraction

**Endpoint:** `POST /api/onboarding/extract-agreement`

```typescript
// app/api/onboarding/extract-agreement/route.ts
import { extractManagementAgreementData } from '@/lib/geminiService';

export async function POST(req: NextRequest) {
  const { fileUrl } = await req.json();
  const data = await extractManagementAgreementData(fileUrl);
  return NextResponse.json(data);
}
```

## Error Handling

### Graceful Degradation

All service functions implement graceful degradation when the API key is missing:

```typescript
if (!apiKey) {
  return "AI Draft (Mock): Please set NEXT_PUBLIC_GEMINI_API_KEY to enable real AI generation.";
}
```

### Try-Catch Patterns

Functions wrap API calls in try-catch blocks and return fallback values:

```typescript
try {
  const response = await ai.models.generateContent({...});
  return response.text || "Unable to generate draft.";
} catch (error) {
  return "Error generating response. Please try again.";
}
```

### Structured Error Responses

For complex functions, error responses maintain the expected data structure:

```typescript
catch (error) {
  return [{
    id: 'error',
    area: 'System',
    status: 'MAINTENANCE_REQUIRED',
    description: 'AI Analysis failed. Please review manually.',
    estimatedCost: 0,
    confidence: 0,
    imageUrls: []
  }];
}
```

## Prompt Engineering Best Practices

### 1. Clear Role Definition

Always define the AI's role in the prompt:

```typescript
const prompt = `You are a property manager assistant. 
Draft a short, clear ${tone} response...`;
```

### 2. Explicit Structure Requirements

For JSON responses, provide clear schema instructions:

```typescript
const prompt = `
Return a JSON object with this EXACT structure:
{
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "reason": "string"
}
`;
```

### 3. Context and Examples

Provide sufficient context and examples:

```typescript
const prompt = `
HIGH = Safety hazards, leaks, power outages.
MEDIUM = Appliance failure, noise complaints.
LOW = Cosmetic issues, non-urgent questions.
`;
```

### 4. Output Formatting

Specify exact formatting requirements:

```typescript
const prompt = `
Return dates in YYYY-MM-DD format.
If a field is missing, use null.
Keep responses under 100 words.
`;
```

## Common Use Cases

### 1. Text Generation

Generate human-like text responses for user communications:

```typescript
const draft = await draftResponseToTicket(ticket, 'empathetic');
```

### 2. Data Classification

Categorize and prioritize user inputs:

```typescript
const { priority, reason } = await prioritizeTicket(description);
```

### 3. Document Data Extraction

Extract structured data from PDF documents:

```typescript
const agreementData = await extractManagementAgreementData(pdfUrl);
const leaseData = await extractRentAgreementData(leasePdfUrl);
```

### 4. Image Analysis

Analyze photos for specific features or issues:

```typescript
const damages = await analyzeInspectionPhotos(photoUrls);
```

## Security Considerations

### 1. API Key Security

- **Development:** Use `NEXT_PUBLIC_` prefix for client-side access (less secure)
- **Production:** Consider server-side only keys and route through API endpoints
- Never expose API keys in client-side code or public repositories

### 2. Input Validation

Always validate inputs before sending to AI services:

```typescript
if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
```

### 3. Rate Limiting

Implement rate limiting on API endpoints to prevent abuse:

```typescript
// Consider adding rate limiting middleware
```

### 4. Data Privacy

- Be mindful of PII (Personally Identifiable Information) in prompts
- Consider data anonymization for sensitive documents
- Review Google's data usage policies

## Cost Optimization

### 1. Model Selection

- Use `gemini-2.0-flash-exp` for cost-effective operations
- Consider `gemini-pro` only for complex reasoning tasks

### 2. Prompt Optimization

- Keep prompts concise but clear
- Remove unnecessary context
- Use structured formats to reduce response length

### 3. Caching

Consider caching AI responses for identical inputs:

```typescript
// Example: Cache ticket prioritization results
const cacheKey = `ticket-priority-${hashDescription(description)}`;
```

### 4. Batch Processing

For multiple images, batch them in a single request when possible (Gemini supports multiple images).

## Troubleshooting

### Common Issues

**1. API Key Not Working**
- Verify the key is set in `.env.local`
- Restart the development server after adding the key
- Check that the key hasn't expired

**2. Rate Limit Errors**
- Implement exponential backoff
- Add request queuing
- Monitor usage in Google AI Studio

**3. JSON Parsing Errors**
- Ensure `responseMimeType: "application/json"` is set
- Add validation before parsing
- Handle malformed JSON gracefully

**4. Image Upload Failures**
- Verify image URLs are accessible
- Check file size limits (Gemini has payload limits)
- Ensure proper MIME type detection

### Debugging Tips

1. **Log API Responses:**
```typescript
console.log('Raw response:', response.text);
```

2. **Validate Base64 Encoding:**
```typescript
console.log('MIME type:', mimeType);
console.log('Data length:', data.length);
```

3. **Test Prompts Separately:**
Test prompt structure in Google AI Studio before implementing

## Migration Checklist

To replicate this setup in another project:

- [ ] Install `@google/genai` package
- [ ] Get Gemini API key from Google AI Studio
- [ ] Add `NEXT_PUBLIC_GEMINI_API_KEY` to environment variables
- [ ] Create service file (`lib/geminiService.ts` or similar)
- [ ] Initialize GoogleGenAI client
- [ ] Implement base64 file conversion utility
- [ ] Create service functions with error handling
- [ ] Set up API routes for client access
- [ ] Add authentication/authorization to API routes
- [ ] Implement graceful degradation for missing API key
- [ ] Test with sample data
- [ ] Add rate limiting (if needed)
- [ ] Set up monitoring/logging
- [ ] Review and optimize prompts
- [ ] Document project-specific use cases

## Additional Resources

- [Google AI Studio](https://makersuite.google.com/app/apikey) - Get API keys and test prompts
- [Gemini API Documentation](https://ai.google.dev/docs) - Official documentation
- [@google/genai SDK](https://www.npmjs.com/package/@google/genai) - NPM package documentation

## Example: Complete Service File Template

```typescript
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Utility function for file conversion
async function fetchFileAsBase64(url: string): Promise<{ data: string, mimeType: string }> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  let contentType = response.headers.get('content-type') || 'application/octet-stream';
  
  // Add MIME type detection logic here
  
  return {
    data: buffer.toString('base64'),
    mimeType: contentType
  };
}

// Example service function
export const myAIFunction = async (input: string): Promise<string> => {
  if (!apiKey) {
    return "AI service unavailable. Please set API key.";
  }

  try {
    const prompt = `Your prompt here: ${input}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    return response.text || "Unable to generate response.";
  } catch (error) {
    console.error('AI service error:', error);
    return "Error generating response. Please try again.";
  }
};
```

