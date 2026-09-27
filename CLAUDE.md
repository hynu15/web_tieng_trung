# CLAUDE.md — Lớp Hán ngữ

Web dạy tiếng Trung: 1 giáo viên quản lý ~40 học viên. Giáo viên đăng bài giảng, giao bài tập, chữa bài;
học viên xem bài, làm bài (kể cả viết tay và ghi âm), nhận lời chữa.

Kế hoạch và danh sách task: `docs/PLAN.md`. Luôn đọc task tương ứng trước khi code.

## Lệnh

```bash
npm run dev          # http://localhost:3000
npm run build        # build production, phải pass trước khi commit
npm run check        # typecheck + lint + unit test (có sau task P0-03, P0-04)
npm run test:e2e     # Playwright (có sau task P0-04)
npx supabase start   # Supabase local (cần Docker)
npx supabase db reset            # chạy lại toàn bộ migration + seed
npx supabase test db             # test RLS (pgTAP) trong supabase/tests
npx supabase gen types typescript --local > lib/database.types.ts
```

## Kiến trúc

- Next.js 15 App Router, React 19, TypeScript strict, Tailwind 3.
- Supabase: Auth (email/mật khẩu), Postgres với RLS, Storage (bucket private `materials`, `submissions`).
- Không có backend riêng. Đọc dữ liệu trong Server Component, ghi dữ liệu bằng Server Action.
- `app/teacher/*` và `app/student/*`: mỗi khu có `layout.tsx` gọi `requireRole()` và một `actions.ts`.
- `lib/auth.ts` (`getSession`, `requireRole`), `lib/supabase/{server,client}.ts`, `lib/storage.ts`, `lib/format.ts`.
- `components/`: dùng chung. Client Component phải có `'use client'` và càng nhỏ càng tốt.
- Database: `supabase/migrations/*.sql` là nguồn sự thật (sau task P0-01). `supabase/schema.sql` chỉ còn để tham khảo.

## Quy tắc bắt buộc

**Bảo mật**

- RLS là lớp phân quyền thật. Mọi bảng mới phải `enable row level security` và có policy trong cùng migration, kèm test pgTAP.
- Không bao giờ dùng `SUPABASE_SERVICE_ROLE_KEY` ngoài route cron phía server; không đặt nó trong biến `NEXT_PUBLIC_*`.
- Mọi server action bắt đầu bằng `requireRole('teacher' | 'student')`. Không tin `id` gửi từ client: để RLS lọc, và kiểm tra quyền sở hữu khi cần.
- Đáp án chỉ nằm trong `question_keys`. Không select bảng này ở bất kỳ trang học viên nào.
- Học viên không được ghi `score`, `status`, `role`, `auto_score`. Thay đổi trạng thái bài làm đi qua hàm SQL `security definer`.

**Database**

- Thay đổi schema = tạo file migration mới `supabase/migrations/<timestamp>_<ten>.sql`. Không sửa migration đã có.
- Sau migration: chạy `db reset`, `gen types`, `test db`.
- `alter type ... add value` phải nằm trong migration riêng (không dùng giá trị mới trong cùng transaction).

**Code**

- Dùng kiểu từ `lib/database.types.ts`; không thêm `any` mới (sau task P0-02).
- Server action trả `{ error?: string }` và form dùng `useActionState` để hiển thị lỗi (sau task P1-01). Không `throw` cho lỗi người dùng.
- File người dùng tải lên đi thẳng từ trình duyệt lên Storage (sau task P1-03), server action chỉ nhận `path`.
- Thời gian: lưu UTC (`timestamptz`), hiển thị và nhập theo `Asia/Ho_Chi_Minh` qua `lib/format.ts`.
- Không thêm thư viện nếu vài chục dòng code tự viết là đủ. Thư viện mới phải ghi lý do trong mô tả commit.

**Giao diện**

- Chỉ dùng token trong `tailwind.config.ts` (`paper, ink, muted, line, jade, seal`) và class trong `app/globals.css` (`btn-*`, `field`, `panel`, `rows`, `red-ink`, `tag-*`). Không viết mã màu hex trong component.
- Đỏ `seal` chỉ dành cho lời chữa của giáo viên, lỗi, quá hạn. Thao tác chính dùng `jade`.
- Chữ Hán: `font-hanzi` và `lang="zh-CN"`. Ô 田字格 dùng `components/Tianzige.tsx`.
- Mobile trước: kiểm tra ở 375px. Học viên chủ yếu dùng điện thoại.
- Chữ trên giao diện bằng tiếng Việt, viết hoa đầu câu, nút ghi rõ hành động ("Nộp bài", "Trả bài cho học viên"). Thông báo lỗi nói điều gì xảy ra và cách sửa.
- Nếu có template UI trong `design/template/`, làm theo task P0-06 trước khi dựng màn hình mới.

## Quy trình làm một task

1. Đọc task trong `docs/PLAN.md`, kiểm tra các task phụ thuộc đã xong.
2. Trình bày kế hoạch ngắn (file sẽ sửa, migration, test) và chờ xác nhận nếu task đánh dấu **[Hỏi trước]**.
3. Code. Viết test theo mục "Kiểm tra" của task.
4. Chạy `npm run build` và `npm run check` (và `npx supabase test db` nếu đụng database). Sửa đến khi pass.
5. Đánh dấu `[x]` ở bảng tiến độ trong `docs/PLAN.md`, thêm 1 dòng vào mục "Nhật ký" cuối file.
6. Commit: `P1-03: mô tả ngắn` (một task một commit, không gộp).

Nếu task mơ hồ hoặc mâu thuẫn với file này, dừng lại và hỏi thay vì đoán.
