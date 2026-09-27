import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { SubmitButton } from '@/components/SubmitButton';
import { createLesson } from '../actions';

export default async function LessonsPage() {
  const { supabase } = await requireRole('teacher');
  const [{ data: classes }, { data: lessons }] = await Promise.all([
    supabase.from('classes').select('id, name').order('created_at'),
    supabase.from('lessons')
      .select('id, title, published, class:classes(name), vocab(count), lesson_materials(count)')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h1>Bài giảng</h1>
        {lessons?.length ? (
          <ul className="rows mt-4">
            {lessons.map((l: any) => (
              <li key={l.id}>
                <Link href={`/teacher/lessons/${l.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-paper">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.title}</p>
                    <p className="text-sm text-muted">
                      {l.class?.name} · {l.lesson_materials?.[0]?.count ?? 0} tài liệu · {l.vocab?.[0]?.count ?? 0} từ vựng
                    </p>
                  </div>
                  <span className={l.published ? 'tag-graded' : 'tag-draft'}>{l.published ? 'Đã đăng' : 'Nháp'}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted">Chưa có bài giảng. Tạo bài đầu tiên ở khung bên cạnh.</p>
        )}
      </section>

      <form action={createLesson} className="panel h-fit space-y-3">
        <h2 className="text-base">Bài giảng mới</h2>
        {!classes?.length ? (
          <p className="text-sm text-muted">Cần tạo lớp trước ở trang Tổng quan.</p>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="class_id">Lớp</label>
              <select id="class_id" name="class_id" className="field">
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="title">Tên bài</label>
              <input id="title" name="title" required placeholder="Bài 3: 你叫什么名字？" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="summary">Mô tả ngắn</label>
              <textarea id="summary" name="summary" rows={3} className="field" />
            </div>
            <SubmitButton pendingText="Đang tạo…">Tạo và thêm nội dung</SubmitButton>
          </>
        )}
      </form>
    </div>
  );
}
