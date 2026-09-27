import { createBrowserClient } from '@supabase/ssr';

// Dùng trong Client Component (vd. realtime thông báo ở giai đoạn 3)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
