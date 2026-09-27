const dateFmt = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
});

export function formatDate(iso: string | null | undefined) {
  return iso ? dateFmt.format(new Date(iso)) : 'Không có hạn';
}

export function isOverdue(iso: string | null | undefined) {
  return !!iso && new Date(iso).getTime() < Date.now();
}

export const QUESTION_LABELS: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm',
  fill_blank: 'Điền từ',
  pinyin: 'Viết pinyin',
  essay: 'Tự luận',
  writing: 'Viết tay (ảnh)',
  speaking: 'Nói (ghi âm)',
};

export const AUTO_GRADED = ['multiple_choice', 'fill_blank', 'pinyin'];

// Chuyển link YouTube thường thành link nhúng
export function youtubeEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function fileExt(file: File) {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : '';
  if (fromName) return fromName.toLowerCase();
  return file.type.split('/')[1]?.split(';')[0] ?? 'bin';
}

// Ô input datetime-local không có múi giờ → quy ước giờ Việt Nam (UTC+7, không đổi giờ)
export function vnLocalToIso(v: FormDataEntryValue | null) {
  const s = String(v ?? '').trim();
  return s ? new Date(`${s}:00+07:00`).toISOString() : null;
}

export function isoToVnLocal(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 16);
}
