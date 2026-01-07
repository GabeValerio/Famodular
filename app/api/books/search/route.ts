import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = searchParams.get('maxResults') || '10';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Books API key is not configured' },
        { status: 500 }
      );
    }

    const url = new URL('https://www.googleapis.com/books/v1/volumes');
    url.searchParams.set('q', query);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('maxResults', maxResults);
    url.searchParams.set('orderBy', 'relevance');
    url.searchParams.set('printType', 'books');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Books API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Books API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search books' },
      { status: 500 }
    );
  }
}

