import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { QUESTION_LABELS, formatDate, isOverdue } from '@/lib/format';
import { questionOptions } from '@/lib/types';
import { signedUrls } from '@/lib/storage';
import { AudioRecorder } from '@/components/AudioRecorder';
import { SubmitButton } from '@/components/SubmitButton';
import { submitAssignment } from '../../actions';

export default async function AssignmentView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireRole('student');

  const { data: a } = await supabase
    .from('assignments')
    .select(
      'id, title, instructions, due_at, questions(id, type, prompt, options, points, position)',
    )
    .eq('id', id)
    .order('position', { referencedTable: 'questions' })
    .single();
  if (!a) notFound();

  const { data: sub } = await supabase
    .from('submissions')
    .select(
      'id, status, submitted_at, score, teacher_comment, feedback_audio_path, submission_answers(*)',
    )
    .match({ assignment_id: id, student_id: profile.id })
    .maybeSingle();

  const maxScore = a.questions.reduce((t: number, q) => t + Number(q.points), 0);
  const submitted = sub && sub.status !== 'draft';

  const header = (
    <div>
      <Link href="/student" className="text-sm text-muted hover:text-ink">
        ‹ Lớp học
      </Link>
      <h1 className="mt-3">{a.title}</h1>
      <p className="mt-1 text-muted">
        Hạn {formatDate(a.due_at)} · {a.questions.length} câu · {maxScore} điểm
        {!submitted && isOverdue(a.due_at) && (
          <span className="tag-late ml-2">Quá hạn, vẫn nộp được</span>
        )}
      </p>
      {a.instructions && <p className="mt-3 max-w-2xl whitespace-pre-wrap">{a.instructions}</p>}
    </div>
  );

  // ---------- Đã nộp: xem bài và lời chữa ----------
  if (submitted) {
    const graded = sub.status === 'graded';
    const answerByQ = new Map(sub.submission_answers.map((x) => [x.question_id, x]));
    const urls = await signedUrls(supabase, 'submissions', [
      ...sub.submission_answers.map((x) => x.file_path),
      sub.feedback_audio_path,
    ]);

    return (
      <div className="space-y-8">
        {header}
        <div className={graded ? 'panel flex flex-wrap items-baseline gap-x-4 gap-y-1' : 'panel'}>
          {graded ? (
            <>
              <p className="text-3xl font-semibold text-seal">
                {Number(sub.score)}
                <span className="text-lg text-muted">/{maxScore}</span>
              </p>
              <p className="text-muted">Giáo viên đã chấm. Lời chữa màu đỏ nằm dưới từng câu.</p>
            </>
          ) : (
            <p>Đã nộp lúc {formatDate(sub.submitted_at)}. Giáo viên sẽ chấm và trả bài tại đây.</p>
          )}
        </div>

        {graded && (sub.teacher_comment || sub.feedback_audio_path) && (
          <section className="space-y-2">
            <h2>Nhận xét chung</h2>
            {sub.teacher_comment && (
              <p className="red-ink whitespace-pre-wrap">{sub.teacher_comment}</p>
            )}
            {sub.feedback_audio_path && urls[sub.feedback_audio_path] && (
              <audio src={urls[sub.feedback_audio_path]} controls className="w-full" />
            )}
          </section>
        )}

        <ol className="space-y-4">
          {a.questions.map((q, i: number) => {
            const ans = answerByQ.get(q.id);
            const pts = ans?.teacher_score ?? ans?.auto_score;
            return (
              <li key={q.id} className="panel space-y-3">
                <div className="flex justify-between text-sm text-muted">
                  <span>
                    Câu {i + 1} · {QUESTION_LABELS[q.type]}
                  </span>
                  {graded && (
                    <span className="font-medium text-ink">
                      {pts ?? 0}/{Number(q.points)}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap" lang="zh-CN">
                  {q.prompt}
                </p>
                <div className="rounded-md bg-paper p-3">
                  {!ans && <p className="text-sm text-muted">Bạn bỏ trống câu này.</p>}
                  {ans?.text_answer && (
                    <p className="whitespace-pre-wrap font-hanzi text-lg" lang="zh-CN">
                      {ans.text_answer}
                    </p>
                  )}
                  {ans?.file_path && q.type === 'speaking' && (
                    <audio src={urls[ans.file_path]} controls className="w-full" />
                  )}
                  {ans?.file_path && q.type !== 'speaking' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urls[ans.file_path]}
                      alt="Bài bạn đã nộp"
                      className="max-h-96 rounded border border-line"
                    />
                  )}
                </div>
                {graded && ans?.comment && (
                  <p className="red-ink whitespace-pre-wrap">{ans.comment}</p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  // ---------- Chưa nộp: làm bài ----------
  return (
    <div className="space-y-8">
      {header}
      <form action={submitAssignment.bind(null, id)} className="space-y-4">
        <ol className="space-y-4">
          {a.questions.map((q, i: number) => (
            <li key={q.id} className="panel space-y-3">
              <p className="text-sm text-muted">
                Câu {i + 1} · {QUESTION_LABELS[q.type]} · {Number(q.points)} điểm
              </p>
              <p className="whitespace-pre-wrap text-lg" lang="zh-CN">
                {q.prompt}
              </p>

              {q.type === 'multiple_choice' && (
                <fieldset className="space-y-2">
                  <legend className="sr-only">Chọn một đáp án</legend>
                  {questionOptions(q.options).map((opt) => (
                    <label
                      key={opt}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-line px-3 py-2.5 has-[:checked]:border-jade has-[:checked]:bg-jade-soft"
                    >
                      <input type="radio" name={`q_${q.id}`} value={opt} className="accent-jade" />
                      <span className="font-hanzi text-lg" lang="zh-CN">
                        {opt}
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}

              {(q.type === 'fill_blank' || q.type === 'pinyin') && (
                <input
                  name={`q_${q.id}`}
                  className="field text-lg"
                  autoComplete="off"
                  autoCapitalize="off"
                  lang={q.type === 'pinyin' ? undefined : 'zh-CN'}
                  placeholder={q.type === 'pinyin' ? 'nǐ hǎo hoặc ni3 hao3' : 'Câu trả lời'}
                  aria-label={`Trả lời câu ${i + 1}`}
                />
              )}

              {q.type === 'essay' && (
                <textarea
                  name={`q_${q.id}`}
                  rows={5}
                  lang="zh-CN"
                  className="field text-lg"
                  aria-label={`Trả lời câu ${i + 1}`}
                />
              )}

              {q.type === 'writing' && (
                <div>
                  <input
                    name={`f_${q.id}`}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="field py-1.5"
                    aria-label="Ảnh bài viết tay"
                  />
                  <p className="hint">Viết ra giấy ô li, chụp thẳng và đủ sáng. Tối đa 10 MB.</p>
                </div>
              )}

              {q.type === 'speaking' && <AudioRecorder name={`f_${q.id}`} />}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton pendingText="Đang nộp bài…">Nộp bài</SubmitButton>
          <p className="text-sm text-muted">Sau khi nộp sẽ không sửa được nữa.</p>
        </div>
      </form>
    </div>
  );
}
