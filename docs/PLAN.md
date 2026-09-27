# Kế hoạch triển khai — Lớp Hán ngữ

File này là chỉ dẫn cho Claude Code. Mỗi task có mã (`P1-03`), đủ thông tin để làm độc lập,
và có tiêu chí hoàn thành kiểm tra được. Quy tắc chung nằm trong `CLAUDE.md`.

## 0. Hướng dẫn cho người điều khiển

**Chuẩn bị một lần**

1. Cài Node.js 20+, Docker Desktop (cho Supabase local), Git, và Claude Code.
2. Giải nén project, `cd hanzi-class`, `git init && git add . && git commit -m "MVP khởi đầu"`.
3. Tạo project trên supabase.com (dùng cho bản chạy thật ở P3). Khi phát triển dùng Supabase local.
4. Chạy `claude` trong thư mục project. Claude tự đọc `CLAUDE.md`.

**Mỗi lần làm việc**

- `/next` để Claude đề xuất task tiếp theo, hoặc `/task P0-01` để làm một task cụ thể.
- Với task có nhãn **[Hỏi trước]**, bật Plan Mode (Shift+Tab) để duyệt kế hoạch trước khi Claude sửa file.
- Sau mỗi task: tự mở trình duyệt thử luồng liên quan (mục "Thử tay" của task), rồi mới sang task sau.
- `/verify` trước khi push hoặc deploy.
- Một task một phiên là tốt nhất. Khi phiên dài, dùng `/clear` giữa các task để Claude không lẫn ngữ cảnh.

**Khi có template UI:** đặt vào `design/template/` rồi chạy `/task P0-06` trước các task giao diện.

## 1. Hiện trạng

Đã có (MVP): đăng nhập/đăng ký, phân quyền giáo viên/học viên, lớp và mã vào lớp, bài giảng (upload file,
link video, từ vựng), bài tập 6 dạng câu hỏi, chấm tự động trắc nghiệm/điền từ/pinyin, nộp ảnh viết tay và
ghi âm, chấm và chữa từng câu, ghi âm nhận xét. Schema có RLS đã test bằng tay trên Postgres 16.

Vấn đề đã biết (được xử lý trong các task bên dưới):

- Upload đi qua server action: **Vercel giới hạn body request 4,5 MB**, ảnh chụp điện thoại sẽ lỗi khi deploy → P1-03.
- Lỗi server action hiện hiển thị bằng trang lỗi chung → P1-01.
- Chưa có route xác nhận email và quên mật khẩu → P1-02.
- Nhiều `any` do chưa sinh kiểu database → P0-02.
- Chưa sửa được câu hỏi, chưa sắp xếp thứ tự → P1-05.
- Xoá bài giảng không dọn file trong Storage → P1-04.
- Supabase gói miễn phí có 1 GB Storage: 40 học viên nộp ảnh 3 MB mỗi tuần sẽ đầy trong vài tháng → P1-03 (nén ảnh), P3-06.

## 2. Bảng tiến độ

| Mã    | Task                                           | Phụ thuộc     | Xong |
| ----- | ---------------------------------------------- | ------------- | ---- |
| P0-01 | Supabase local + migrations + seed             | —             | [x]  |
| P0-02 | Sinh kiểu database, bỏ `any`                   | P0-01         | [x]  |
| P0-03 | ESLint, Prettier, script kiểm tra              | —             | [x]  |
| P0-04 | Hạ tầng test: Vitest, pgTAP, Playwright        | P0-01, P0-03  | [x]  |
| P0-05 | CI GitHub Actions                              | P0-04         | [x]  |
| P0-06 | Áp dụng template UI **[Hỏi trước]**            | —             | [x]  |
| P1-01 | Báo lỗi trên form bằng `useActionState` + zod  | P0-02         | [ ]  |
| P1-02 | Xác nhận email, quên mật khẩu, trang tài khoản | P1-01         | [ ]  |
| P1-03 | Upload trực tiếp lên Storage + nén ảnh         | P1-01         | [ ]  |
| P1-04 | Dọn file Storage khi xoá                       | P1-03         | [ ]  |
| P1-05 | Sửa câu hỏi, sắp xếp thứ tự                    | P1-01         | [ ]  |
| P1-06 | Lọc theo lớp khi giáo viên có nhiều lớp        | P0-02         | [ ]  |
| P1-07 | Trả bài để làm lại, gia hạn riêng              | P1-01         | [ ]  |
| P1-08 | Bảng thông báo lớp                             | P1-01         | [ ]  |
| P1-09 | Sổ điểm + xuất CSV                             | P0-02         | [ ]  |
| P1-10 | Loading, trạng thái rỗng, rà mobile            | P1-01 … P1-09 | [ ]  |
| P2-01 | Chuẩn hoá pinyin + tự sinh pinyin              | P1-01         | [ ]  |
| P2-02 | Luyện viết chữ Hán theo nét                    | P0-04         | [ ]  |
| P2-03 | Câu hỏi dạng viết theo nét, chấm tự động       | P2-02         | [ ]  |
| P2-04 | Flashcard lặp lại ngắt quãng (SRS)             | P0-04         | [ ]  |
| P2-05 | Nhập từ vựng hàng loạt                         | P2-01         | [ ]  |
| P2-06 | Khoanh lỗi trực tiếp trên ảnh bài viết         | P1-03         | [ ]  |
| P3-01 | Email nhắc hạn và báo đã chấm                  | P1-02         | [ ]  |
| P3-02 | Thống kê lớp và từng câu hỏi                   | P1-09         | [ ]  |
| P3-03 | PWA cài lên điện thoại                         | P1-10         | [ ]  |
| P3-04 | Deploy Vercel + Supabase cloud **[Hỏi trước]** | P1-02, P1-03  | [ ]  |
| P3-05 | Rà soát bảo mật cuối                           | P3-04         | [ ]  |
| P3-06 | Theo dõi dung lượng, dọn dữ liệu cuối khoá     | P3-04         | [ ]  |

