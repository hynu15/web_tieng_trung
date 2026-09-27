import type { Config } from 'tailwindcss';

// Mọi màu là biến CSS khai trong app/globals.css, nhờ vậy chế độ sáng và tối
// dùng chung một tên class. Cú pháp `rgb(var(--x) / <alpha-value>)` giữ cho các
// biến thể độ mờ của Tailwind (vd. `bg-jade/20`) vẫn chạy.
const token = (ten: string) => `rgb(var(--${ten}) / <alpha-value>)`;

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  // Chế độ tối bật bằng thuộc tính data-theme trên thẻ html, không bằng class.
  darkMode: ['variant', '&:where([data-theme="dark"] *)'],
  theme: {
    extend: {
      colors: {
        paper: token('paper'), // nền trang
        surface: token('surface'), // nền thẻ, ô nhập, thanh điều hướng
        ink: token('ink'), // chữ chính
        muted: token('muted'), // chữ phụ
        line: token('line'), // viền, kẻ ô
        jade: {
          DEFAULT: token('jade'), // thao tác chính
          soft: token('jade-soft'), // nền nhạt của trạng thái tích cực
          dark: token('jade-strong'), // chữ jade trên nền nhạt, và trạng thái hover
        },
        seal: {
          DEFAULT: token('seal'), // lời chữa của giáo viên, lỗi, quá hạn
          soft: token('seal-soft'),
        },
        // Màu chữ đặt trên nền jade hoặc seal đặc. Nền sáng là trắng, nền tối
        // là gần đen, vì jade và seal ở nền tối được làm sáng lên cho đủ tương phản.
        'on-accent': token('on-accent'),
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        hanzi: ['"Noto Serif SC"', '"Songti SC"', '"SimSun"', 'serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
} satisfies Config;
