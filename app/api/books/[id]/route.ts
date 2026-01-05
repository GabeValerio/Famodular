import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id;

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Books API key is not configured' },
        { status: 500 }
      );
    }

    const url = `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      }
      throw new Error(`Books API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Books API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get book' },
      { status: 500 }
    );
  }
}
