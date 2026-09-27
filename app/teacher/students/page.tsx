import { requireRole } from '@/lib/auth';
import { removeStudent } from '../actions';

export default async function StudentsPage() {
  const { supabase } = await requireRole('teacher');
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, join_code, class_members(joined_at, student:profiles(id, full_name))')
    .order('created_at');

  return (
    <div className="space-y-10">
      <h1>Học viên</h1>
      {!classes?.length && <p className="text-muted">Chưa có lớp nào. Tạo lớp ở trang Tổng quan.</p>}
      {classes?.map((c) => (
        <section key={c.id}>
          <h2>
            {c.name} <span className="text-sm font-normal text-muted">· {c.class_members.length} người · mã {c.join_code}</span>
          </h2>
          {c.class_members.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Chưa ai vào lớp. Gửi mã {c.join_code} cho học viên.</p>
          ) : (
            <ul className="rows mt-3">
              {c.class_members.map((m) => (
                <li key={m.student.id} className="flex items-center justify-between px-4 py-2.5">
                  <span>{m.student.full_name || 'Chưa đặt tên'}</span>
                  <form action={removeStudent.bind(null, c.id, m.student.id)}>
                    <button className="btn-danger text-xs">Xoá khỏi lớp</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
