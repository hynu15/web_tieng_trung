import { expect, test, type Page } from '@playwright/test';
import { TAI_KHOAN, dangNhap } from './helpers';

// Bài của học viên 2, để bộ test này chạy độc lập với student-submit.spec.ts.
async function hocVien2NopBai(page: Page) {
  await dangNhap(page, TAI_KHOAN.hocVien2);
  await page.getByRole('link', { name: /Bài tập 1 — Chào hỏi/ }).click();

  await page.getByRole('radio', { name: 'Cảm ơn' }).check(); // cố tình chọn sai
  await page.getByLabel('Trả lời câu 2').fill('师');
  await page.getByLabel('Trả lời câu 3').fill('zài jiàn');
  await page.getByLabel('Trả lời câu 4').fill('我是学生。');
  await page.getByRole('button', { name: 'Nộp bài' }).click();
  await expect(page.getByText(/Đã nộp lúc/)).toBeVisible();

  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login/);
}

test('giáo viên chấm bài rồi học viên thấy điểm và lời chữa', async ({ page }) => {
  await hocVien2NopBai(page);

  // ---------- Giáo viên ----------
  await dangNhap(page, TAI_KHOAN.giaoVien);

  await expect(page.getByRole('heading', { name: 'Bài chờ chấm' })).toBeVisible();
  await page.getByRole('link', { name: /Trần Thu Hà/ }).click();
  await expect(page.getByRole('heading', { name: 'Trần Thu Hà' })).toBeVisible();

  // Máy đã chấm sẵn ba câu có đáp án: trắc nghiệm sai 0, điền từ 2, pinyin 2.
  await expect(page.getByText('Đáp án: Xin chào')).toBeVisible();

  const oDiem = page.getByLabel('Điểm');
  const oChuaBai = page.getByLabel('Chữa bài');

  // Câu tự luận là câu thứ tư, giáo viên chấm tay.
  await oDiem.nth(3).fill('3');
  await oChuaBai.nth(3).fill('Câu đúng ngữ pháp nhưng còn ngắn, viết thêm một câu nữa.');

  await page.getByRole('textbox', { name: 'Nhận xét chung' }).fill('Em làm tốt, chú ý câu 1.');
  await page.getByRole('button', { name: 'Trả bài cho học viên' }).click();

  // Trả bài xong quay về trang bài tập, bài chuyển sang đã chấm.
  await expect(page).toHaveURL(/\/teacher\/assignments\//);
  await expect(page.getByText('Đã chấm')).toBeVisible();

  await page.getByRole('button', { name: 'Đăng xuất' }).click();

  // ---------- Học viên xem kết quả ----------
  await dangNhap(page, TAI_KHOAN.hocVien2);
  await page.getByRole('link', { name: /Bài tập 1 — Chào hỏi/ }).click();

  // 0 (trắc nghiệm sai) + 2 + 2 + 3 (giáo viên chấm) = 7 trên tổng 16.
  await expect(page.getByText('7/16')).toBeVisible();
  await expect(page.getByText('Giáo viên đã chấm')).toBeVisible();
  await expect(
    page.getByText('Câu đúng ngữ pháp nhưng còn ngắn, viết thêm một câu nữa.'),
  ).toBeVisible();
  await expect(page.getByText('Em làm tốt, chú ý câu 1.')).toBeVisible();

  // Chấm xong vẫn không được lộ đáp án cho học viên.
  await expect(page.getByText('Đáp án: Xin chào')).toHaveCount(0);
});

test('bài đã chấm biến khỏi danh sách chờ chấm', async ({ page }) => {
  await dangNhap(page, TAI_KHOAN.giaoVien);
  await expect(page.getByRole('heading', { name: 'Bài chờ chấm' })).toBeVisible();
  // Chỉ xét học viên 2: các file test khác có thể để lại bài chờ chấm của
  // học viên khác, nên không khẳng định danh sách rỗng.
  await expect(page.getByRole('link', { name: /Trần Thu Hà/ })).toHaveCount(0);
});