Mốc gợi ý: P0 xong trong tuần 1; P1 trong tuần 2–4 (sau P1-03 có thể cho lớp thật dùng thử);
P2 trong tuần 5–7; P3 trong tuần 8.

---

## Giai đoạn 0 — Nền móng

### P0-01 · Supabase local, migrations và dữ liệu mẫu

**Mục tiêu:** chạy toàn bộ database trên máy, tái tạo được bằng một lệnh.
**File:** `supabase/schema.sql`, tạo `supabase/config.toml`, `supabase/migrations/`, `supabase/seed.sql`, `README.md`.

Các bước:

1. `npm i -D supabase`, rồi `npx supabase init`.
2. Chuyển nội dung `supabase/schema.sql` thành `supabase/migrations/20260101000000_init.sql`
   (bỏ phần `insert into storage.buckets` nếu `config.toml` khai báo bucket; nếu không, giữ nguyên).
   Đầu `schema.sql` thêm comment: "Chỉ để tham khảo. Nguồn sự thật: supabase/migrations".
3. Viết `supabase/seed.sql`: tạo trong `auth.users` 1 giáo viên (`giaovien@test.local`) và 3 học viên
   (`hv1@…`, `hv2@…`, `hv3@…`), mật khẩu `Test12345!` (dùng `crypt(..., gen_salt('bf'))`, điền đủ các cột
   Supabase Auth yêu cầu: `instance_id`, `aud`, `role`, `email_confirmed_at`, `raw_app_meta_data`, và một dòng
   `auth.identities` cho mỗi user). Nâng giáo viên lên `teacher`, tạo 1 lớp mã `DEMO01`, 3 học viên trong lớp,
   2 bài giảng (1 đã đăng, 1 nháp) có 5 từ vựng, 1 bài tập đã giao có đủ 6 dạng câu hỏi và đáp án.
4. Tắt xác nhận email ở local (`[auth.email] enable_confirmations = false` trong `config.toml`).
5. Thêm mục "Phát triển local" vào README.

**Hoàn thành khi:**

- [ ] `npx supabase db reset` chạy không lỗi.
- [ ] Đăng nhập được bằng 4 tài khoản seed ở `npm run dev` với `.env.local` trỏ về Supabase local.
- [ ] Học viên seed thấy 1 bài giảng, 1 bài tập.

**Kiểm tra:** `npx supabase db reset && npm run build`. **Thử tay:** đăng nhập giáo viên và `hv1`.

### P0-02 · Sinh kiểu database, bỏ `any`

**Mục tiêu:** TypeScript bắt được lỗi sai tên cột.
**File:** `lib/database.types.ts` (sinh ra), `lib/supabase/*.ts`, `middleware.ts`, mọi `page.tsx` và `actions.ts`.

Các bước:

1. Thêm script `"db:types": "supabase gen types typescript --local > lib/database.types.ts"`.
2. Truyền generic `Database` vào `createServerClient<Database>` và `createBrowserClient<Database>`.
3. Tạo `lib/types.ts` export các kiểu tiện dùng: `Tables<'lessons'>`, `Enums<'question_type'>`…
4. Xoá `any` trong toàn bộ `app/`. Với select lồng nhau, dùng kiểu Supabase suy ra; chỉ khai báo tay khi suy luận thất bại, kèm comment lý do.
5. Bỏ hàm `must` dùng `any` trong `app/teacher/actions.ts`, thay bằng helper có kiểu.

**Hoàn thành khi:**

- [ ] `grep -rn ": any\|as any" app lib components` không còn kết quả (trừ file sinh ra).
- [ ] `npm run build` pass với `strict: true`.

### P0-03 · ESLint, Prettier, script kiểm tra

**File:** `package.json`, `eslint.config.mjs`, `.prettierrc`.

Các bước:

1. Cài `eslint`, `eslint-config-next`, `prettier`, `prettier-plugin-tailwindcss`.
2. Cấu hình ESLint flat config theo `next/core-web-vitals` + `next/typescript`. Bật `@typescript-eslint/no-explicit-any: error`.
3. Scripts: `typecheck` (`tsc --noEmit`), `lint` (`next lint` hoặc `eslint .`), `format`, `check` (`typecheck && lint && test`).
4. Chạy `npm run format` một lần và commit riêng.

**Hoàn thành khi:** [ ] `npm run check` pass (tạm để `test` là `vitest run --passWithNoTests` cho đến P0-04).

### P0-04 · Hạ tầng test

**Mục tiêu:** ba lớp test — hàm thuần (Vitest), phân quyền database (pgTAP), luồng người dùng (Playwright).
**File:** `vitest.config.ts`, `lib/*.test.ts`, `supabase/tests/*.sql`, `playwright.config.ts`, `e2e/*.spec.ts`.

Các bước:

1. Vitest: test `lib/format.ts` (`vnLocalToIso`, `isoToVnLocal` hai chiều, `youtubeEmbed` với 4 dạng link, `isOverdue`).
2. pgTAP (`npx supabase test db`): chuyển thành test các kịch bản sau, mỗi kịch bản một assertion, dùng
   `set local role authenticated` và `set local request.jwt.claims` để giả lập người dùng:
   - Học viên không tạo được lớp; không đổi được `role` của mình.
   - Học viên chưa vào lớp không thấy bài tập; vào lớp rồi thấy bài đã giao, không thấy bài giảng nháp.
   - Học viên đọc `question_keys` được 0 dòng.
   - Học viên không insert được `submissions.score`; không update được submission sau khi nộp.
   - `submit_assignment` chấm đúng: trắc nghiệm đúng, pinyin khác hoa thường/khoảng trắng vẫn đúng, tự luận để `null`, xoá `teacher_score` học viên tự điền.
   - Học viên A không thấy bài làm, file, hồ sơ của học viên B cùng lớp.
   - Học viên không upload được vào thư mục Storage của người khác.
   - Giáo viên thấy và chấm được bài của lớp mình, không thấy lớp của giáo viên khác (tạo giáo viên thứ 2 trong test).
