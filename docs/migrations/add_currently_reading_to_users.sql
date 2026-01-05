-- Migration: Create books and user_currently_reading tables
-- This allows users to display what book they're currently reading on their profile
-- Books are stored in a separate table for better normalization

-- Create books table to store book information
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors JSONB,
  description TEXT,
  image_links JSONB,
  published_date TEXT,
  publisher TEXT,
  page_count INTEGER,
  categories JSONB,
  average_rating REAL,
  ratings_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_currently_reading table to link users to their current book
CREATE TABLE IF NOT EXISTS user_currently_reading (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  started_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- Each user can only have one currently reading book
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_currently_reading_user_id ON user_currently_reading(user_id);
CREATE INDEX IF NOT EXISTS idx_user_currently_reading_book_id ON user_currently_reading(book_id);

-- Add comments to document the tables and columns
COMMENT ON TABLE books IS 'Stores book information from Google Books API';
COMMENT ON TABLE user_currently_reading IS 'Links users to their currently reading book';
COMMENT ON COLUMN books.id IS 'Google Books API book ID';
COMMENT ON COLUMN books.authors IS 'JSON array of book authors';
COMMENT ON COLUMN books.image_links IS 'JSON object with various image sizes from Google Books API';
COMMENT ON COLUMN user_currently_reading.started_date IS 'When the user started reading this book';
