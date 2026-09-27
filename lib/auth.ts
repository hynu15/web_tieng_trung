import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import type { Role } from './types';

export type { Role };

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single();
  if (!profile) redirect('/login');

  // profile đã có kiểu từ Database generic, không cần ép kiểu.
  return { supabase, user, profile };
}

export async function requireRole(role: Role) {
  const session = await getSession();
  if (session.profile.role !== role) {
    redirect(session.profile.role === 'teacher' ? '/teacher' : '/student');
  }
  return session;
}
