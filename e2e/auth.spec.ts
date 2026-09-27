import { expect, test } from '@playwright/test';
import { TAI_KHOAN, MAT_KHAU, dangNhap } from './helpers';

test('người chưa đăng nhập bị chuyển về trang đăng nhập', async ({ page }) => {
  await page.goto('/student');
  await expect(page).toHaveURL(/\/login/);

  await page.goto('/teacher');
  await expect(page).toHaveURL(/\/login/);
});

test('sai mật khẩu thì báo lỗi và ở lại trang đăng nhập', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(TAI_KHOAN.hocVien1);
  await page.getByLabel('Mật khẩu').fill('mat-khau-sai');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('Email hoặc mật khẩu không đúng.')).toBeVisible();
});

test('học viên vào khu giáo viên thì bị chuyển về khu học viên', async ({ page }) => {
  await dangNhap(page, TAI_KHOAN.hocVien1);
  await page.goto('/teacher');
  await expect(page).toHaveURL(/\/student/);
});

test('giáo viên vào khu học viên thì bị chuyển về khu giáo viên', async ({ page }) => {
  await dangNhap(page, TAI_KHOAN.giaoVien);
  await page.goto('/student');
  await expect(page).toHaveURL(/\/teacher/);
});

test('đăng nhập bằng tài khoản mẫu rồi đăng xuất', async ({ page }) => {
  await dangNhap(page, TAI_KHOAN.hocVien1);
  // Tên hiện ở cột trái trên khổ máy tính; thanh trên đỉnh có bản sao dành cho
  // điện thoại, nên phải chỉ rõ đang xét cái nào.
  await expect(page.getByRole('complementary').getByText('Nguyễn Minh An')).toBeVisible();

  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login/);

  // Nút back không được đưa người vừa đăng xuất trở lại trang trong.
  await page.goto('/student');
  await expect(page).toHaveURL(/\/login/);
});

test('form đăng ký chặn mật khẩu ngắn hơn 8 ký tự ngay tại trình duyệt', async ({ page }) => {
  await page.goto('/login?mode=signup');
  const matKhau = page.getByLabel('Mật khẩu');

  await page.getByLabel('Họ và tên').fill('Người Mới');
  await page.getByLabel('Email').fill('nguoi-moi@test.local');
  await matKhau.fill('123');
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();

  // Thuộc tính minLength chặn ngay, form không gửi đi nên vẫn ở trang đăng ký.
  await expect(page).toHaveURL(/mode=signup/);
  expect(await matKhau.evaluate((el: HTMLInputElement) => el.validity.tooShort)).toBe(true);
});

test('đăng ký tài khoản mới rồi vào được màn hình nhập mã lớp', async ({ page }) => {
  await page.goto('/login?mode=signup');
  await page.getByLabel('Họ và tên').fill('Phạm Thu Trang');
  await page.getByLabel('Email').fill('hv-moi@test.local');
  await page.getByLabel('Mật khẩu').fill(MAT_KHAU);
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();

  // Local đã tắt xác nhận email nên đăng ký xong vào thẳng khu học viên.
  await expect(page).toHaveURL(/\/student/);
  await expect(page.getByRole('heading', { name: 'Vào lớp đầu tiên của bạn' })).toBeVisible();
});

test('học viên mới vào được lớp bằng mã DEMO01', async ({ page }) => {
  await page.goto('/login?mode=signup');
  await page.getByLabel('Họ và tên').fill('Đỗ Gia Huy');
  await page.getByLabel('Email').fill('hv-vao-lop@test.local');
  await page.getByLabel('Mật khẩu').fill(MAT_KHAU);
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page).toHaveURL(/\/student/);

  await page.getByLabel('Mã vào lớp').fill('DEMO01');
  await page.getByRole('button', { name: 'Vào lớp' }).click();

  await expect(page.getByText('Bài tập 1 — Chào hỏi')).toBeVisible();
});

test('mã vào lớp sai thì báo lỗi, không vào lớp nào', async ({ page }) => {
  await page.goto('/login?mode=signup');
  await page.getByLabel('Họ và tên').fill('Vũ Bảo Ngọc');
  await page.getByLabel('Email').fill('hv-ma-sai@test.local');
  await page.getByLabel('Mật khẩu').fill(MAT_KHAU);
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page).toHaveURL(/\/student/);

  await page.getByLabel('Mã vào lớp').fill('SAI999');
  await page.getByRole('button', { name: 'Vào lớp' }).click();

  await expect(page.getByRole('heading', { name: 'Vào lớp đầu tiên của bạn' })).toBeVisible();
});
