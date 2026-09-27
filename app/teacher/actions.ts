'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { vnLocalToIso } from '@/lib/format';
import { isRealFile, uploadFile } from '@/lib/storage';

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const must = <T,>(res: { error: { message: string } | null; data?: any }): T => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};

// ---------- Lớp học ----------
export async function createClass(fd: FormData) {
  const { supabase, profile } = await requireRole('teacher');
  const hsk = str(fd, 'hsk_level');
  must(await supabase.from('classes').insert({
    teacher_id: profile.id,
    name: str(fd, 'name'),
    hsk_level: hsk ? Number(hsk) : null,
  }));
  revalidatePath('/teacher');
}

export async function removeStudent(classId: string, studentId: string) {
  const { supabase } = await requireRole('teacher');
  must(await supabase.from('class_members').delete().match({ class_id: classId, student_id: studentId }));
  revalidatePath('/teacher/students');
}

// ---------- Bài giảng ----------
export async function createLesson(fd: FormData) {
  const { supabase } = await requireRole('teacher');
  const lesson = must<{ id: string }>(
    await supabase.from('lessons')
      .insert({ class_id: str(fd, 'class_id'), title: str(fd, 'title'), summary: str(fd, 'summary') || null })
      .select('id').single(),
  );
  redirect(`/teacher/lessons/${lesson.id}`);
}

export async function updateLesson(id: string, fd: FormData) {
  const { supabase } = await requireRole('teacher');
  must(await supabase.from('lessons').update({
    title: str(fd, 'title'),
    summary: str(fd, 'summary') || null,
    published: fd.get('published') === 'on',
  }).eq('id', id));
  revalidatePath(`/teacher/lessons/${id}`);
  revalidatePath('/teacher/lessons');
}

export async function deleteLesson(id: string) {
  const { supabase } = await requireRole('teacher');
  must(await supabase.from('lessons').delete().eq('id', id));
  redirect('/teacher/lessons');
}

export async function addMaterial(lessonId: string, classId: string, fd: FormData) {
  const { supabase } = await requireRole('teacher');
  const file = fd.get('file');
  const url = str(fd, 'url');
  let storage_path: string | null = null;
  if (isRealFile(file)) {
    storage_path = await uploadFile(supabase, 'materials', `${classId}/${lessonId}`, file);
  } else if (!url) {
    throw new Error('Chọn một file hoặc dán link.');
  }
  must(await supabase.from('lesson_materials').insert({
    lesson_id: lessonId,
    type: str(fd, 'type'),
    title: str(fd, 'title') || (isRealFile(file) ? file.name : url),
    storage_path,
    url: storage_path ? null : url,
  }));
  revalidatePath(`/teacher/lessons/${lessonId}`);
}

export async function deleteMaterial(id: string, lessonId: string, storagePath: string | null) {
  const { supabase } = await requireRole('teacher');
  if (storagePath) await supabase.storage.from('materials').remove([storagePath]);
  must(await supabase.from('lesson_materials').delete().eq('id', id));
  revalidatePath(`/teacher/lessons/${lessonId}`);
}

export async function addVocab(lessonId: string, fd: FormData) {
  const { supabase } = await requireRole('teacher');
  must(await supabase.from('vocab').insert({
    lesson_id: lessonId,
    hanzi: str(fd, 'hanzi'),
    pinyin: str(fd, 'pinyin'),
    meaning_vi: str(fd, 'meaning_vi'),
    example: str(fd, 'example') || null,
  }));
  revalidatePath(`/teacher/lessons/${lessonId}`);
}

export async function deleteVocab(id: string, lessonId: string) {
  const { supabase } = await requireRole('teacher');
  must(await supabase.from('vocab').delete().eq('id', id));
  revalidatePath(`/teacher/lessons/${lessonId}`);
}