3. Playwright (chạy với Supabase local + seed):
   - `e2e/student-submit.spec.ts`: hv1 đăng nhập → làm bài → nộp (cho câu ghi âm, dùng `--use-fake-device-for-media-stream`) → thấy "Chờ chấm".
   - `e2e/teacher-grade.spec.ts`: giáo viên thấy bài trong "Bài chờ chấm" → chấm → hv1 thấy điểm và lời chữa.
   - `e2e/auth.spec.ts`: người chưa đăng nhập bị chuyển về `/login`; học viên vào `/teacher` bị chuyển về `/student`.
4. Scripts: `test`, `test:e2e`, `test:db`.

**Hoàn thành khi:** [ ] cả ba lệnh test pass trên máy sạch sau `db reset`.

### P0-05 · CI GitHub Actions

**File:** `.github/workflows/ci.yml`.
Job 1: `npm ci`, `npm run check`, `npm run build` (env giả). Job 2: `supabase/setup-cli`, `supabase start`,
`supabase test db`, rồi Playwright với `npx playwright install --with-deps chromium`.
**Hoàn thành khi:** [ ] workflow xanh trên một PR thử.

### P0-06 · Áp dụng template UI **[Hỏi trước]**

**Mục tiêu:** giao diện theo template người dùng cung cấp trong `design/template/`, không phá logic hiện có.

Các bước:

1. Đọc toàn bộ template. Lập bảng đối chiếu: màu, font, bo góc, khoảng cách, component (nút, input, card, bảng, nav) của template ↔ token/class hiện tại.
2. Trình bày bảng đối chiếu và danh sách màn hình sẽ đổi, **chờ duyệt**.
3. Chỉ sửa ở ba chỗ: `tailwind.config.ts` (token), `app/globals.css` (class component), `components/AppShell.tsx` + `NavLinks.tsx` (khung trang). Giữ nguyên tên class (`btn-primary`, `field`, `panel`…) để các trang tự nhận giao diện mới.
4. Nếu template có màn hình mà app chưa có, ghi vào cuối file này dưới mục "Đề xuất từ template", không tự làm.
5. Giữ các quy ước: đỏ cho lời chữa, `font-hanzi` cho chữ Hán, hoạt động tốt ở 375px.

**Hoàn thành khi:** [ ] mọi trang hiện có hiển thị theo template; [ ] test e2e vẫn pass; [ ] không trang nào tràn ngang ở 375px.

---

## Giai đoạn 1 — Hoàn thiện MVP để dùng thật

### P1-01 · Báo lỗi trên form bằng `useActionState` + zod

**Mục tiêu:** lỗi hiện ngay dưới form, giữ lại dữ liệu đã nhập.
**File:** `lib/validation.ts` (mới), `lib/action-result.ts` (mới), `app/*/actions.ts`, các form, `components/FormError.tsx`.

Các bước:

1. `npm i zod`. Tạo schema cho mọi form: lớp, bài giảng, tài liệu, từ vựng, bài tập, câu hỏi, chấm bài, vào lớp, đăng nhập/đăng ký. Thông báo lỗi tiếng Việt.
2. Kiểu `ActionResult = { ok: true; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> }`.
3. Đổi mọi action sang chữ ký `(prevState, formData) => Promise<ActionResult>`; lỗi Supabase map sang câu dễ hiểu (vd. vi phạm unique → "Mã lớp đã tồn tại").
4. Form nào dùng action chuyển sang Client Component nhỏ dùng `useActionState`; phần hiển thị dữ liệu vẫn ở Server Component.
5. Bỏ query `?error=` ở `/login` và `/student`, dùng state của form.
6. `redirect()` sau khi thành công vẫn giữ (gọi ngoài `try/catch`).

**Hoàn thành khi:**

- [ ] Nhập sai mã lớp: lỗi hiện dưới ô, không đổi trang.
- [ ] Tạo câu trắc nghiệm có 1 phương án: lỗi hiện dưới ô "Phương án", đề bài đã nhập vẫn còn.
- [ ] Không còn `throw new Error` cho lỗi do người dùng nhập.
      **Kiểm tra:** unit test cho các schema zod; e2e thêm 1 case nhập sai mã lớp.

### P1-02 · Xác nhận email, quên mật khẩu, trang tài khoản

**File:** `app/auth/confirm/route.ts`, `app/login/forgot/page.tsx`, `app/account/page.tsx`, `middleware.ts`.

Các bước:

1. `app/auth/confirm/route.ts`: nhận `token_hash`, `type`, `next`; gọi `supabase.auth.verifyOtp`; chuyển tới `next` hoặc `/login` kèm thông báo.
2. Ghi vào README cách sửa template email trong Supabase (Confirm signup, Reset password) để link trỏ về `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=...`.
3. Trang quên mật khẩu: `resetPasswordForEmail` với `redirectTo` về `/auth/confirm?next=/account/password`.
4. `/account`: đổi họ tên (`profiles.full_name`), đổi mật khẩu (`auth.updateUser`). Link từ tên người dùng ở `AppShell`.
5. Middleware cho phép `/auth/*` và `/login/*` khi chưa đăng nhập.

**Hoàn thành khi:** [ ] đăng ký → bấm link email (xem ở Inbucket/Mailpit của Supabase local) → vào được app; [ ] đặt lại mật khẩu thành công; [ ] đổi tên hiện ngay trên header.

### P1-03 · Upload trực tiếp lên Storage + nén ảnh

**Mục tiêu:** vượt giới hạn 4,5 MB của Vercel, tiết kiệm Storage, upload nhanh trên 4G.
**File:** `components/FileUpload.tsx` (mới), `components/AudioRecorder.tsx`, `lib/storage.ts`, trang làm bài, trang bài giảng giáo viên, trang chấm bài, các action liên quan, `next.config.ts`.

Các bước:

1. `npm i browser-image-compression`. Ảnh nén về cạnh dài tối đa 1600 px, JPEG/WebP ~0,8, mục tiêu < 500 KB.
2. `FileUpload` (client): chọn/chụp ảnh → nén → upload bằng `createClient()` phía trình duyệt vào đúng thư mục
   (`{class_id}/{student_id}/{assignment_id}/…`) → hiện ảnh xem trước và thanh tiến trình → ghi `path` vào `<input type="hidden">`.
   RLS Storage hiện có đã chặn upload sai thư mục.
