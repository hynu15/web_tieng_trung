import { AppShell } from '@/components/AppShell';
import { requireRole } from '@/lib/auth';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('teacher');
  return (
    <AppShell
      name={profile.full_name}
      roleLabel="Giáo viên"
      links={[
        { href: '/teacher', label: 'Tổng quan' },
        { href: '/teacher/lessons', label: 'Bài giảng' },
        { href: '/teacher/assignments', label: 'Bài tập' },
        { href: '/teacher/students', label: 'Học viên' },
      ]}
    >
      {children}
    </AppShell>
  );
}
