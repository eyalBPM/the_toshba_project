import type { Metadata } from 'next';
import { Providers } from '@/ui/providers/providers';
import { AppHeader } from '@/ui/components/app-header';
import './globals.css';

export const metadata: Metadata = {
  title: 'תושב"ע - בסיס ידע קהילתי',
  description: 'בסיס ידע קהילתי לתורה שבעל פה',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