3. `AudioRecorder` upload ngay khi dừng ghi, giới hạn 3 phút, cũng ghi `path` vào input ẩn.
4. Tài liệu bài giảng của giáo viên (PDF tới 50 MB) cũng upload trực tiếp.
5. Server action chỉ nhận `path`; kiểm tra `path` bắt đầu bằng thư mục hợp lệ của người gọi trước khi lưu.
6. Xoá `serverActions.bodySizeLimit` trong `next.config.ts`.
7. Nút "Nộp bài" bị khoá khi còn file đang tải lên.

**Hoàn thành khi:**

- [ ] Ảnh 8 MB từ điện thoại nộp được, file lưu < 600 KB.
- [ ] Không request nào tới server action lớn hơn 100 KB (kiểm tra tab Network).
- [ ] Sửa `path` trong DevTools sang thư mục người khác → action từ chối.
      **Kiểm tra:** e2e nộp ảnh bằng `setInputFiles` với ảnh mẫu 5 MB trong `e2e/fixtures/`.

### P1-04 · Dọn file Storage khi xoá

**File:** migration mới, `app/teacher/actions.ts`.
Các bước: khi xoá bài giảng, xoá mọi file `materials/{class_id}/{lesson_id}/`; khi xoá bài tập, xoá `submissions/*/*/{assignment_id}/`;
khi giáo viên ghi âm nhận xét mới, xoá file cũ. Dùng `storage.list` + `remove` phía server (đã có quyền nhờ policy giáo viên; thêm policy `delete` cho bucket `submissions` với giáo viên của lớp).
**Hoàn thành khi:** [ ] xoá bài giảng có 2 file → bucket không còn thư mục đó.

### P1-05 · Sửa câu hỏi, sắp xếp thứ tự

**File:** `app/teacher/assignments/[id]/page.tsx`, `app/teacher/lessons/[id]/page.tsx`, `components/QuestionForm.tsx`, `components/ReorderButtons.tsx`, actions.

Các bước:

1. Tách form câu hỏi thành `QuestionForm` dùng cho cả thêm và sửa; khi chọn dạng câu hỏi, chỉ hiện ô liên quan (phương án chỉ cho trắc nghiệm, đáp án chỉ cho dạng tự chấm).
2. Nút "Sửa" mở form tại chỗ. Sửa đáp án cập nhật `question_keys` (upsert/xoá).
3. Nút lên/xuống cho câu hỏi, tài liệu, từ vựng, bài giảng: đổi `position` hai dòng trong một RPC `swap_position(table, id_a, id_b)` hoặc hai update.
4. Cảnh báo khi sửa câu hỏi của bài đã có người nộp: "Đã có N bài nộp. Sửa đáp án không tự chấm lại các bài đó." Thêm nút "Chấm lại tự động" gọi RPC `regrade_question(question_id)` (security definer, chỉ giáo viên của lớp).

**Hoàn thành khi:** [ ] sửa được mọi trường của câu hỏi; [ ] thứ tự đổi hiển thị đúng ở phía học viên; [ ] chấm lại cập nhật `auto_score` (test pgTAP).

### P1-06 · Lọc theo lớp khi giáo viên có nhiều lớp

Thêm bộ chọn lớp trên `AppShell` giáo viên, lưu lớp đang chọn trong cookie `class_id`. Các trang Bài giảng, Bài tập, Học viên, Tổng quan lọc theo lớp đó; form tạo mới mặc định lớp đang chọn. Nếu chỉ có 1 lớp thì ẩn bộ chọn.
**Hoàn thành khi:** [ ] tạo lớp thứ 2 trong seed, chuyển qua lại thấy dữ liệu đúng lớp.

### P1-07 · Trả bài để làm lại, gia hạn riêng

**File:** migration mới, trang chấm bài, trang bài tập học viên.

1. RPC `reopen_submission(sub_id, note)` (chỉ giáo viên của lớp): đặt `status='draft'`, giữ câu trả lời cũ, lưu `teacher_comment = note`.
2. Học viên mở lại bài: form điền sẵn câu trả lời cũ, hiện ghi chú của giáo viên ở đầu.
3. Cột `due_at_override` trên `submissions` hoặc bảng `extensions(assignment_id, student_id, due_at)`; giao diện "Gia hạn cho học viên này" ở trang bài tập giáo viên.
   **Hoàn thành khi:** [ ] vòng trả bài → sửa → nộp lại chạy trọn; [ ] học viên được gia hạn không bị gắn nhãn "Quá hạn".

### P1-08 · Bảng thông báo lớp

Bảng `announcements` đã có. Giáo viên đăng/xoá thông báo ở Tổng quan; học viên thấy 3 thông báo mới nhất ở đầu trang Lớp học, thông báo chưa xem có dấu chấm. Lưu "đã xem" bằng cột `last_seen_announcements_at` trên `class_members` (migration + cho học viên update cột này của chính mình).
**Hoàn thành khi:** [ ] đăng thông báo → học viên thấy dấu chưa xem → vào trang thì hết.

### P1-09 · Sổ điểm + xuất CSV

**File:** `app/teacher/gradebook/page.tsx`, `app/teacher/gradebook/export/route.ts`.
Bảng học viên × bài tập (đã giao), ô là điểm/tổng, ô chưa nộp để trống, ô quá hạn chưa nộp tô đỏ nhạt; cột cuối là trung bình %. Cuộn ngang trong khung riêng trên mobile, cột tên cố định. Route xuất CSV UTF-8 có BOM để Excel đọc đúng tiếng Việt.
**Hoàn thành khi:** [ ] số liệu khớp trang từng bài tập; [ ] CSV mở bằng Excel không lỗi font.

### P1-10 · Loading, trạng thái rỗng, rà mobile

