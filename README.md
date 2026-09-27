# Lớp Hán ngữ — MVP

Web học tiếng Trung cho 1 giáo viên và khoảng 40 học viên.
Next.js 15 (App Router, Server Actions) + Supabase (Auth, Postgres, Storage) + Tailwind CSS.

## Làm việc với Claude Code

`report.md` giải thích toàn bộ kiến trúc và công nghệ của dự án — đọc file đó trước nếu bạn mới
vào dự án hoặc đang đi tìm một con bug.

`CLAUDE.md` chứa quy tắc dự án, `docs/PLAN.md` chứa danh sách task.
Trong `claude`: `/next` để lấy task tiếp theo, `/task P1-03` để làm một task, `/verify` để kiểm tra trước khi push.

## Phát triển local (cách được khuyến nghị)

Toàn bộ database chạy trên máy bằng Supabase CLI, không cần tài khoản supabase.com.
Cần **Docker** đang chạy và **Node.js 20+**.

```bash
npm install
npx supabase start          # lần đầu tải image, mất vài phút
npx supabase db reset       # chạy lại migrations + seed.sql
```

Chép `.env.example` thành `.env.local` rồi điền URL và anon key mà `npx supabase start` in ra
(`API_URL` và `ANON_KEY`). Giá trị mặc định của Supabase local luôn giống nhau:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY do supabase start in ra>
```

Rồi `npm run dev` và mở http://localhost:3000.

**Tài khoản mẫu** (mật khẩu chung `Test12345!`, tạo bởi `supabase/seed.sql`):

| Email                 | Vai trò   | Có gì                                |
| --------------------- | --------- | ------------------------------------ |
| `giaovien@test.local` | giáo viên | lớp `DEMO01`, 2 bài giảng, 1 bài tập |
| `hv1@test.local`      | học viên  | đã trong lớp `DEMO01`                |
| `hv2@test.local`      | học viên  | đã trong lớp `DEMO01`                |
| `hv3@test.local`      | học viên  | đã trong lớp `DEMO01`                |

Học viên chỉ thấy bài giảng đã đăng (1 trong 2) và bài tập đã giao. Mã vào lớp là `DEMO01`.

**Các cổng local**

| Dịch vụ                    | Địa chỉ                                                   |
| -------------------------- | --------------------------------------------------------- |
| API                        | http://127.0.0.1:54321                                    |
| Studio (xem/sửa dữ liệu)   | http://127.0.0.1:54323                                    |
| Postgres                   | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Mailpit (xem email gửi ra) | http://127.0.0.1:54324                                    |

Xác nhận email đã tắt ở local (`enable_confirmations = false` trong `supabase/config.toml`),
nên đăng ký xong là đăng nhập được ngay.

**Đổi schema:** tạo file mới `supabase/migrations/<timestamp>_<ten>.sql`, không sửa migration đã có.
Sau đó `npx supabase db reset`. `supabase/schema.sql` chỉ còn để đọc tham khảo.

**Dừng lại:** `npx supabase stop` (thêm `--no-backup` nếu muốn xoá sạch dữ liệu).

## Chạy trên Supabase cloud (khi cần bản thật)

1. Tạo project miễn phí tại https://supabase.com.
2. Đẩy schema lên bằng migration (đừng dán `schema.sql` bằng tay):
   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
3. Chép `.env.example` thành `.env.local`, điền URL và anon key (Project Settings → API).
4. Chạy:
   ```bash
   npm install
   npm run dev
   ```
5. Mở http://localhost:3000, đăng ký một tài khoản cho giáo viên, rồi nâng quyền trong SQL Editor:
   ```sql
   update profiles set role = 'teacher'
   where id = (select id from auth.users where email = 'giaovien@example.com');
   ```
6. Giáo viên tạo lớp → gửi mã 6 ký tự cho học viên → học viên đăng ký và nhập mã.

Khi thử nghiệm, có thể tắt xác nhận email: Authentication → Sign In / Providers → Email → tắt "Confirm email".

## Cấu trúc thư mục

```
app/
  login/                 Đăng nhập, đăng ký (mọi tài khoản mới là học viên)
  teacher/
    page.tsx             Bài chờ chấm + quản lý lớp, mã vào lớp
    lessons/             Tạo bài giảng; [id]: upload slide/video, thêm từ vựng
    assignments/         Tạo bài tập; [id]: thêm câu hỏi, đáp án, xem ai đã nộp
    submissions/[id]     Chấm bài: điểm + lời chữa từng câu, ghi âm nhận xét
    students/            Danh sách học viên theo lớp
    actions.ts           Toàn bộ server action của giáo viên
  student/
    page.tsx             Vào lớp bằng mã, bài cần làm, bài đã nộp, bài giảng
    lessons/[id]         Xem slide, video, thẻ từ vựng có phát âm
    assignments/[id]     Làm bài (trắc nghiệm, điền từ, pinyin, tự luận,
                         chụp ảnh bài viết tay, ghi âm) hoặc xem lời chữa
    actions.ts
