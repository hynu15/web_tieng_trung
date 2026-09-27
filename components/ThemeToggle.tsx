'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const KHOA = 'theme';

function themeDangDung(): Theme {
  const daChon = document.documentElement.dataset.theme;
  if (daChon === 'light' || daChon === 'dark') return daChon;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Nút đổi sáng/tối. Trước khi component gắn vào DOM, nút chưa biết máy đang ở
// chế độ nào (server không đọc được localStorage), nên giữ chỗ bằng một ô trống
// cùng kích thước để nút không nhảy chỗ khi trang hiện ra.
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(themeDangDung());
  }, []);

  function doi() {
    const moi: Theme = themeDangDung() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = moi;
    try {
      localStorage.setItem(KHOA, moi);
    } catch {
      // Trình duyệt chặn lưu trữ (vd. cửa sổ ẩn danh): vẫn đổi được cho phiên này.
    }
    setTheme(moi);
  }

  if (theme === null) return <span className="h-9 w-9" aria-hidden="true" />;

  const sangSangToi = theme === 'light';
  return (
    <button
      type="button"
      onClick={doi}
      title={sangSangToi ? 'Chuyển sang nền tối' : 'Chuyển sang nền sáng'}
      aria-label={sangSangToi ? 'Chuyển sang nền tối' : 'Chuyển sang nền sáng'}
      className="inline-grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-muted hover:text-ink"
    >
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {sangSangToi ? (
          <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
          </>
        )}
      </svg>
    </button>
  );
}