1. `loading.tsx` cho mỗi khu với khung xương đơn giản.
2. Rà mọi danh sách rỗng: có câu hướng dẫn hành động tiếp theo.
3. Chạy Playwright với viewport 375×812 chụp ảnh màn hình mọi trang, lưu vào `e2e/screenshots/`; sửa chỗ tràn ngang, chữ nhỏ hơn 14px, vùng bấm nhỏ hơn 40px.
4. Kiểm tra bàn phím: tab qua được mọi nút, focus nhìn thấy được.
   **Hoàn thành khi:** [ ] không trang nào có thanh cuộn ngang ở 375px; [ ] Lighthouse Accessibility ≥ 90 cho `/student` và trang làm bài.

---

## Giai đoạn 2 — Tính năng riêng cho tiếng Trung

### P2-01 · Chuẩn hoá pinyin + tự sinh pinyin

**Mục tiêu:** "nǐ hǎo", "ni3 hao3", "Ni3Hao3" đều được chấm đúng; giáo viên không phải gõ pinyin tay.
**File:** `lib/pinyin.ts`, `lib/pinyin.test.ts`, form từ vựng, form câu hỏi, `app/student/actions.ts`.

Các bước:

1. `npm i pinyin-pro`. Viết `normalizePinyin(s)`: chuyển dấu thanh sang số (dùng hàm chuyển đổi của pinyin-pro; kiểm tra API đúng với version đã cài), chữ thường, `ü`/`v`/`u:` → `v`, bỏ khoảng trắng và dấu câu, bỏ thanh nhẹ (`5`, `0`).
2. Khi lưu đáp án câu `pinyin`, lưu dạng đã chuẩn hoá vào `question_keys`. Khi học viên nộp, chuẩn hoá `text_answer` của câu `pinyin` trước khi upsert (vẫn giữ bản gốc ở cột mới `raw_answer` để giáo viên xem).
3. Form từ vựng: gõ chữ Hán xong, ô pinyin tự điền gợi ý (client, có thể sửa). Nút "Tạo pinyin" cho đề bài.
4. Unit test tối thiểu 15 case, gồm 儿化, thanh nhẹ, 女 (nǚ/nv3/nu:3), viết liền/cách.

**Hoàn thành khi:** [ ] test pass; [ ] pgTAP: đáp án chuẩn hoá khớp với câu trả lời chuẩn hoá.

### P2-02 · Luyện viết chữ Hán theo nét

**File:** `components/StrokePractice.tsx`, `app/student/lessons/[id]/page.tsx`, `app/student/practice/[lessonId]/page.tsx`.

Các bước:

1. `npm i hanzi-writer`. Component client: nhận `char`, hiển thị trên nền ô 田字格 (tái dùng nét kẻ của `Tianzige`), 3 chế độ: xem hoạt hình nét, viết theo nét mờ, tự viết (`quiz`).
2. Ghi nhận `totalMistakes` từ `onComplete` của quiz; hiện kết quả và nút "Viết lại".
3. Trang luyện viết theo bài: lần lượt các chữ trong từ vựng của bài (tách từng chữ, bỏ trùng).
4. Chữ không có dữ liệu nét: hiện thông báo và bỏ qua.
5. Kích thước ô co theo màn hình (tối đa 320px), vùng vẽ nhận cảm ứng tốt trên điện thoại (`touch-action: none`).

**Hoàn thành khi:** [ ] viết được bằng ngón tay trên điện thoại thật; [ ] chữ sai nét hiện gợi ý sau 3 lần.

### P2-03 · Câu hỏi dạng viết theo nét, chấm tự động

1. Migration A: `alter type question_type add value 'stroke'`. Migration B (file riêng): cột `questions.stroke_chars text`.
2. Giáo viên nhập chữ cần viết; học viên làm bằng `StrokePractice` chế độ quiz; kết quả gửi dạng JSON `{char, mistakes}[]` trong `text_answer`.
3. `submit_assignment` chấm: điểm = `points × max(0, 1 − tổng lỗi / (số nét × 0.5))`, làm tròn 0.25. Viết logic trong SQL, có test pgTAP.
4. Trang chấm hiện số lỗi từng chữ.

**Rủi ro:** học viên có thể gửi JSON giả. Chấp nhận ở mức bài tập luyện tập; ghi rõ trong README.

### P2-04 · Flashcard lặp lại ngắt quãng (SRS)

**File:** `lib/srs.ts`, `lib/srs.test.ts`, `app/student/review/page.tsx`, `components/Flashcard.tsx`, actions.

Các bước:

1. `lib/srs.ts` cài SM-2: đầu vào `{ease, interval_days, reps}` và điểm tự đánh giá (Quên=1, Khó=3, Được=4, Dễ=5); đầu ra trạng thái mới và `due_at`. Ease tối thiểu 1.3. Unit test đủ các nhánh.
2. Trang `/student/review`: lấy tối đa 20 thẻ đến hạn (`vocab_reviews.due_at <= now()`) + tối đa 10 từ mới của các bài đã đăng chưa có trong `vocab_reviews`.
3. Thẻ: mặt trước chữ Hán trong 田字格, lật ra pinyin, nghĩa, ví dụ, nút nghe. Bốn nút đánh giá, phím tắt 1–4 trên máy tính.
4. Lưu kết quả từng thẻ bằng server action (upsert `vocab_reviews`).
5. Trang Lớp học của học viên hiện "Hôm nay có N thẻ cần ôn".

**Hoàn thành khi:** [ ] ôn xong 1 phiên → các thẻ biến mất tới ngày hẹn; [ ] unit test SM-2 pass.

### P2-05 · Nhập từ vựng hàng loạt

Ô dán văn bản (mỗi dòng `chữ Hán [tab hoặc ,] pinyin [tab hoặc ,] nghĩa [, ví dụ]`, pinyin có thể bỏ trống để tự sinh), xem trước dạng bảng, báo dòng lỗi, bấm "Thêm N từ". Hỗ trợ dán thẳng từ Excel/Google Sheets.
**Hoàn thành khi:** [ ] dán 30 dòng từ Google Sheets thêm đủ 30 từ, đúng thứ tự.

### P2-06 · Khoanh lỗi trực tiếp trên ảnh bài viết