components/              Tianzige (ô chữ điền tự), AudioRecorder, SpeakButton…
lib/                     supabase client, auth (requireRole), storage, format
middleware.ts            Làm mới session, chặn người chưa đăng nhập
supabase/schema.sql      Bảng, RLS, hàm, storage policy
```

## Thiết kế database

```
profiles ─┬─< classes (teacher_id) ─┬─< class_members >── profiles (học viên)
          │                         ├─< lessons ─┬─< lesson_materials
          │                         │            └─< vocab ─< vocab_reviews
          │                         ├─< assignments ─< questions ── question_keys (1-1)
          │                         └─< announcements
          └─< submissions (1 bài / học viên / bài tập) ─< submission_answers >── questions
```

Các quyết định chính:

- **Phân quyền nằm trong database (RLS)**, không chỉ ở giao diện. Kể cả khi ai đó gọi thẳng API Supabase
  bằng anon key, học viên vẫn chỉ đọc được bài của mình và bài giảng đã đăng của lớp mình.
- **Đáp án ở bảng riêng `question_keys`** mà học viên không có quyền đọc. Chấm tự động chạy trong hàm
  `submit_assignment` (security definer) ở phía database.
- **Quyền theo cột**: học viên không sửa được `role`, `score`, `status`. Khi nộp bài, hàm
  `submit_assignment` xoá mọi điểm học viên tự điền trước khi chấm.
- **Một submission cho mỗi (học viên, bài tập)**, trạng thái `draft → submitted → graded`.
  Nếu upload lỗi giữa chừng, bản nháp vẫn còn để nộp lại.
- **Điểm từng câu** = `teacher_score` nếu giáo viên nhập, không thì `auto_score`.
- **Storage private**, đường dẫn bắt đầu bằng `class_id/student_id/...` để policy kiểm tra theo thư mục;
  file hiển thị qua signed URL 1 giờ.
- `vocab_reviews` đã có sẵn cho flashcard SRS ở giai đoạn 2.

Schema đã được chạy thử trên Postgres 16 với các kịch bản: học viên tự nâng quyền, đọc đáp án,
tự chấm điểm, sửa bài sau khi nộp, xem bài bạn khác, upload vào thư mục người khác — đều bị chặn.

## Việc tiếp theo

Giai đoạn 2: luyện viết chữ Hán theo nét (hanzi-writer), flashcard SRS dùng `vocab_reviews`,
tự sinh pinyin (pinyin-pro), sắp xếp kéo thả bài giảng/câu hỏi, sửa câu hỏi đã tạo.

Giai đoạn 3: thông báo hạn nộp (Supabase Edge Function + cron gửi email), bảng thông báo lớp
(`announcements` đã có bảng), thống kê lỗi hay gặp, PWA.

Lưu ý khi mở rộng: lỗi trong server action hiện hiển thị qua `app/error.tsx`; bản production nên chuyển
sang `useActionState` để báo lỗi ngay trên form. Khi xoá bài giảng, file trong Storage chưa được dọn.
