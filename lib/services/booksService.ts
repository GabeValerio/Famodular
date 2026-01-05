export interface BookSearchResult {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
}

// Google Books API response structure
interface GoogleBooksItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    publishedDate?: string;
    publisher?: string;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
  };
}

export interface BookSearchResponse {
  items?: GoogleBooksItem[];
  totalItems: number;
  kind: string;
}

export interface CurrentlyReadingBook {
  id: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  startedDate?: string;
}

export const searchBooks = async (query: string, maxResults: number = 10): Promise<BookSearchResult[]> => {
  try {
    const url = new URL('/api/books/search', window.location.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('maxResults', maxResults.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data: BookSearchResponse = await response.json();

    if (!data.items) {
      return [];
    }

    return data.items.map((item: GoogleBooksItem): BookSearchResult => ({
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors || ['Unknown Author'],
      description: item.volumeInfo.description,
      imageLinks: item.volumeInfo.imageLinks,
      publishedDate: item.volumeInfo.publishedDate,
      publisher: item.volumeInfo.publisher,
      pageCount: item.volumeInfo.pageCount,
      categories: item.volumeInfo.categories,
      averageRating: item.volumeInfo.averageRating,
      ratingsCount: item.volumeInfo.ratingsCount,
    }));
  } catch (error) {
    console.error('Error searching books:', error);
    throw new Error(`Failed to search books: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getBookById = async (bookId: string): Promise<BookSearchResult | null> => {
  try {
    const response = await fetch(`/api/books/${bookId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const item = await response.json();

    return {
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors || ['Unknown Author'],
      description: item.volumeInfo.description,
      imageLinks: item.volumeInfo.imageLinks,
      publishedDate: item.volumeInfo.publishedDate,
      publisher: item.volumeInfo.publisher,
      pageCount: item.volumeInfo.pageCount,
      categories: item.volumeInfo.categories,
      averageRating: item.volumeInfo.averageRating,
      ratingsCount: item.volumeInfo.ratingsCount,
    };
  } catch (error) {
    console.error('Error getting book by ID:', error);
    throw new Error(`Failed to get book: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getBookCoverUrl = (book: BookSearchResult, size: 'small' | 'medium' | 'large' = 'medium'): string | undefined => {
  if (!book.imageLinks) return undefined;

  // Prefer higher quality images, fallback to lower quality
  switch (size) {
    case 'large':
      return book.imageLinks.extraLarge || book.imageLinks.large || book.imageLinks.medium || book.imageLinks.thumbnail;
    case 'medium':
      return book.imageLinks.medium || book.imageLinks.thumbnail || book.imageLinks.smallThumbnail;
    case 'small':
      return book.imageLinks.smallThumbnail || book.imageLinks.thumbnail;
    default:
      return book.imageLinks.thumbnail;
  }
};

export const formatBookAuthors = (authors: string[]): string => {
  if (authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors[0]} et al.`;
};
