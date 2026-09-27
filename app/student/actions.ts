'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { isRealFile, uploadFile } from '@/lib/storage';

export async function joinClass(fd: FormData) {
  const { supabase } = await requireRole('student');
  const { error } = await supabase.rpc('join_class', { code: String(fd.get('code') ?? '') });
  if (error)
    redirect(
      `/student?error=${encodeURIComponent('Mã lớp không đúng. Kiểm tra lại với giáo viên.')}`,
    );
  revalidatePath('/student');
  redirect('/student');
}

export async function submitAssignment(assignmentId: string, fd: FormData) {
  const { supabase, profile } = await requireRole('student');

  const { data: a } = await supabase
    .from('assignments')
    .select('id, class_id, questions(id, type)')
    .eq('id', assignmentId)
    .single();
  if (!a) throw new Error('Không tìm thấy bài tập.');

  // Lấy bản nháp hoặc tạo mới. Nếu lần nộp trước lỗi giữa chừng, bản nháp vẫn còn để nộp lại.
  let { data: sub } = await supabase
    .from('submissions')
    .select('id, status')
    .match({ assignment_id: assignmentId, student_id: profile.id })
    .maybeSingle();
  if (!sub) {
    const created = await supabase
      .from('submissions')
      .insert({ assignment_id: assignmentId, student_id: profile.id })
      .select('id, status')
      .single();
    if (created.error) throw new Error(created.error.message);
    sub = created.data;
  }
  if (sub!.status !== 'draft') redirect(`/student/assignments/${assignmentId}`);

  const folder = `${a.class_id}/${profile.id}/${assignmentId}`;
  const rows = [];
  for (const q of a.questions as { id: string; type: string }[]) {
    const text = String(fd.get(`q_${q.id}`) ?? '').trim();
    const file = fd.get(`f_${q.id}`);
    const file_path = isRealFile(file)
      ? await uploadFile(supabase, 'submissions', folder, file)
      : null;
    if (!text && !file_path) continue;
    rows.push({ submission_id: sub!.id, question_id: q.id, text_answer: text || null, file_path });
  }

  if (rows.length) {
    const { error } = await supabase
      .from('submission_answers')
      .upsert(rows, { onConflict: 'submission_id,question_id' });
    if (error) throw new Error(error.message);
  }

  const { error } = await supabase.rpc('submit_assignment', { sub_id: sub!.id });
  if (error) throw new Error(error.message);

  revalidatePath('/student');
  redirect(`/student/assignments/${assignmentId}`);
}
