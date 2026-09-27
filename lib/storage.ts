import type { createClient } from './supabase/server';
import { fileExt } from './format';

type Client = Awaited<ReturnType<typeof createClient>>;

export function isRealFile(v: FormDataEntryValue | null): v is File {
  return v instanceof File && v.size > 0;
}

export async function uploadFile(supabase: Client, bucket: string, folder: string, file: File) {
  const path = `${folder}/${crypto.randomUUID()}.${fileExt(file)}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw new Error(`Tải file lên thất bại: ${error.message}`);
  return path;
}

// Bucket để private → tạo link có hạn (1 giờ) khi hiển thị
export async function signedUrls(supabase: Client, bucket: string, paths: string[]) {
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return {} as Record<string, string>;
  const { data } = await supabase.storage.from(bucket).createSignedUrls(clean, 3600);
  const map: Record<string, string> = {};
  data?.forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  });
  return map;
}
