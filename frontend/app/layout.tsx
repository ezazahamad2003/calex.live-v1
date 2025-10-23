import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NDA Generator - Automated Legal Documents',
  description: 'Generate and manage NDAs with lawyer review',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
