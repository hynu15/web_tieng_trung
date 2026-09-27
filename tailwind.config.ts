import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F6F3', // nền giấy xám nhạt, hơi lạnh
        ink: '#20252B', // chữ chính
        muted: '#676E68', // chữ phụ
        line: '#DCDFD8', // viền, kẻ ô
        jade: { DEFAULT: '#2F6B5B', soft: '#E3EEE9', dark: '#23523F' }, // màu chính
        seal: { DEFAULT: '#B8322A', soft: '#F7E4E1' }, // mực đỏ chữa bài
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        hanzi: ['"Noto Serif SC"', '"Songti SC"', '"SimSun"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
