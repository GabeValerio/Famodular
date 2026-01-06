"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { BookOpen } from 'lucide-react';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: {
    id: string;
    title: string;
    authors: string[];
    coverUrl?: string;
  } | null;
  memberName: string;
}

export function BookModal({ isOpen, onClose, book, memberName }: BookModalProps) {
  if (!book) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Book Details</span>
          </DialogTitle>
          <DialogDescription>
            Currently being read by {memberName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Large book cover */}
          <div className="flex justify-center">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-48 w-32 rounded-lg object-cover shadow-lg border border-gray-200"
              />
            ) : (
              <div className="h-48 w-32 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Book information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg leading-tight">{book.title}</h3>
            {book.authors && book.authors.length > 0 && (
              <p className="text-sm text-muted-foreground">
                by {book.authors.join(', ')}
              </p>
            )}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Click on book covers to view details
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