**File:** `components/ImageAnnotator.tsx`, trang chấm bài, migration (`submission_answers.annotated_path`).
Công cụ bút đỏ (vài độ dày), bút tẩy, hoàn tác; vẽ trên canvas phủ lên ảnh; xuất PNG gộp ảnh + nét vẽ, upload vào `submissions/{class}/{student}/feedback/`. Học viên thấy ảnh đã chữa thay cho ảnh gốc (có nút xem ảnh gốc). Hỗ trợ chuột, cảm ứng và bút stylus (pointer events). Không cần thư viện nếu canvas thuần đủ dùng.
**Hoàn thành khi:** [ ] chữa trên iPad/điện thoại được; [ ] học viên thấy nét đỏ đúng vị trí.

---

## Giai đoạn 3 — Vận hành

### P3-01 · Email nhắc hạn và báo đã chấm

**File:** `app/api/cron/reminders/route.ts`, `vercel.json`, `lib/email.ts`.

1. Dùng dịch vụ gửi email có gói miễn phí (vd. Resend); API key trong biến môi trường server.
2. Route cron (bảo vệ bằng header `Authorization: Bearer ${CRON_SECRET}`), dùng service role key: mỗi sáng 8:00 giờ VN (01:00 UTC) gửi cho học viên có bài hạn trong 24 giờ tới mà chưa nộp.
3. Khi giáo viên trả bài, gửi email "Bài ... đã được chấm" kèm link (gọi trong action, lỗi gửi mail không làm hỏng việc chấm).
4. Trang tài khoản có công tắc tắt email nhắc (`profiles.email_reminders boolean default true`).
   **Hoàn thành khi:** [ ] gọi route bằng curl ở local gửi đúng người (xem trong Mailpit hoặc log).

### P3-02 · Thống kê lớp và từng câu hỏi

Trang bài tập giáo viên thêm tab Thống kê: tỉ lệ đúng từng câu tự chấm, 5 câu trả lời sai phổ biến nhất mỗi câu, điểm trung bình, phân bố điểm (biểu đồ cột SVG tự vẽ). Tổng quan hiện học viên có 2 bài gần nhất chưa nộp. Tính bằng SQL view hoặc RPC, không kéo toàn bộ dữ liệu về client.

### P3-03 · PWA cài lên điện thoại

`app/manifest.ts`, icon 192/512 (chữ 汉 trong ô 田字格, xuất PNG), `theme_color`, `display: standalone`. Không cần offline. Hướng dẫn "Thêm vào màn hình chính" cho iOS ở trang tài khoản.
**Hoàn thành khi:** [ ] cài được trên Android Chrome và iOS Safari, mở lên không có thanh địa chỉ.

### P3-04 · Deploy Vercel + Supabase cloud **[Hỏi trước]**

1. `npx supabase link` tới project cloud, `npx supabase db push`.
2. Supabase: Authentication → URL Configuration đặt Site URL và Redirect URLs theo domain Vercel; sửa template email như P1-02; bật xác nhận email; đặt SMTP riêng nếu cần gửi nhiều email.
3. Vercel: import repo, đặt biến môi trường (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, khoá dịch vụ email), region gần Supabase (Singapore).
4. Tạo tài khoản giáo viên thật, nâng quyền bằng SQL.
5. Chạy e2e trỏ vào bản preview với tài khoản test riêng, sau đó xoá dữ liệu test.
   **Hoàn thành khi:** [ ] luồng đăng ký → vào lớp → nộp ảnh → chấm → xem điểm chạy trên domain thật từ điện thoại.

### P3-05 · Rà soát bảo mật cuối

Chạy `/security-review` trong Claude Code; rà theo danh sách: mọi bảng có RLS (`select tablename from pg_tables where schemaname='public' and not rowsecurity` trả 0 dòng); service role key chỉ xuất hiện trong route cron; không có `question_keys` ở khu student; giới hạn kích thước và loại file ở bucket; rate limit đăng nhập của Supabase để mặc định; header bảo mật cơ bản trong `next.config.ts`. Ghi kết quả vào `docs/SECURITY.md`.

### P3-06 · Theo dõi dung lượng, dọn dữ liệu cuối khoá

1. Trang giáo viên hiển thị dung lượng Storage đã dùng (RPC đếm `sum((metadata->>'size')::bigint)` trong `storage.objects`, security definer, chỉ giáo viên).
2. Chức năng "Lưu trữ lớp": xuất sổ điểm CSV, rồi xoá file ghi âm/ảnh của lớp đã kết thúc (giữ điểm và lời chữa dạng chữ). Hỏi xác nhận hai lần.
3. Ghi trong README: sao lưu database định kỳ bằng `supabase db dump`.

---

## Ngoài phạm vi (không làm nếu chưa được yêu cầu)

Lớp học video trực tuyến (dùng link Zoom/Meet trong tài liệu), thanh toán học phí, nhiều giáo viên trong một lớp,
ứng dụng native, gửi thông báo qua Zalo (cần tài khoản doanh nghiệp Zalo OA), chấm phát âm bằng AI.

## Đề xuất từ template

_(Claude ghi vào đây ở task P0-06.)_

## Nhật ký

_(Mỗi task xong thêm một dòng: ngày — mã task — tóm tắt — ghi chú cho task sau.)_

