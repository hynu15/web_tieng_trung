import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { SubmitButton } from '@/components/SubmitButton';
import { createAssignment } from '../actions';

export default async function AssignmentsPage() {
  const { supabase } = await requireRole('teacher');
  const [{ data: classes }, { data: lessons }, { data: assignments }] = await Promise.all([
    supabase.from('classes').select('id, name').order('created_at'),
    supabase
      .from('lessons')
      .select('id, title, class_id')
      .order('created_at', { ascending: false }),
    supabase
      .from('assignments')
      .select('id, title, due_at, published, class:classes(name), submissions(status)')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h1>Bài tập</h1>
        {assignments?.length ? (
          <ul className="rows mt-4">
            {assignments.map((a) => {
              const toGrade = a.submissions.filter((s) => s.status === 'submitted').length;
              const turnedIn = a.submissions.filter((s) => s.status !== 'draft').length;
              return (
                <li key={a.id}>
                  <Link
                    href={`/teacher/assignments/${a.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-paper"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="text-sm text-muted">
                        {a.class?.name} · Hạn {formatDate(a.due_at)} · {turnedIn} bài đã nộp
                      </p>
                    </div>
                    {toGrade > 0 && <span className="tag-submitted">{toGrade} chờ chấm</span>}
                    {!a.published && <span className="tag-draft">Nháp</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-muted">Chưa có bài tập nào.</p>
        )}
      </section>

      <form action={createAssignment} className="panel h-fit space-y-3">
        <h2 className="text-base">Bài tập mới</h2>
        {!classes?.length ? (
          <p className="text-sm text-muted">Cần tạo lớp trước ở trang Tổng quan.</p>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="class_id">
                Lớp
              </label>
              <select id="class_id" name="class_id" className="field">
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="lesson_id">
                Gắn với bài giảng
              </label>
              <select id="lesson_id" name="lesson_id" className="field" defaultValue="">
                <option value="">Không gắn</option>
                {lessons?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="title">
                Tên bài tập
              </label>
              <input
                id="title"
                name="title"
                required
                className="field"
                placeholder="Luyện tập bài 3"
              />
            </div>
            <div>
              <label className="label" htmlFor="instructions">
                Hướng dẫn
              </label>
              <textarea id="instructions" name="instructions" rows={3} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="due_at">
                Hạn nộp (giờ Việt Nam)
              </label>
              <input id="due_at" name="due_at" type="datetime-local" className="field" />
            </div>
            <SubmitButton pendingText="Đang tạo…">Tạo và thêm câu hỏi</SubmitButton>
          </>
        )}
      </form>
    </div>
  );
}
