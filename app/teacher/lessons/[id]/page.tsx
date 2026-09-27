import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { HanziWord } from '@/components/Tianzige';
import { SubmitButton } from '@/components/SubmitButton';
import { addMaterial, addVocab, deleteLesson, deleteMaterial, deleteVocab, updateLesson } from '../../actions';

const MATERIAL_LABELS: Record<string, string> = { slide: 'Slide', video: 'Video', document: 'Tài liệu', link: 'Link' };

export default async function LessonEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole('teacher');

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, class_id, title, summary, published, lesson_materials(*), vocab(*)')
    .eq('id', id)
    .order('position', { referencedTable: 'lesson_materials' })
    .order('position', { referencedTable: 'vocab' })
    .single();
  if (!lesson) notFound();

  return (
    <div className="space-y-10">
      <Link href="/teacher/lessons" className="text-sm text-muted hover:text-ink">‹ Tất cả bài giảng</Link>

      <form action={updateLesson.bind(null, id)} className="panel space-y-3">
        <div>
          <label className="label" htmlFor="title">Tên bài</label>
          <input id="title" name="title" defaultValue={lesson.title} required className="field text-base font-medium" />
        </div>
        <div>
          <label className="label" htmlFor="summary">Mô tả ngắn</label>
          <textarea id="summary" name="summary" defaultValue={lesson.summary ?? ''} rows={2} className="field" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={lesson.published} className="h-4 w-4 accent-jade" />
            Đăng cho học viên xem
          </label>
          <SubmitButton>Lưu bài giảng</SubmitButton>
        </div>
      </form>

      <section>
        <h2>Tài liệu</h2>
        {lesson.lesson_materials.length > 0 && (
          <ul className="rows mt-3">
            {lesson.lesson_materials.map((m: any) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="tag-draft">{MATERIAL_LABELS[m.type]}</span>
                <span className="min-w-0 flex-1 truncate">{m.title}</span>
                <form action={deleteMaterial.bind(null, m.id, id, m.storage_path)}>
                  <button className="btn-danger text-xs">Xoá</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addMaterial.bind(null, id, lesson.class_id)} className="panel mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="m_type">Loại</label>
            <select id="m_type" name="type" className="field">
              <option value="slide">Slide (PDF)</option>
              <option value="document">Tài liệu</option>
              <option value="video">Video (link YouTube)</option>
              <option value="link">Link khác</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="m_title">Tiêu đề</label>
            <input id="m_title" name="title" placeholder="Để trống sẽ lấy tên file" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="m_file">File</label>
            <input id="m_file" name="file" type="file" accept=".pdf,.docx,.pptx,image/*,audio/*" className="field py-1.5" />
            <p className="hint">Slide nên xuất ra PDF để xem được trên điện thoại. Tối đa 50 MB.</p>
          </div>
          <div>
            <label className="label" htmlFor="m_url">Hoặc link</label>
            <input id="m_url" name="url" type="url" placeholder="https://youtu.be/…" className="field" />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton pendingText="Đang tải lên…">Thêm tài liệu</SubmitButton>
          </div>
        </form>
      </section>

      <section>
        <h2>Từ vựng</h2>
        {lesson.vocab.length > 0 && (
          <ul className="rows mt-3">
            {lesson.vocab.map((v: any) => (
              <li key={v.id} className="flex items-center gap-4 px-4 py-3">
                <HanziWord text={v.hanzi} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{v.pinyin}</p>
                  <p className="text-sm text-muted">{v.meaning_vi}</p>
                </div>
                <form action={deleteVocab.bind(null, v.id, id)}>
                  <button className="btn-danger text-xs">Xoá</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addVocab.bind(null, id)} className="panel mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr]">
          <div>
            <label className="label" htmlFor="hanzi">Chữ Hán</label>
            <input id="hanzi" name="hanzi" required lang="zh-CN" className="field font-hanzi text-lg" placeholder="朋友" />
          </div>
          <div>
            <label className="label" htmlFor="pinyin">Pinyin</label>
            <input id="pinyin" name="pinyin" required className="field" placeholder="péngyou" />
          </div>
          <div>
            <label className="label" htmlFor="meaning_vi">Nghĩa</label>
            <input id="meaning_vi" name="meaning_vi" required className="field" placeholder="bạn bè" />
          </div>
          <div className="sm:col-span-3">
            <label className="label" htmlFor="example">Câu ví dụ</label>
            <input id="example" name="example" lang="zh-CN" className="field" placeholder="他是我的好朋友。" />
          </div>
          <div className="sm:col-span-3">
            <SubmitButton>Thêm từ</SubmitButton>
          </div>
        </form>
      </section>

      <form action={deleteLesson.bind(null, id)} className="border-t border-line pt-6">
        <button className="btn-danger">Xoá bài giảng này</button>
        <p className="hint">Xoá cả tài liệu và từ vựng của bài. Bài tập gắn với bài này vẫn được giữ lại.</p>
      </form>
    </div>
  );
}
