'use client';

import { useState, useCallback } from 'react';
import { searchBooks, BookSearchResult, getBookCoverUrl, formatBookAuthors } from '@/lib/services/booksService';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, Search, Book, X } from 'lucide-react';
import Image from 'next/image';

interface BookSearchProps {
  onBookSelect: (book: BookSearchResult) => void;
  selectedBook?: BookSearchResult | null;
  onClearSelection?: () => void;
}

export function BookSearch({ onBookSelect, selectedBook, onClearSelection }: BookSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await searchBooks(query.trim());
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search books');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBookSelect = (book: BookSearchResult) => {
    onBookSelect(book);
    setQuery('');
    setResults([]);
  };

  const handleClearSelection = () => {
    if (onClearSelection) {
      onClearSelection();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search for a book by title or author..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {/* Currently Selected Book */}
      {selectedBook && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {selectedBook.imageLinks?.thumbnail && (
                  <div className="relative w-12 h-16 shrink-0">
                    <Image
                      src={getBookCoverUrl(selectedBook, 'small') || selectedBook.imageLinks.thumbnail}
                      alt={`Cover of ${selectedBook.title}`}
                      fill
                      className="object-cover rounded"
                      sizes="48px"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-medium text-green-800">
                    Currently Reading
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    <div className="font-medium">{selectedBook.title}</div>
                    <div className="text-xs">by {formatBookAuthors(selectedBook.authors)}</div>
                  </CardDescription>
                </div>
              </div>
              {onClearSelection && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Search Results:</h4>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {results.map((book) => (
              <Card
                key={book.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleBookSelect(book)}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {book.imageLinks?.thumbnail && (
                      <div className="relative w-10 h-14 shrink-0">
                        <Image
                          src={getBookCoverUrl(book, 'small') || book.imageLinks.thumbnail}
                          alt={`Cover of ${book.title}`}
                          fill
                          className="object-cover rounded"
                          sizes="40px"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h5 className="font-medium text-sm line-clamp-2">{book.title}</h5>
                      <p className="text-xs text-gray-600">
                        by {formatBookAuthors(book.authors)}
                      </p>
                      {book.publishedDate && (
                        <p className="text-xs text-gray-500">
                          Published: {new Date(book.publishedDate).getFullYear()}
                        </p>
                      )}
                      {book.categories && book.categories.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {book.categories.slice(0, 2).map((category, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      <Book className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && query && !isLoading && !error && (
        <div className="text-sm text-gray-500 text-center py-4">
          No books found. Try a different search term.
        </div>
      )}
    </div>
  );
}

