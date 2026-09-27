import { execFileSync } from 'node:child_process';

// Dựng lại database từ migrations + seed.sql trước mỗi lần chạy e2e, để test
// không phụ thuộc vào những gì lần chạy trước để lại.
//
// Thử lại một lần: ngay sau `supabase start`, container storage đôi khi chưa
// kịp healthy và reset bị bỏ dở với HealthCheckTimeoutError.
export default function globalSetup() {
  for (let lan = 1; lan <= 2; lan++) {
    try {
      execFileSync('npx', ['supabase', 'db', 'reset'], {
        stdio: 'inherit',
        timeout: 5 * 60_000,
      });
      return;
    } catch (loi) {
      if (lan === 2) throw loi;
      console.warn('`supabase db reset` lỗi, chờ 15 giây rồi thử lại…');
      execFileSync('sleep', ['15']);
    }
  }
}
