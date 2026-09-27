import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export type Role = 'teacher' | 'student';
export type Profile = { id: string; role: Role; full_name: string };

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

  return { supabase, user, profile: profile as Profile };
}

export async function requireRole(role: Role) {
  const session = await getSession();
  if (session.profile.role !== role) {
    redirect(session.profile.role === 'teacher' ? '/teacher' : '/student');
  }
  return session;
}
