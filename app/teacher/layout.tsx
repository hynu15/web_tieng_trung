import { AppShell } from '@/components/AppShell';
import { requireRole } from '@/lib/auth';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('teacher');
  return (
    <AppShell
      name={profile.full_name}
      roleLabel="Giáo viên"
      links={[
        { href: '/teacher', label: 'Tổng quan', icon: 'tong-quan' },
        { href: '/teacher/lessons', label: 'Bài giảng', icon: 'bai-giang' },
        { href: '/teacher/assignments', label: 'Bài tập', icon: 'bai-tap' },
        { href: '/teacher/students', label: 'Học viên', icon: 'hoc-vien' },
      ]}
    >
      {children}
    </AppShell>
  );
}
