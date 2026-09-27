import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { AUTO_GRADED, QUESTION_LABELS, formatDate } from '@/lib/format';
import { signedUrls } from '@/lib/storage';
import { AudioRecorder } from '@/components/AudioRecorder';
import { SubmitButton } from '@/components/SubmitButton';
import { gradeSubmission } from '../../actions';

export default async function GradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole('teacher');

  const { data: sub } = await supabase
    .from('submissions')
    .select(`id, status, submitted_at, score, teacher_comment, feedback_audio_path,
      student:profiles(full_name),
      assignment:assignments(id, title, due_at, questions(id, type, prompt, options, points, position, question_keys(answer))),
      submission_answers(*)`)
    .eq('id', id)
    .single();
  if (!sub) notFound();

  const s: any = sub;
  const questions = [...s.assignment.questions].sort((a: any, b: any) => a.position - b.position);
  const answerByQ = new Map(s.submission_answers.map((x: any) => [x.question_id, x]));
  const urls = await signedUrls(supabase, 'submissions', [
    ...s.submission_answers.map((x: any) => x.file_path),
    s.feedback_audio_path,
  ]);
  const late = s.assignment.due_at && new Date(s.submitted_at) > new Date(s.assignment.due_at);

  return (
    <div className="space-y-8">
      <Link href={`/teacher/assignments/${s.assignment.id}`} className="text-sm text-muted hover:text-ink">
        ‹ {s.assignment.title}
      </Link>
      <header>
        <h1>{s.student?.full_name || 'Học viên'}</h1>
        <p className="mt-1 text-muted">
          Nộp {formatDate(s.submitted_at)} {late && <span className="tag-late ml-1">Nộp muộn</span>}
          {s.status === 'graded' && ` · Đã chấm ${Number(s.score)} điểm, có thể sửa và lưu lại`}
        </p>
      </header>

      <form action={gradeSubmission.bind(null, id)} className="space-y-6">
        <ol className="space-y-4">
          {questions.map((q: any, i: number) => {
            const ans: any = answerByQ.get(q.id);
            const auto = AUTO_GRADED.includes(q.type);
            return (
              <li key={q.id} className="panel space-y-3">
                <div className="flex gap-2 text-sm text-muted">
                  <span>Câu {i + 1}</span>·<span>{QUESTION_LABELS[q.type]}</span>·<span>{Number(q.points)} điểm</span>
                </div>
                <p className="whitespace-pre-wrap" lang="zh-CN">{q.prompt}</p>

                <div className="rounded-md bg-paper p-3">
                  {!ans ? (
                    <p className="text-sm text-muted">Bỏ trống câu này.</p>
                  ) : (
                    <>
                      {ans.text_answer && (
                        <p className="whitespace-pre-wrap font-hanzi text-lg" lang="zh-CN">{ans.text_answer}</p>
                      )}
                      {ans.file_path && q.type === 'speaking' && (
                        <audio src={urls[ans.file_path]} controls className="w-full" />
                      )}
                      {ans.file_path && q.type !== 'speaking' && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a href={urls[ans.file_path]} target="_blank" rel="noreferrer">
                          <img src={urls[ans.file_path]} alt="Bài viết tay của học viên" className="max-h-[480px] rounded border border-line" />
                        </a>
                      )}
                    </>
                  )}
                  {auto && (
                    <p className="mt-2 text-sm text-muted">
                      Đáp án: {q.question_keys?.answer ?? '—'} · Máy chấm:{' '}
                      <span className={Number(ans?.auto_score) > 0 ? 'text-jade-dark' : 'text-seal'}>
                        {ans?.auto_score ?? '—'}
                      </span>
                    </p>
                  )}
                </div>

                {ans && (
                  <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                    <div>
                      <label className="label" htmlFor={`score_${ans.id}`}>Điểm</label>
                      <input
                        id={`score_${ans.id}`} name={`score_${ans.id}`} type="number" step="0.25" min="0" max={q.points}
                        defaultValue={ans.teacher_score ?? ''}
                        placeholder={auto ? String(ans.auto_score ?? 0) : ''}
                        className="field"
                      />
                      {auto && <p className="hint">Để trống: giữ điểm máy chấm</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor={`comment_${ans.id}`}>Chữa bài</label>
                      <textarea
                        id={`comment_${ans.id}`} name={`comment_${ans.id}`} rows={2} defaultValue={ans.comment ?? ''}
                        className="field border-seal/40 text-seal focus:border-seal focus:ring-seal/20"
                        placeholder="Ví dụ: 是 dùng để nối hai danh từ, không đi với tính từ."
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <section className="panel space-y-3">
          <h2 className="text-base">Nhận xét chung</h2>
          <textarea
            name="teacher_comment" rows={3} defaultValue={s.teacher_comment ?? ''}
            className="field border-seal/40 text-seal focus:border-seal focus:ring-seal/20"
          />
          {s.feedback_audio_path && urls[s.feedback_audio_path] && (
            <div>
              <p className="label">Nhận xét bằng giọng đã gửi</p>
              <audio src={urls[s.feedback_audio_path]} controls className="w-full" />
            </div>
          )}
          <AudioRecorder name="feedback_audio" label={s.feedback_audio_path ? 'Ghi âm nhận xét mới' : 'Ghi âm nhận xét'} />
        </section>

        <SubmitButton pendingText="Đang trả bài…">Trả bài cho học viên</SubmitButton>
      </form>
    </div>
  );
}