// ---------- Bài tập ----------
export async function createAssignment(fd: FormData) {
  const { supabase } = await requireRole('teacher');
  const a = must<{ id: string }>(
    await supabase.from('assignments').insert({
      class_id: str(fd, 'class_id'),
      lesson_id: str(fd, 'lesson_id') || null,
      title: str(fd, 'title'),
      instructions: str(fd, 'instructions') || null,
      due_at: vnLocalToIso(fd.get('due_at')),
    }).select('id').single(),
  );
  redirect(`/teacher/assignments/${a.id}`);
}

export async function updateAssignment(id: string, fd: FormData) {
  const { supabase } = await requireRole('teacher');
  must(await supabase.from('assignments').update({
    title: str(fd, 'title'),
    instructions: str(fd, 'instructions') || null,
    due_at: vnLocalToIso(fd.get('due_at')),
    published: fd.get('published') === 'on',
  }).eq('id', id));
  revalidatePath(`/teacher/assignments/${id}`);
  revalidatePath('/teacher/assignments');
}

export async function addQuestion(assignmentId: string, fd: FormData) {
  const { supabase } = await requireRole('teacher');
  const type = str(fd, 'type');
  const options = str(fd, 'options').split('\n').map((s) => s.trim()).filter(Boolean);
  if (type === 'multiple_choice' && options.length < 2) throw new Error('Câu trắc nghiệm cần ít nhất 2 phương án.');

  const { count } = await supabase.from('questions')
    .select('id', { count: 'exact', head: true }).eq('assignment_id', assignmentId);

  const q = must<{ id: string }>(
    await supabase.from('questions').insert({
      assignment_id: assignmentId,
      type,
      prompt: str(fd, 'prompt'),
      options: type === 'multiple_choice' ? options : null,
      points: Number(str(fd, 'points') || 1),
      position: count ?? 0,
    }).select('id').single(),
  );

  const answer = str(fd, 'answer');
  if (answer && ['multiple_choice', 'fill_blank', 'pinyin'].includes(type)) {
    must(await supabase.from('question_keys').insert({ question_id: q.id, answer }));
  }
  revalidatePath(`/teacher/assignments/${assignmentId}`);
}

export async function deleteQuestion(id: string, assignmentId: string) {
  const { supabase } = await requireRole('teacher');
  must(await supabase.from('questions').delete().eq('id', id));
  revalidatePath(`/teacher/assignments/${assignmentId}`);
}

// ---------- Chấm bài ----------
export async function gradeSubmission(submissionId: string, fd: FormData) {
  const { supabase } = await requireRole('teacher');

  const sub = must<{ id: string; student_id: string; assignment: { id: string; class_id: string } }>(
    await supabase.from('submissions')
      .select('id, student_id, assignment:assignments(id, class_id)')
      .eq('id', submissionId).single(),
  );
  const answers = must<{ id: string; auto_score: number | null }[]>(
    await supabase.from('submission_answers').select('id, auto_score').eq('submission_id', submissionId),
  );

  let total = 0;
  for (const a of answers) {
    const raw = str(fd, `score_${a.id}`);
    const teacher_score = raw === '' ? null : Number(raw);
    const comment = str(fd, `comment_${a.id}`) || null;
    total += teacher_score ?? Number(a.auto_score ?? 0);
    must(await supabase.from('submission_answers').update({ teacher_score, comment }).eq('id', a.id));
  }

  const audio = fd.get('feedback_audio');
  const update: Record<string, unknown> = {
    status: 'graded',
    score: total,
    graded_at: new Date().toISOString(),
    teacher_comment: str(fd, 'teacher_comment') || null,
  };
  if (isRealFile(audio)) {
    update.feedback_audio_path = await uploadFile(
      supabase, 'submissions', `${sub.assignment.class_id}/${sub.student_id}/feedback`, audio,
    );
  }
  must(await supabase.from('submissions').update(update).eq('id', submissionId));

  revalidatePath(`/teacher/assignments/${sub.assignment.id}`);
  revalidatePath('/teacher');
  redirect(`/teacher/assignments/${sub.assignment.id}`);
}
