# Lớp Hán ngữ — MVP

Web học tiếng Trung cho 1 giáo viên và khoảng 40 học viên.
Next.js 15 (App Router, Server Actions) + Supabase (Auth, Postgres, Storage) + Tailwind CSS.

## Làm việc với Claude Code

`CLAUDE.md` chứa quy tắc dự án, `docs/PLAN.md` chứa danh sách task.
Trong `claude`: `/next` để lấy task tiếp theo, `/task P1-03` để làm một task, `/verify` để kiểm tra trước khi push.

## Chạy thử trong 15 phút

1. Tạo project miễn phí tại https://supabase.com.
2. Vào **SQL Editor**, dán toàn bộ `supabase/schema.sql` và bấm Run.
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
