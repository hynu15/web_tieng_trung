import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lớp Hán ngữ',
  description: 'Bài giảng, bài tập và chữa bài tiếng Trung',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#F5F6F3' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Noto+Serif+SC:wght@500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
