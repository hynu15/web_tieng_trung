import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { AUTO_GRADED, QUESTION_LABELS, formatDate, isoToVnLocal } from '@/lib/format';
import { questionOptions } from '@/lib/types';
import { SubmitButton } from '@/components/SubmitButton';
import { addQuestion, deleteQuestion, updateAssignment } from '../../actions';

export default async function AssignmentEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole('teacher');

  const { data: a } = await supabase
    .from('assignments')
    .select('id, class_id, title, instructions, due_at, published, questions(*, question_keys(answer))')
    .eq('id', id)
    .order('position', { referencedTable: 'questions' })
    .single();
  if (!a) notFound();

  const [{ data: members }, { data: subs }] = await Promise.all([
    supabase.from('class_members').select('student:profiles(id, full_name)').eq('class_id', a.class_id),
    supabase.from('submissions').select('id, student_id, status, score, submitted_at').eq('assignment_id', id),
  ]);
  const byStudent = new Map((subs ?? []).map((s) => [s.student_id, s]));
  const maxScore = a.questions.reduce((t: number, q) => t + Number(q.points), 0);

  return (
    <div className="space-y-10">
      <Link href="/teacher/assignments" className="text-sm text-muted hover:text-ink">‹ Tất cả bài tập</Link>

      <form action={updateAssignment.bind(null, id)} className="panel grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="title">Tên bài tập</label>
          <input id="title" name="title" defaultValue={a.title} required className="field text-base font-medium" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="instructions">Hướng dẫn</label>
          <textarea id="instructions" name="instructions" defaultValue={a.instructions ?? ''} rows={2} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="due_at">Hạn nộp (giờ Việt Nam)</label>
          <input id="due_at" name="due_at" type="datetime-local" defaultValue={isoToVnLocal(a.due_at)} className="field" />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={a.published} className="h-4 w-4 accent-jade" />
            Giao cho học viên
          </label>
          <SubmitButton>Lưu</SubmitButton>
        </div>
      </form>

      <section>
        <h2>
          Câu hỏi <span className="text-sm font-normal text-muted">· {a.questions.length} câu · tổng {maxScore} điểm</span>
        </h2>
        {a.questions.length > 0 && (
          <ol className="rows mt-3">
            {a.questions.map((q, i: number) => (
              <li key={q.id} className="flex gap-3 px-4 py-3">
                <span className="w-6 shrink-0 pt-0.5 text-sm text-muted">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap" lang="zh-CN">{q.prompt}</p>
                  <p className="mt-1 text-sm text-muted">
                    {QUESTION_LABELS[q.type]} · {Number(q.points)} điểm
                    {questionOptions(q.options).length > 0 && ` · ${questionOptions(q.options).join(' / ')}`}
                  </p>
                  {AUTO_GRADED.includes(q.type) && (
                    <p className="mt-1 text-sm">
                      Đáp án: <span className="font-medium text-jade-dark">{q.question_keys?.answer ?? 'chưa nhập, sẽ chấm tay'}</span>
                    </p>
                  )}
                </div>
                <form action={deleteQuestion.bind(null, q.id, id)}>
                  <button className="btn-danger text-xs">Xoá</button>
                </form>
              </li>
            ))}
          </ol>
        )}

        <form action={addQuestion.bind(null, id)} className="panel mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
          <div>
            <label className="label" htmlFor="type">Dạng câu hỏi</label>
            <select id="type" name="type" className="field">
              {Object.entries(QUESTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="points">Điểm</label>
            <input id="points" name="points" type="number" min="0" step="0.25" defaultValue="1" className="field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="prompt">Đề bài</label>
            <textarea id="prompt" name="prompt" required rows={2} lang="zh-CN" className="field" placeholder="Điền từ thích hợp: 我___越南人。" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="options">Phương án (chỉ cho trắc nghiệm, mỗi dòng một phương án)</label>
            <textarea id="options" name="options" rows={3} className="field" placeholder={'是\n在\n有'} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="answer">Đáp án để chấm tự động</label>
            <input id="answer" name="answer" className="field" placeholder="是" />
            <p className="hint">
              Trắc nghiệm: chép đúng phương án đúng. Nhiều đáp án chấp nhận thì ngăn bằng dấu |, ví dụ: nǐ hǎo|ni3 hao3.
              Tự luận, viết tay và ghi âm không cần đáp án.
            </p>
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>Thêm câu hỏi</SubmitButton>
          </div>
        </form>
      </section>

      <section>
        <h2>Tình hình nộp bài</h2>
        {!members?.length ? (
          <p className="mt-2 text-sm text-muted">Lớp chưa có học viên.</p>
        ) : (
          <ul className="rows mt-3">
            {members.map((m) => {
              const s = byStudent.get(m.student.id);
              const status = s?.status ?? 'none';
              return (
                <li key={m.student.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate">{m.student.full_name || 'Chưa đặt tên'}</span>
                  {s && status === 'graded' && <span className="text-sm font-medium">{Number(s.score)}/{maxScore}</span>}
                  {s && status === 'submitted' && <span className="hidden text-sm text-muted sm:block">{formatDate(s.submitted_at)}</span>}
                  <span className={{ graded: 'tag-graded', submitted: 'tag-submitted' }[status as string] ?? 'tag-draft'}>
                    {{ graded: 'Đã chấm', submitted: 'Chờ chấm' }[status as string] ?? 'Chưa nộp'}
                  </span>
                  {s && s.status !== 'draft' && (
                    <Link href={`/teacher/submissions/${s.id}`} className="text-sm font-medium text-jade">
                      {status === 'graded' ? 'Xem' : 'Chấm'}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
