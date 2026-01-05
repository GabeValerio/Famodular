import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// GET: Fetch all books for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userBooks, error } = await supabase
      .from('user_currently_reading')
      .select(`
        id,
        user_id,
        book_id,
        started_date,
        created_at,
        books (
          id,
          title,
          authors,
          description,
          image_links,
          published_date,
          publisher,
          page_count,
          categories,
          average_rating,
          ratings_count
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const books = (userBooks || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      bookId: item.book_id,
      startedDate: item.started_date,
      createdAt: item.created_at,
      book: item.books ? {
        id: item.books.id,
        title: item.books.title,
        authors: item.books.authors,
        description: item.books.description,
        imageLinks: item.books.image_links,
        publishedDate: item.books.published_date,
        publisher: item.books.publisher,
        pageCount: item.books.page_count,
        categories: item.books.categories,
        averageRating: item.books.average_rating,
        ratingsCount: item.books.ratings_count,
      } : undefined
    }));

    return NextResponse.json(books);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add a book to user's reading list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { book } = body;

    if (!book || !book.id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // First, ensure the book exists in the books table
    const { data: existingBook } = await supabase
      .from('books')
      .select('id')
      .eq('id', book.id)
      .single();

    if (!existingBook) {
      // Insert the book into the books table
      const { error: insertBookError } = await supabase
        .from('books')
        .insert({
          id: book.id,
          title: book.title,
          authors: book.authors,
          description: book.description,
          image_links: book.imageLinks,
          published_date: book.publishedDate,
          publisher: book.publisher,
          page_count: book.pageCount,
          categories: book.categories,
          average_rating: book.averageRating,
          ratings_count: book.ratingsCount,
        });

      if (insertBookError) {
        throw new Error(`Failed to save book: ${insertBookError.message}`);
      }
    }

    // Get the user ID as UUID
    const userId = session.user.id;

    // Check if user already has this book
    const { data: existingUserBook } = await supabase
      .from('user_currently_reading')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', book.id)
      .single();

    if (existingUserBook) {
      return NextResponse.json({ error: 'Book already in your reading list' }, { status: 400 });
    }

    // Add the book to user's reading list
    const { data: newUserBook, error: insertError } = await supabase
      .from('user_currently_reading')
      .insert({
        user_id: userId,
        book_id: book.id,
        started_date: book.startedDate ? new Date(book.startedDate).toISOString() : new Date().toISOString(),
      })
      .select(`
        id,
        user_id,
        book_id,
        started_date,
        created_at,
        books (
          id,
          title,
          authors,
          description,
          image_links,
          published_date,
          publisher,
          page_count,
          categories,
          average_rating,
          ratings_count
        )
      `)
      .single();

    if (insertError) {
      console.error('Insert error details:', insertError);
      throw new Error(`Failed to add book: ${insertError.message}`);
    }

    // Handle books relation - can be array or single object
    const bookData = Array.isArray(newUserBook.books) 
      ? newUserBook.books[0] 
      : newUserBook.books;

    const response = {
      id: newUserBook.id,
      userId: newUserBook.user_id,
      bookId: newUserBook.book_id,
      startedDate: newUserBook.started_date,
      createdAt: newUserBook.created_at,
      book: bookData ? {
        id: bookData.id,
        title: bookData.title,
        authors: bookData.authors,
        description: bookData.description,
        imageLinks: bookData.image_links,
        publishedDate: bookData.published_date,
        publisher: bookData.publisher,
        pageCount: bookData.page_count,
        categories: bookData.categories,
        averageRating: bookData.average_rating,
        ratingsCount: bookData.ratings_count,
      } : undefined
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a book from user's reading list
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const readingId = searchParams.get('id');

    if (!bookId && !readingId) {
      return NextResponse.json({ error: 'Book ID or reading ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('user_currently_reading')
      .delete()
      .eq('user_id', session.user.id);

    if (readingId) {
      query = query.eq('id', readingId);
    } else if (bookId) {
      query = query.eq('book_id', bookId);
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
