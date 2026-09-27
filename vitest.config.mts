import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    // Chỉ test hàm thuần trong lib/. Luồng người dùng do Playwright lo,
    // phân quyền database do pgTAP lo.
    include: ['lib/**/*.test.ts'],
    environment: 'node',
  },
});
