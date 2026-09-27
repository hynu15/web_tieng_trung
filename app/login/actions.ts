'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const q = (s: string) => encodeURIComponent(s);

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
  });
  if (error) redirect(`/login?error=${q('Email hoặc mật khẩu không đúng.')}`);
  redirect('/');
}

// Đăng ký luôn tạo tài khoản học viên. Giáo viên được nâng quyền bằng SQL.
export async function signup(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get('password'));
  if (password.length < 8)
    redirect(`/login?mode=signup&error=${q('Mật khẩu cần ít nhất 8 ký tự.')}`);

  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get('email')),
    password,
    options: { data: { full_name: String(formData.get('full_name')).trim() } },
  });
  if (error) redirect(`/login?mode=signup&error=${q(error.message)}`);
  if (data.session) redirect('/');
  redirect(`/login?message=${q('Mở email để xác nhận tài khoản, sau đó đăng nhập.')}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
