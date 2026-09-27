import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { formatDate, isLate } from '@/lib/format';
import { SubmitButton } from '@/components/SubmitButton';
import { createClass } from './actions';

export default async function TeacherHome() {
  const { supabase } = await requireRole('teacher');

  const [{ data: classes }, { data: pending }] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, hsk_level, join_code, class_members(count)')
      .order('created_at'),
    supabase
      .from('submissions')
      .select(
        'id, submitted_at, assignment:assignments(title, due_at), student:profiles(full_name)',
      )
      .eq('status', 'submitted')
      .order('submitted_at'),
  ]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h1>Bài chờ chấm</h1>
        <p className="mt-1 text-muted">
          {pending?.length
            ? `${pending.length} bài, nộp sớm nhất ở trên cùng.`
            : 'Đã chấm hết. Bài mới nộp sẽ hiện ở đây.'}
        </p>
        {!!pending?.length && (
          <ul className="rows mt-4">
            {pending.map((s) => {
              const late = isLate(s.submitted_at, s.assignment?.due_at);
              return (
                <li key={s.id}>
                  <Link
                    href={`/teacher/submissions/${s.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-paper"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.student?.full_name || 'Học viên'}</p>
                      <p className="truncate text-sm text-muted">{s.assignment?.title}</p>
                    </div>
                    {late && <span className="tag-late">Nộp muộn</span>}
                    <span className="hidden text-sm text-muted sm:block">
                      {formatDate(s.submitted_at)}
                    </span>
                    <span className="text-sm font-medium text-jade">Chấm</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-6">
        <div>
          <h2>Lớp của bạn</h2>
          {classes?.length ? (
            <ul className="rows mt-3">
              {classes.map((c) => (
                <li key={c.id} className="px-4 py-3">
                  <p className="font-medium">
                    {c.name}{' '}
                    {c.hsk_level && (
                      <span className="text-sm font-normal text-muted">HSK {c.hsk_level}</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {c.class_members?.[0]?.count ?? 0} học viên · Mã vào lớp{' '}
                    <code className="rounded bg-jade-soft px-1.5 py-0.5 font-semibold tracking-wider text-jade-dark">
                      {c.join_code}
                    </code>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Tạo lớp đầu tiên, rồi gửi mã vào lớp cho học viên.
            </p>
          )}
        </div>

        <form action={createClass} className="panel space-y-3">
          <h2 className="text-base">Tạo lớp mới</h2>
          <div>
            <label className="label" htmlFor="name">
              Tên lớp
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="Tiếng Trung giao tiếp K12"
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="hsk_level">
              Trình độ HSK
            </label>
            <select id="hsk_level" name="hsk_level" className="field" defaultValue="">
              <option value="">Không ghi</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  HSK {n}
                </option>
              ))}
            </select>
          </div>
          <SubmitButton pendingText="Đang tạo…">Tạo lớp</SubmitButton>
        </form>
      </section>
    </div>
  );
}