- 2026-09-28 — P0-01 — Supabase local chạy được: `supabase/config.toml`, migration `20260101000000_init.sql`
  (chuyển từ `schema.sql`, giữ nguyên phần `insert into storage.buckets` nên không khai báo bucket trong
  config.toml — tránh hai nguồn sự thật cho `file_size_limit`), `supabase/seed.sql` (4 tài khoản, lớp `DEMO01`,
  2 bài giảng, 5 từ vựng, 1 bài tập đủ 6 dạng câu hỏi + 3 đáp án, 1 thông báo). Thêm scripts `db:start/db:stop/
db:reset/db:types/test:db`. README có mục "Phát triển local"; mục cloud đổi từ "dán schema.sql" sang
  `supabase link` + `db push`.
  **Sửa kèm một lỗi có sẵn của MVP:** `app/student/page.tsx` embed `teacher:profiles(...)` bị PostgREST báo
  nhập nhằng (PGRST201) vì có hai đường nối `classes`↔`profiles` (`classes.teacher_id` và bảng `class_members`);
  query lỗi âm thầm nên mọi học viên đã vào lớp đều bị trang báo "Vào lớp đầu tiên của bạn". Đã chỉ rõ khoá
  ngoại `profiles!classes_teacher_id_fkey`. Đã rà 4 query lồng nhau còn lại của giáo viên — không chỗ nào bị.
  _Ghi chú cho task sau:_ P0-04 nên có e2e chặn đúng lỗi này (học viên seed thấy 1 bài giảng + 1 bài tập);
  khi viết select lồng nhau mới, luôn chỉ rõ khoá ngoại nếu hai bảng có nhiều hơn một quan hệ.

- 2026-09-28 — P0-02 — `lib/database.types.ts` sinh bằng `npm run db:types`; truyền generic `Database` vào
  `createServerClient` và `createBrowserClient`; thêm `lib/types.ts` (`Tables`, `TablesInsert`, `TablesUpdate`,
  `Enums` + bí danh sẵn dùng). Xoá sạch 40 chỗ `any` trong `app/` — phần lớn chỉ cần bỏ annotation vì Supabase
  đã tự suy ra kiểu từ câu select. Bỏ `must` dùng `any`, thay bằng `must<T>(res: PostgrestSingleResponse<T>)`.
  Kiểu mới lộ ra 6 lỗi tiềm ẩn mà `any` đang che, đã sửa hết:
  (1) `signedUrls` khai `string[]` nhưng cả 3 chỗ gọi đều truyền cột nullable → đổi chữ ký nhận `(string|null)[]`;
  (2) `questions.options` là `Json` chứ không phải `string[]` → thêm `questionOptions()` trong `lib/types.ts`;
  (3) `new Date(submitted_at)` với cột nullable ở 2 trang → thêm `isLate()` trong `lib/format.ts`;
  (4) `byStudent.get(...)` có thể `undefined` nhưng bị đọc thẳng `.score`/`.submitted_at`;
  (5) `src` của `<iframe>`/`<a>` nhận `null`, trong khi JSX cần `undefined`;
  (6) `QUESTION_LABELS`/`AUTO_GRADED` khai `string` → buộc theo `Enums<'question_type'>`, nên thêm giá trị enum
  mới trong migration mà quên cập nhật hai chỗ này thì TypeScript báo lỗi ngay. `pickEnum()` thu hẹp giá trị
  `<select>` trước khi ghi database.
  _Ghi chú cho task sau:_ `lib/database.types.ts` do CLI sinh ra chưa format, P0-03 chạy Prettier sẽ dọn — đừng
  sửa tay file đó, sinh lại bằng `npm run db:types`. `lib/types.ts` là chỗ để thêm helper đọc cột jsonb về sau.

- 2026-09-28 — P0-03 — `eslint.config.mjs` (flat config, `next/core-web-vitals` + `next/typescript`,
  `no-explicit-any` là error, bỏ qua `lib/database.types.ts`), `.prettierrc` (100 cột, nháy đơn,
  `prettier-plugin-tailwindcss`), `.prettierignore`. Scripts: `typecheck`, `lint`, `format`, `format:check`,
  `test`, `check`. Ghim `eslint-config-next` ở 15.x cho khớp Next 15.5 (npm mặc định kéo 16.x).
  Dọn 6 lỗi lint có sẵn, đáng chú ý: directive `eslint-disable` trong `teacher/submissions/[id]` đang nằm
  trên thẻ `<a>` thay vì thẻ `<img>` nên không có tác dụng. Chạy `npm run format` một lượt (commit riêng),
  Prettier cũng dọn luôn `lib/database.types.ts` do CLI sinh ra.
  _Ghi chú cho task sau:_ `npm run check` = typecheck + lint + test, hiện `test` là
  `vitest run --passWithNoTests`; P0-04 thay bằng test thật. `npm run build` và `npm run dev` dùng chung thư
  mục `.next` — chạy build trong lúc dev server đang mở sẽ làm dev server lỗi "Cannot find module
  ./vendor-chunks/...", phải tắt dev server hoặc xoá `.next` rồi bật lại.

- 2026-09-28 — P0-04 — Ba lớp test đã chạy được: **Vitest** 29 test (`vitest.config.mts`, `lib/format.test.ts`,
  `lib/types.test.ts`) cho `vnLocalToIso`/`isoToVnLocal` hai chiều, `youtubeEmbed` 4 dạng link, `isOverdue`,
  `isLate`, `fileExt`, `questionOptions`. **pgTAP** 40 test trong `supabase/tests/` (`rls.test.sql`,
  `submit_assignment.test.sql`, `storage.test.sql`): mỗi file tự dựng dữ liệu trong transaction rồi rollback
  nên không phụ thuộc `seed.sql`. **Playwright** 14 test (`e2e/`), `globalSetup` chạy `supabase db reset`
  trước mỗi lượt. Scripts mới: `test:e2e`.
  Ghi chú kỹ thuật gặp phải:
  - Postgres không cho CTE sửa dữ liệu nằm trong subquery → dùng `pg_temp.dem_dong_doi_duoc()` để đếm số dòng
    một câu UPDATE thực sự đổi được (RLS lọc bớt thì ra 0).
  - Trong pgTAP không insert `submissions` kèm cột `id` dưới vai học viên được, vì
    `grant insert (assignment_id, student_id)` không bao gồm `id`. Dữ liệu dựng sẵn phải tạo dưới quyền admin.
  - Playwright biên dịch sang CommonJS nên `import.meta.url` lỗi; dùng `path.resolve` từ thư mục gốc.
  - Micro giả (`--use-fake-device-for-media-stream` + `permissions: ['microphone']`) ghi âm thật được,
    câu hỏi dạng speaking test được trọn vẹn.
  - `supabase db reset` ngay sau `supabase start` đôi khi lỗi `HealthCheckTimeoutError` do container storage
    chưa healthy → `globalSetup` thử lại một lần sau 15 giây.
  - Thêm `aria-label="Nhận xét chung"` cho textarea nhận xét của giáo viên: trước đó ô này chỉ có heading
    phía trên nên trình đọc màn hình không đọc được tên ô.
    _Ghi chú cho task sau:_ các file e2e dùng chung một database và chạy tuần tự (`workers: 1`), nên đừng viết
    khẳng định kiểu "danh sách rỗng" — file khác có thể để lại dữ liệu. `e2e/fixtures/bai-viet-tay.png` là ảnh
    mẫu nhỏ; P1-03 cần thêm ảnh ~5 MB để test nén ảnh.

