import { AppShell } from '@/components/AppShell';
import { requireRole } from '@/lib/auth';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('student');
  return (
    <AppShell name={profile.full_name} roleLabel="Học viên" links={[{ href: '/student', label: 'Lớp học' }]}>
      {children}
    </AppShell>
  );
}
