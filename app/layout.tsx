import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lớp Hán ngữ',
  description: 'Bài giảng, bài tập và chữa bài tiếng Trung',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F6F4' },
    { media: '(prefers-color-scheme: dark)', color: '#11151A' },
  ],
};

// Chạy trước khi trang vẽ lần đầu: đọc lựa chọn sáng/tối đã lưu và gắn vào thẻ
// html ngay. Nếu để React làm sau khi tải xong, người chọn nền tối sẽ thấy một
// nháy trắng mỗi lần mở trang.
const SCRIPT_THEME = `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Quy tắc no-page-custom-font chỉ đúng với Pages Router; trong App Router
            nạp font bằng <link> trong <head> của root layout là cách chính thống. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Noto+Serif+SC:wght@500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
