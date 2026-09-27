import { expect, type Page } from '@playwright/test';

/** Mật khẩu chung của mọi tài khoản trong supabase/seed.sql. */
export const MAT_KHAU = 'Test12345!';

export const TAI_KHOAN = {
  giaoVien: 'giaovien@test.local',
  hocVien1: 'hv1@test.local',
  hocVien2: 'hv2@test.local',
} as const;

export async function dangNhap(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill(MAT_KHAU);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/(teacher|student)/);
}

export async function dangXuat(page: Page) {
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login/);
}
