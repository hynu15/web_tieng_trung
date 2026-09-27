import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { youtubeEmbed } from '@/lib/format';
import { signedUrls } from '@/lib/storage';
import { HanziWord } from '@/components/Tianzige';
import { SpeakButton } from '@/components/SpeakButton';

export default async function LessonView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole('student');

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, summary, lesson_materials(*), vocab(*)')
    .eq('id', id)
    .order('position', { referencedTable: 'lesson_materials' })
    .order('position', { referencedTable: 'vocab' })
    .single();
  if (!lesson) notFound();

  const urls = await signedUrls(
    supabase,
    'materials',
    lesson.lesson_materials.map((m) => m.storage_path),
  );

  return (
    <article className="space-y-10">
      <div>
        <Link href="/student" className="text-sm text-muted hover:text-ink">
          ‹ Lớp học
        </Link>
        <h1 className="mt-3">{lesson.title}</h1>
        {lesson.summary && <p className="mt-2 max-w-2xl text-muted">{lesson.summary}</p>}
      </div>

      {lesson.lesson_materials.map((m) => {
        // Thuộc tính src/href của JSX nhận undefined chứ không nhận null.
        const src = (m.storage_path ? urls[m.storage_path] : m.url) ?? undefined;
        const yt = m.type === 'video' && m.url ? youtubeEmbed(m.url) : null;
        const isPdf = m.storage_path?.endsWith('.pdf');
        return (
          <section key={m.id} className="space-y-2">
            <h2>{m.title}</h2>
            {yt ? (
              <iframe
                src={yt}
                title={m.title}
                allowFullScreen
                className="aspect-video w-full rounded-lg border border-line"
              />
            ) : isPdf ? (
              <>
                <iframe
                  src={src}
                  title={m.title}
                  className="hidden h-[75vh] w-full rounded-lg border border-line md:block"
                />
                <a href={src} target="_blank" rel="noreferrer" className="btn-ghost md:hidden">
                  Mở slide
                </a>
              </>
            ) : (
              <a href={src} target="_blank" rel="noreferrer" className="btn-ghost">
                Mở tài liệu
              </a>
            )}
          </section>
        );
      })}

      {lesson.vocab.length > 0 && (
        <section>
          <h2>Từ vựng ({lesson.vocab.length})</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {lesson.vocab.map((v) => (
              <li key={v.id} className="flex gap-4 rounded-lg border border-line bg-white p-4">
                <HanziWord text={v.hanzi} size={56} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-lg font-medium">{v.pinyin}</p>
                  <p className="text-muted">{v.meaning_vi}</p>
                  {v.example && (
                    <p className="font-hanzi" lang="zh-CN">
                      {v.example}
                    </p>
                  )}
                  <SpeakButton text={v.hanzi} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
