import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

// Dùng trong Client Component (vd. realtime thông báo ở giai đoạn 3)
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
