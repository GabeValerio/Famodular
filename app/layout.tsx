import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { CartProvider } from '@/lib/CartContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Famodular - Community Center Platform',
  description: 'A modular community center platform for groups of any kind. Customize your experience with the modules you need—calendars, todos, check-ins, goals, finance, and more',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Providers>
            {children}
          </Providers>
        </CartProvider>
      </body>
    </html>
  );
}