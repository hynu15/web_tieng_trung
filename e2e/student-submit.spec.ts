import path from 'node:path';
import { expect, test } from '@playwright/test';
import { TAI_KHOAN, dangNhap } from './helpers';

// Playwright chạy từ thư mục gốc của project.
const ANH_BAI_VIET = path.resolve('e2e/fixtures/bai-viet-tay.png');

test('học viên làm đủ 6 dạng câu hỏi rồi nộp bài', async ({ page }) => {
  await dangNhap(page, TAI_KHOAN.hocVien1);

  await page.getByRole('link', { name: /Bài tập 1 — Chào hỏi/ }).click();
  await expect(page.getByRole('heading', { name: 'Bài tập 1 — Chào hỏi' })).toBeVisible();

  // Câu 1 — trắc nghiệm
  await page.getByRole('radio', { name: 'Xin chào' }).check();

  // Câu 2 — điền từ
  await page.getByLabel('Trả lời câu 2').fill('师');

  // Câu 3 — pinyin, cố tình viết hoa và thừa khoảng trắng để thấy phần chuẩn hoá
  await page.getByLabel('Trả lời câu 3').fill('  ZAI4   jian4 ');

  // Câu 4 — tự luận
  await page.getByLabel('Trả lời câu 4').fill('你好！我叫明安。我是学生。');

  // Câu 5 — ảnh bài viết tay
  await page.getByLabel('Ảnh bài viết tay').setInputFiles(ANH_BAI_VIET);

  // Câu 6 — ghi âm, dùng micro giả của Chromium
  await page.getByRole('button', { name: /Ghi âm/ }).click();
  await expect(page.getByRole('button', { name: /Dừng/ })).toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /Dừng/ }).click();
  await expect(page.getByRole('button', { name: /Ghi lại/ })).toBeVisible();

  await page.getByRole('button', { name: 'Nộp bài' }).click();

  // Nộp xong bài bị khoá và học viên thấy trạng thái chờ chấm.
  await expect(page.getByText(/Đã nộp lúc/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nộp bài' })).toHaveCount(0);
});

test('nộp xong thì học viên không thấy đáp án và cũng không thấy điểm', async ({ page }) => {
  await dangNhap(page, TAI_KHOAN.hocVien1);
  await page.getByRole('link', { name: /Bài tập 1 — Chào hỏi/ }).click();

  await expect(page.getByText(/Đã nộp lúc/)).toBeVisible();
  // 'đáp án bí mật' nằm trong question_keys, RLS chặn học viên đọc bảng này.
  await expect(page.getByText(/Đáp án:/)).toHaveCount(0);
  await expect(page.getByText(/Máy chấm/)).toHaveCount(0);
});

test('bài đã nộp chuyển sang mục đã làm ở trang lớp học', async ({ page }) => {
  await dangNhap(page, TAI_KHOAN.hocVien1);
  await expect(page.getByText('Chờ chấm')).toBeVisible();
});
