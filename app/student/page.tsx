import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { formatDate, isOverdue } from '@/lib/format';
import { HanziWord } from '@/components/Tianzige';
import { SubmitButton } from '@/components/SubmitButton';
import { joinClass } from './actions';

function JoinForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action={joinClass} className={compact ? 'flex gap-2' : 'panel max-w-sm space-y-3'}>
      {!compact && (
        <label className="label" htmlFor="code">
          Mã vào lớp
        </label>
      )}
      <input
        id="code"
        name="code"
        required
        maxLength={6}
        autoComplete="off"
        placeholder="VD: 3FA9C1"
        className="field uppercase tracking-widest"
        aria-label="Mã vào lớp"
      />
      <SubmitButton
        className={compact ? 'btn-ghost' : 'btn-primary w-full'}
        pendingText="Đang vào…"
      >
        Vào lớp
      </SubmitButton>
    </form>
  );
}

export default async function StudentHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase, profile } = await requireRole('student');

  const { data: memberships } = await supabase
    .from('class_members')
    .select(
      'class:classes(id, name, hsk_level, teacher:profiles!classes_teacher_id_fkey(full_name))',
    )
    .eq('student_id', profile.id);

  if (!memberships?.length) {
    return (
      <div className="space-y-6">
        <HanziWord text="欢迎" size={72} />
        <h1>Vào lớp đầu tiên của bạn</h1>
        <p className="max-w-md text-muted">
          Nhập mã 6 ký tự giáo viên đã gửi. Sau khi vào lớp, bài giảng và bài tập sẽ hiện ở đây.
        </p>
        {error && <p className="red-ink max-w-sm">{error}</p>}
        <JoinForm />
      </div>
    );
  }

  const [{ data: assignments }, { data: lessons }] = await Promise.all([
    supabase
      .from('assignments')
      .select('id, title, due_at, class:classes(name), submissions(status, score)')
      .eq('published', true)
      .order('due_at', { ascending: true, nullsFirst: false }),
    supabase
      .from('lessons')
      .select('id, title, summary, class:classes(name), vocab(hanzi)')
      .eq('published', true)
      .order('created_at', { ascending: false }),
  ]);

  const todo = (assignments ?? []).filter(
    (a) => !a.submissions[0] || a.submissions[0].status === 'draft',
  );
  const done = (assignments ?? []).filter(
    (a) => a.submissions[0] && a.submissions[0].status !== 'draft',
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <section className="space-y-8">
        <div>
          <h1>Bài cần làm</h1>
          {todo.length === 0 ? (
            <p className="mt-2 text-muted">
              Không còn bài nào. Ôn lại từ vựng ở các bài giảng bên cạnh.
            </p>
          ) : (
            <ul className="rows mt-4">
              {todo.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/student/assignments/${a.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-paper"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="text-sm text-muted">Hạn {formatDate(a.due_at)}</p>
                    </div>
                    {isOverdue(a.due_at) && <span className="tag-late">Quá hạn</span>}
                    <span className="text-sm font-medium text-jade">Làm bài</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {done.length > 0 && (
          <div>
            <h2>Đã nộp</h2>
            <ul className="rows mt-3">
              {done.map((a) => {
                const s = a.submissions[0];
                return (
                  <li key={a.id}>
                    <Link
                      href={`/student/assignments/${a.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-paper"
                    >
                      <span className="min-w-0 flex-1 truncate">{a.title}</span>
                      {s.status === 'graded' ? (
                        <span className="tag-graded">{Number(s.score)} điểm · xem lời chữa</span>
                      ) : (
                        <span className="tag-submitted">Chờ chấm</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div>
          <h2>Bài giảng</h2>
          {!lessons?.length ? (
            <p className="mt-2 text-sm text-muted">Giáo viên chưa đăng bài giảng nào.</p>
          ) : (
            <ul className="rows mt-3">
              {lessons.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/student/lessons/${l.id}`}
                    className="block px-4 py-3 hover:bg-paper"
                  >
                    <p className="font-medium">{l.title}</p>
                    {l.vocab.length > 0 && (
                      <p className="mt-1 truncate font-hanzi text-muted" lang="zh-CN">
                        {l.vocab.map((v) => v.hanzi).join('、')}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-sm text-muted">
          <p>
            Lớp:{' '}
            {memberships
              .map(
                (m) =>
                  `${m.class.name}${m.class.teacher?.full_name ? ` (GV ${m.class.teacher.full_name})` : ''}`,
              )
              .join(', ')}
          </p>
          <p className="mb-2 mt-4">Vào thêm lớp khác</p>
          {error && <p className="red-ink mb-2">{error}</p>}
          <JoinForm compact />
        </div>
      </section>
    </div>
  );
}
