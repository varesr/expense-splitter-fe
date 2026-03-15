import type { Metadata } from 'next';
import { QueryProvider } from '@/lib/query-provider';
import { AuthHeader } from '@/components/layouts/auth-header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Expense Splitter',
  description: 'Track and split expenses with ease',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthHeader />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