- 2026-09-28 — P0-05 — `.github/workflows/ci.yml` đã viết xong, **nhưng ô tiến độ vẫn để trống** vì tiêu chí
  hoàn thành là "workflow xanh trên một PR thử" mà repo chưa có remote GitHub (và máy chưa cài `gh`).
  Workflow có 2 job: (1) `npm ci` → `npm run check` → `npm run build` với biến môi trường giả;
  (2) `supabase/setup-cli` → `supabase start` → `supabase test db` → `playwright install --with-deps chromium`
  → `npm run test:e2e`, kèm upload `playwright-report/` khi hỏng. Đã chạy tay đúng từng lệnh đó ở local và
  tất cả pass; `npm ci --dry-run` xác nhận `package-lock.json` khớp `package.json`.
  _Việc còn lại:_ tạo repo trên GitHub, `git remote add origin …`, đẩy một nhánh và mở PR thử, rồi tick `[x]`.
  _Ghi chú:_ job e2e truyền `NEXT_PUBLIC_SUPABASE_*` ở bước chạy test chứ không qua `.env.local` (file đó
  không nằm trong git); `playwright.config.ts` thấy biến `CI` thì tự khởi động dev server riêng thay vì dùng lại.

- 2026-09-28 — P0-06 — Giao diện mới, có chế độ sáng và tối. Bản mẫu duyệt trước khi code nằm ở
  `design/template/giao-dien.html` (mở bằng trình duyệt, có nút đổi sáng/tối).
  - `tailwind.config.ts`: mọi màu thành `rgb(var(--x) / <alpha-value>)`. Giữ nguyên tên 6 token cũ nên không
    trang nào phải sửa; thêm `surface` (nền thẻ và ô nhập) và `on-accent` (chữ trên nền jade/seal đặc — ở nền
    tối jade và seal được làm sáng lên nên chữ trắng không đủ tương phản).
  - `app/globals.css`: bảng sáng khai ở `:root`, bảng tối khai một lần vào các biến `--dark-*` rồi gán lại
    trong cả `@media (prefers-color-scheme: dark)` và `:root[data-theme="dark"]` — nhờ vậy giá trị chỉ viết
    một chỗ mà cả "theo máy" lẫn "người dùng tự chọn" đều chạy, và lựa chọn sáng thắng được máy đang để tối.
  - `components/AppShell.tsx`: cột trái cố định từ khổ `lg`; khổ điện thoại dùng thanh trên đỉnh, cộng thanh
    tab dưới đáy khi có từ 2 mục trở lên (khu học viên hiện 1 mục nên chưa hiện — P1-02 và P2-04 thêm mục thì
    tự có). `components/NavLinks.tsx` nhận `variant: 'sidebar' | 'tabbar'`, icon khai theo tên trong layout.
  - `components/ThemeToggle.tsx` mới; `app/layout.tsx` chạy một script nhỏ trước khi vẽ để không nháy trắng,
    và đặt `themeColor` theo từng chế độ.
  - Dọn nốt màu hardcode không đổi theo theme: `bg-white` trong `Tianzige`, `text-white` trong `AudioRecorder`,
    `bg-white` ở một thẻ trong trang bài giảng học viên, và `bg-amber-*` của `.tag-submitted`.
  - `CLAUDE.md`: mục "Giao diện" viết lại cho khớp — liệt kê 8 token, cấm `bg-white`/hex/màu Tailwind có sẵn,
    nói rõ chế độ tối bật bằng `data-theme` và phải xem lại cả hai chế độ.
  - Kiểm tra: 29 unit + 40 pgTAP + 14 e2e pass, `npm run build` pass. Đo ở 375px cả sáng lẫn tối: không trang
    nào tràn ngang.
    _Ghi chú cho task sau:_ vẫn còn 4–6 vùng bấm cao dưới 40px ở mỗi trang — để P1-10 xử lý.
    Khi viết test e2e, tên người dùng và nút đăng xuất có **hai** bản trong DOM (cột trái và thanh trên đỉnh);
    `getByRole` tự lọc bản đang ẩn nhưng `getByText` thì không, phải chỉ rõ vùng.
    Chưa có trang nào dùng `dark:` — nếu cần thì biến thể đã cấu hình sẵn là `&:where([data-theme="dark"] *)`.

- 2026-09-28 — P0-05 (tiếp) — Đã nối repo với https://github.com/hynu15/web_tieng_trung và đẩy 8 commit lên.
  Nhánh local lúc `git init` tên `master`, đã đổi thành `main` cho khớp `on.push.branches` trong workflow.
  **CI xanh cả hai job** ngay lượt đầu trên runner sạch: `npm ci` → `npm run check` → `npm run build`, và
  `supabase start` → `supabase test db` (40 test) → `playwright install` → `npm run test:e2e` (14 test).
  Lượt chạy: https://github.com/hynu15/web_tieng_trung/actions/runs/36340598945
  _Lưu ý:_ xác minh bằng lượt push lên `main` chứ chưa qua một PR thử, nên nhánh kích hoạt `pull_request`
  chưa chạy lần nào — cùng workflow, cùng job, chỉ khác dòng khai sự kiện.
  _Ghi chú cho task sau:_ job e2e mất khoảng 4 phút. Nếu về sau chậm quá thì cache
  `~/.cache/ms-playwright` và tách e2e sang workflow chạy theo lịch.
