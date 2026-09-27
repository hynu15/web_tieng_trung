# Báo cáo kỹ thuật — Lớp Hán ngữ

> **File này để làm gì**
>
> Hai mục đích:
>
> 1. **Cho bạn học.** Bạn chưa làm web bao giờ, nên mỗi công nghệ ở đây đều được giải thích
>    "nó là gì, tại sao dự án này cần nó", không chỉ liệt kê tên.
> 2. **Cho Claude đọc lại khi bạn báo bug.** Thay vì đọc lại cả project, đọc file này là nắm
>    được luồng kiến trúc, biết bug nằm ở tầng nào.
>
> **Cách dùng nhanh:** gặp bug thì nhảy thẳng xuống [§9 Nhật ký lỗi đã gặp](#9-nhật-ký-lỗi-đã-gặp-và-cách-sửa)
> và [§10 Checklist khi gặp bug](#10-checklist-khi-gặp-bug). Muốn hiểu hệ thống thì đọc từ §1.
>
> Cập nhật lần cuối: 28/09/2026, sau khi xong giai đoạn P0 (6/6 task).
> Repo: https://github.com/hynu15/web_tieng_trung

---

## Mục lục

1. [Web này làm gì](#1-web-này-làm-gì)
2. [Bản đồ công nghệ](#2-bản-đồ-công-nghệ)
3. [Kiến trúc: dữ liệu chạy từ đâu đến đâu](#3-kiến-trúc-dữ-liệu-chạy-từ-đâu-đến-đâu)
4. [Cấu trúc thư mục, từng file làm gì](#4-cấu-trúc-thư-mục-từng-file-làm-gì)
5. [Database](#5-database)
6. [Ba luồng quan trọng nhất](#6-ba-luồng-quan-trọng-nhất)
7. [Hệ thống giao diện](#7-hệ-thống-giao-diện)
8. [Test: ba lớp, mỗi lớp bắt loại lỗi khác nhau](#8-test-ba-lớp-mỗi-lớp-bắt-loại-lỗi-khác-nhau)
9. [Nhật ký lỗi đã gặp và cách sửa](#9-nhật-ký-lỗi-đã-gặp-và-cách-sửa)
10. [Checklist khi gặp bug](#10-checklist-khi-gặp-bug)
11. [Lệnh hay dùng](#11-lệnh-hay-dùng)
12. [Cạm bẫy: những thứ rất dễ làm sai](#12-cạm-bẫy-những-thứ-rất-dễ-làm-sai)
13. [Từ điển thuật ngữ](#13-từ-điển-thuật-ngữ)
14. [Còn nợ gì](#14-còn-nợ-gì)

---

## 1. Web này làm gì

Một giáo viên dạy tiếng Trung cho khoảng 40 học viên.

| Vai trò       | Làm được gì                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Giáo viên** | Tạo lớp (sinh mã 6 ký tự), đăng bài giảng (file/link/từ vựng), giao bài tập 6 dạng câu hỏi, chấm và chữa từng câu, ghi âm nhận xét |
| **Học viên**  | Nhập mã vào lớp, xem bài giảng, làm bài (gõ chữ, chụp ảnh bài viết tay, ghi âm), xem điểm và lời chữa                              |

**Sáu dạng câu hỏi:**

| Dạng               | Mã trong database | Máy chấm được?        |
| ------------------ | ----------------- | --------------------- |
| Trắc nghiệm        | `multiple_choice` | ✅                    |
| Điền từ            | `fill_blank`      | ✅                    |
| Viết pinyin        | `pinyin`          | ✅                    |
| Tự luận            | `essay`           | ❌ giáo viên chấm tay |
| Viết tay (nộp ảnh) | `writing`         | ❌                    |
| Nói (ghi âm)       | `speaking`        | ❌                    |

**Quy ước màu quan trọng:** màu đỏ (`seal`) **chỉ** dùng cho lời chữa của giáo viên, thông báo lỗi và
nhãn quá hạn. Đây là quy ước có ý nghĩa thật — giống mực đỏ thầy cô chấm bài trên giấy. Thao tác
bình thường dùng màu xanh ngọc (`jade`).

---

## 2. Bản đồ công nghệ

Đây là phần dành cho bạn — người chưa làm web. Mỗi mục trả lời: _nó là gì_, _tại sao dự án cần nó_.

### 2.1 Nền tảng

#### Node.js

Chương trình cho phép chạy JavaScript **ngoài trình duyệt** (trên máy tính, trên server).
Trước Node, JavaScript chỉ chạy trong trình duyệt. Nhờ Node mà ta viết được cả phần server bằng JavaScript.

Dự án cần Node 20+. Máy bạn đang có v22.

#### npm

Trình quản lý thư viện đi kèm Node. Ba thứ cần biết:

| Thứ                 | Là gì                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `package.json`      | Khai báo dự án cần thư viện nào, và các lệnh tắt (`scripts`)                                                 |
| `package-lock.json` | Ghi **chính xác** phiên bản từng thư viện. File này bắt buộc commit, để máy bạn và máy CI cài giống hệt nhau |
| `node_modules/`     | Thư mục chứa thư viện đã tải. **Không** commit (đã có trong `.gitignore`), rất nặng                          |

- `npm install` — cài theo `package.json`, có thể cập nhật lock file.
- `npm ci` — cài **đúng y hệt** lock file, xoá `node_modules` cũ. Dùng trên CI vì cần tái lập chính xác.

#### TypeScript

JavaScript có thêm **kiểu dữ liệu**. Nghĩa là bạn khai báo "biến này là chuỗi", "hàm này trả về số",
và trình biên dịch báo lỗi **trước khi chạy** nếu bạn dùng sai.

Ví dụ thật trong dự án này: cột `submitted_at` trong database có thể **rỗng** (`null`) khi học viên
chưa nộp. Code cũ viết `new Date(s.submitted_at)` — nếu `null` thì tạo ra ngày không hợp lệ, hiển thị
sai mà không báo lỗi gì. TypeScript bắt được ngay vì nó biết kiểu là `string | null`.

Dự án bật `strict: true` (chế độ nghiêm ngặt nhất) và **cấm dùng `any`** — `any` nghĩa là "tôi không
biết kiểu gì, đừng kiểm tra", tức là tắt hết lợi ích của TypeScript.

### 2.2 Giao diện

#### React

Thư viện dựng giao diện. Ý tưởng cốt lõi: **chia màn hình thành các "component"** (thành phần) nhỏ,
mỗi component là một hàm trả về mô tả giao diện.

```tsx
// components/SubmitButton.tsx — một component
export function SubmitButton({ children }) {
  return <button className="btn-primary">{children}</button>;
}
// Dùng ở nơi khác: <SubmitButton>Nộp bài</SubmitButton>
```

Cú pháp `<button>` viết lẫn trong JavaScript gọi là **JSX**.

#### Next.js 15 (App Router)

Framework xây trên React. React chỉ lo giao diện; Next.js lo phần còn lại: định tuyến (URL nào ra
trang nào), chạy code trên server, tối ưu, đóng gói.

**App Router** là cách định tuyến bằng **thư mục**:

```
app/teacher/lessons/[id]/page.tsx   →   URL: /teacher/lessons/abc-123
     └─ tên thư mục thành URL          └─ [id] là phần thay đổi được
```

| File đặc biệt   | Ý nghĩa                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| `page.tsx`      | Nội dung của một trang                                                        |
| `layout.tsx`    | Khung bao quanh, dùng chung cho mọi trang con (không vẽ lại khi chuyển trang) |
| `error.tsx`     | Hiện khi trang con ném lỗi                                                    |
| `not-found.tsx` | Hiện khi gọi `notFound()` hoặc URL sai                                        |
| `middleware.ts` | Chạy **trước** mọi request, ở gốc dự án (không nằm trong `app/`)              |

#### Tailwind CSS

Cách viết CSS bằng **class có sẵn** đặt thẳng trong HTML, thay vì viết file CSS riêng:

```tsx
<div className="flex items-center gap-3 rounded-xl border border-line p-4">
     <!--     ↑ bố cục ngang  ↑ căn giữa  ↑ cách nhau  ↑ bo góc  ↑ viền  ↑ đệm trong -->
```

Lý do dùng: nhìn một thẻ là biết nó trông thế nào, không phải nhảy qua lại giữa hai file, và không
sợ đặt trùng tên class.

Dự án **giới hạn** chỉ được dùng token màu riêng (`bg-surface`, `text-ink`…), cấm dùng màu có sẵn của
Tailwind (`bg-white`, `text-gray-500`) — lý do ở [§7](#7-hệ-thống-giao-diện).

### 2.3 Dữ liệu

#### PostgreSQL (thường gọi là Postgres)

Hệ quản trị cơ sở dữ liệu quan hệ. "Quan hệ" nghĩa là dữ liệu nằm trong **bảng** có cột cố định, và
các bảng **nối với nhau** bằng khoá.

Ví dụ: bảng `lessons` có cột `class_id` trỏ tới `classes.id`. Đó là **khoá ngoại** (foreign key).
Nhờ nó, database tự đảm bảo không tồn tại bài giảng thuộc một lớp không có thật, và khi xoá lớp thì
bài giảng của lớp đó cũng bị xoá theo (`on delete cascade`).

#### Supabase

Gói dịch vụ dựng sẵn quanh Postgres. Thay vì bạn tự viết server, Supabase cho sẵn 4 thứ:

| Thành phần    | Làm gì                            | Dự án dùng thế nào                             |
| ------------- | --------------------------------- | ---------------------------------------------- |
| **Postgres**  | Database                          | 13 bảng                                        |
| **Auth**      | Đăng ký, đăng nhập, quản lý phiên | Email + mật khẩu                               |
| **PostgREST** | Tự sinh API từ bảng database      | Mọi câu `supabase.from('lessons').select(...)` |
| **Storage**   | Lưu file                          | 2 bucket: `materials`, `submissions`           |

**Điểm quan trọng nhất phải hiểu:** Supabase để trình duyệt gọi **thẳng** vào database qua API.
Nghe có vẻ nguy hiểm — nếu ai cũng gọi được thì sao chặn họ đọc bài của người khác? Câu trả lời là
**RLS**, xem ngay dưới.

#### RLS (Row Level Security) — phần quan trọng nhất của dự án này

Tính năng của Postgres: gắn **luật lọc dòng** ngay trong database. Mỗi câu truy vấn, Postgres tự thêm
điều kiện lọc dựa trên **ai đang hỏi**.

Ví dụ thật, policy cho bảng `question_keys` (chứa đáp án):

```sql
create policy keys_teacher on public.question_keys for all
  using (exists (select 1 from questions q
                  where q.id = question_id
                    and public.teaches_class(public.assignment_class(q.assignment_id))));
```

Nghĩa là: _chỉ trả về dòng nào thuộc bài tập của lớp mà người đang hỏi là giáo viên_.

Học viên chạy `select * from question_keys` sẽ nhận về **0 dòng** — không phải lỗi, không phải
"bị chặn", mà đơn giản là với họ bảng đó rỗng. Kể cả họ mở DevTools gọi API bằng tay cũng vậy.

> **Vì sao điều này quan trọng:** trong nhiều web, bảo mật nằm ở code server — "nếu là học viên thì
> đừng trả về đáp án". Quên một chỗ là lộ. Ở đây luật nằm trong database, mọi đường vào đều bị áp
> cùng một luật. Code giao diện có sai cũng không lộ được.

Đây là lý do dự án có 40 test pgTAP riêng chỉ để kiểm tra RLS.

#### Docker

Công cụ chạy phần mềm trong "container" — như máy ảo nhẹ. Supabase local cần Postgres + 8 dịch vụ
khác; thay vì cài từng cái, Docker chạy tất cả bằng một lệnh `npx supabase start`.

Vì vậy: **Docker không chạy thì `npx supabase start` sẽ lỗi.**

### 2.4 Công cụ chất lượng

| Công cụ            | Làm gì                                                  | Lệnh               |
| ------------------ | ------------------------------------------------------- | ------------------ |
| **ESLint**         | Bắt lỗi kiểu "biến khai rồi không dùng", "dùng `any`"   | `npm run lint`     |
| **Prettier**       | Tự định dạng code cho đều (thụt lề, xuống dòng)         | `npm run format`   |
| **Vitest**         | Chạy unit test (test hàm nhỏ)                           | `npm run test`     |
| **pgTAP**          | Chạy test **bằng SQL**, ngay trong database             | `npm run test:db`  |
| **Playwright**     | Điều khiển trình duyệt thật để test cả luồng người dùng | `npm run test:e2e` |
| **GitHub Actions** | Tự chạy hết các test trên khi push code                 | tự động            |

---

## 3. Kiến trúc: dữ liệu chạy từ đâu đến đâu

### 3.1 Điểm lạ nhất: không có backend riêng

Web truyền thống có 3 phần: **trình duyệt** → **server API của bạn** → **database**.

Dự án này bỏ phần giữa:

```
                    ┌──────────────────────────────────────────┐
   Trình duyệt ────▶ │ Next.js (Server Component + Server Action)│ ──▶ Supabase
                    └──────────────────────────────────────────┘      (Postgres
                              chỉ render HTML và nhận form             + RLS)
```

Không có thư mục `api/`, không có Express, không có route `/api/lessons`. Thay vào đó:

- **Đọc dữ liệu** → làm thẳng trong Server Component (khi render trang).
- **Ghi dữ liệu** → làm bằng Server Action (hàm chạy trên server, gọi từ form).

Bảo mật không dựa vào "server của tôi kiểm tra quyền" mà dựa vào **RLS trong database**.

### 3.2 Server Component vs Client Component

Đây là khái niệm khó nhất của Next.js hiện đại. Phải hiểu nó mới debug được.

**Server Component** (mặc định — mọi file trong `app/` không ghi gì thêm):

- Chạy **trên server**, kết quả gửi về trình duyệt là HTML đã dựng sẵn.
- Được phép `await` gọi database trực tiếp.
- **Không có** `useState`, `onClick`, không tương tác được.
- Code của nó **không** gửi xuống trình duyệt → bí mật (khoá, câu truy vấn) không lộ.

```tsx
// app/teacher/page.tsx — Server Component
export default async function TeacherHome() {
  const { supabase } = await requireRole('teacher');   // gọi DB ngay tại đây
  const { data: pending } = await supabase.from('submissions').select(...);
  return <ul>{pending.map(...)}</ul>;
}
```

**Client Component** (phải ghi `'use client'` ở dòng đầu file):

- Code gửi xuống trình duyệt và chạy ở đó.
- Có `useState`, `onClick`, đọc được `localStorage`, dùng được micro/camera.
- **Không** gọi database trực tiếp được (sẽ lộ khoá).

```tsx
// components/ThemeToggle.tsx
'use client';
export function ThemeToggle() {
  const [theme, setTheme] = useState(null);   // useState chỉ có ở Client Component
  ...
}
```

**Quy tắc của dự án** (trong `CLAUDE.md`): Client Component phải **càng nhỏ càng tốt**. Trang vẫn là
Server Component; chỉ tách riêng cái nút cần tương tác thành Client Component.

Hiện dự án có đúng 5 Client Component:

| File                           | Vì sao phải là Client                       |
| ------------------------------ | ------------------------------------------- |
| `components/NavLinks.tsx`      | Cần `usePathname()` để biết mục nào đang mở |
| `components/ThemeToggle.tsx`   | Cần `localStorage` và `onClick`             |
| `components/AudioRecorder.tsx` | Cần micro (`navigator.mediaDevices`)        |
| `components/SubmitButton.tsx`  | Cần `useFormStatus()` để hiện "Đang nộp…"   |
| `components/SpeakButton.tsx`   | Cần API đọc chữ của trình duyệt             |

### 3.3 Server Action

Cách ghi dữ liệu. Là hàm có `'use server'`, gắn thẳng vào form:

```tsx
// app/student/actions.ts
'use server';
export async function joinClass(fd: FormData) {
  const { supabase } = await requireRole('student'); // ① luôn kiểm tra quyền trước
  await supabase.rpc('join_class', { code: String(fd.get('code')) });
  revalidatePath('/student'); // ② báo Next tải lại dữ liệu trang
  redirect('/student'); // ③ chuyển trang
}
```

Dùng ở trang:

```tsx
<form action={joinClass}>
  <input name="code" />
  <button>Vào lớp</button>
</form>
```

Next.js tự tạo một endpoint ẩn. Bấm nút → trình duyệt gửi form lên server → hàm chạy trên server →
trả về trang mới. **Không phải viết fetch, không phải viết API route.**

> **Luật bắt buộc:** mọi Server Action phải mở đầu bằng `requireRole('teacher')` hoặc
> `requireRole('student')`. Không được tin `id` client gửi lên — phải để RLS lọc, và kiểm tra quyền
> sở hữu khi cần. Lý do: Server Action là endpoint công khai, ai cũng gọi được nếu biết cách.

### 3.4 Ba tầng bảo vệ

Phân quyền được kiểm tra ở 3 chỗ, mỗi chỗ một nhiệm vụ:

```
┌─ Tầng 1 ── middleware.ts ─────────────────────────────────────┐
│  Chạy trước MỌI request. Chưa đăng nhập → đẩy về /login.      │
│  Cũng làm mới session (token Supabase hết hạn sau 1 giờ).     │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌─ Tầng 2 ── layout.tsx + lib/auth.ts ──────────────────────────┐
│  requireRole('teacher') — sai vai trò thì đẩy sang khu đúng.  │
│  Đây là tầng làm cho TRẢI NGHIỆM đúng, không phải bảo mật.    │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌─ Tầng 3 ── RLS trong Postgres ───────── LỚP BẢO MẬT THẬT ─────┐
│  Dù bỏ qua được tầng 1 và 2, database vẫn không trả dữ liệu   │
│  không thuộc về bạn. Đây là tầng duy nhất không lách được.    │
└───────────────────────────────────────────────────────────────┘
```

**Nhớ kỹ:** tầng 1 và 2 chỉ để người dùng không lạc đường. Nếu bạn xoá hết tầng 1 và 2, web vẫn an
toàn — chỉ là xấu. Nếu bạn xoá tầng 3, web lộ hết dữ liệu.

### 3.5 Hai Supabase client khác nhau

| File                     | Dùng ở đâu                                  | Lấy phiên đăng nhập từ đâu |
| ------------------------ | ------------------------------------------- | -------------------------- |
| `lib/supabase/server.ts` | Server Component, Server Action, middleware | Cookie của request         |
| `lib/supabase/client.ts` | Client Component                            | Cookie của trình duyệt     |

Cả hai đều truyền `<Database>` — kiểu sinh tự động từ database, nhờ đó gõ sai tên cột là TypeScript
báo lỗi ngay.

```ts
return createServerClient<Database>(url, anonKey, { cookies: {...} });
//                       ↑ nhờ dòng này mà .from('lessons').select('titel') báo lỗi
```

---

## 4. Cấu trúc thư mục, từng file làm gì

```
web/
├── app/                          ← Toàn bộ trang và route (App Router)
│   ├── layout.tsx                  Khung HTML gốc: font, script chống nháy trắng khi mở nền tối
│   ├── page.tsx                    URL "/" — chỉ đọc vai trò rồi đẩy sang /teacher hoặc /student
│   ├── globals.css                 ★ Token màu + mọi class dùng chung (btn, field, panel, tag…)
│   ├── error.tsx / not-found.tsx   Trang lỗi chung
│   ├── login/
│   │   ├── page.tsx                Form đăng nhập / đăng ký (một trang, đổi bằng ?mode=signup)
│   │   └── actions.ts              login, signup, logout
│   ├── teacher/
│   │   ├── layout.tsx              requireRole('teacher') + khai các mục điều hướng
│   │   ├── actions.ts              ★ MỌI thao tác ghi của giáo viên (282 dòng)
│   │   ├── page.tsx                Tổng quan: bài chờ chấm, danh sách lớp
│   │   ├── lessons/                Danh sách + chi tiết bài giảng
│   │   ├── assignments/            Danh sách + soạn bài tập, thêm câu hỏi
│   │   ├── students/               Danh sách học viên
│   │   └── submissions/[id]/       ★ Trang chấm bài
│   └── student/
│       ├── layout.tsx              requireRole('student')
│       ├── actions.ts              joinClass, submitAssignment
│       ├── page.tsx                Lớp học: bài cần làm, đã nộp, bài giảng
│       ├── lessons/[id]/           Xem bài giảng + từ vựng
│       └── assignments/[id]/       ★ Làm bài / xem bài đã chấm (cùng một file, rẽ theo status)
│
├── components/                   ← Dùng chung nhiều nơi
│   ├── AppShell.tsx                ★ Khung trang: cột trái (máy tính) / tab dưới đáy (điện thoại)
│   ├── NavLinks.tsx                'use client' — mục điều hướng + icon, biết mục nào đang mở
│   ├── ThemeToggle.tsx             'use client' — nút sáng/tối, nhớ trong localStorage
│   ├── AudioRecorder.tsx           'use client' — ghi âm bằng MediaRecorder, gắn file vào form
│   ├── SubmitButton.tsx            'use client' — nút hiện "Đang nộp…" khi form đang gửi
│   ├── SpeakButton.tsx             'use client' — đọc chữ Hán bằng giọng máy
│   └── Tianzige.tsx                Ô 田字格 (ô tập viết chữ Hán) — họa tiết nhận diện của app
│
├── lib/                          ← Hàm dùng chung, không phải giao diện
│   ├── auth.ts                     getSession(), requireRole() — cửa vào của mọi trang
│   ├── supabase/server.ts          Client Supabase cho phía server
│   ├── supabase/client.ts          Client Supabase cho trình duyệt
│   ├── database.types.ts           ★ SINH TỰ ĐỘNG — đừng sửa tay (npm run db:types)
│   ├── types.ts                    Kiểu tiện dùng: Tables<'lessons'>, Enums<'question_type'>…
│   ├── format.ts                   Ngày giờ VN, nhúng YouTube, đuôi file, nhãn câu hỏi
│   ├── storage.ts                  uploadFile(), signedUrls()
│   └── *.test.ts                   Unit test
│
├── supabase/                     ← Database
│   ├── config.toml                 Cấu hình Supabase local (cổng, tắt xác nhận email…)
│   ├── migrations/                 ★ NGUỒN SỰ THẬT của schema
│   │   └── 20260101000000_init.sql
│   ├── seed.sql                    Dữ liệu mẫu: 4 tài khoản, lớp DEMO01, 1 bài tập đủ 6 dạng
│   ├── schema.sql                  Bản tham khảo để đọc một lượt. KHÔNG chạy, KHÔNG sửa.
│   └── tests/                      40 test pgTAP kiểm tra RLS
│
├── e2e/                          ← Test luồng người dùng (Playwright)
├── docs/PLAN.md                  ← 30 task + nhật ký từng task đã làm
├── design/template/giao-dien.html  Bản mẫu giao diện (mở bằng trình duyệt, có nút sáng/tối)
├── middleware.ts                 ← Chạy trước mọi request
├── tailwind.config.ts            ← Khai token màu (trỏ vào biến CSS)
├── CLAUDE.md                     ← Quy tắc dự án, Claude đọc file này mỗi phiên
└── report.md                     ← File bạn đang đọc
```

**Ba file nặng nhất khi debug:**

- `app/teacher/actions.ts` (282 dòng) — mọi thao tác ghi của giáo viên
- `app/student/assignments/[id]/page.tsx` (218 dòng) — trang làm bài và xem kết quả
- `supabase/migrations/20260101000000_init.sql` (422 dòng) — toàn bộ schema và RLS

---

## 5. Database

### 5.1 Sơ đồ bảng

```
auth.users  (Supabase Auth quản lý — đừng ghi thẳng vào, trừ seed.sql)
    │ 1-1, tạo tự động bằng trigger on_auth_user_created
    ▼
 profiles ──────────────┐ (id, role: teacher|student, full_name)
    │ teacher_id        │ student_id
    ▼                   ▼
 classes ─────────▶ class_members  (bảng nối: học viên nào trong lớp nào)
    │  (id, name, join_code 6 ký tự, hsk_level)
    │
    ├──▶ lessons  (title, summary, position, published ←── học viên chỉ thấy khi = true)
    │       ├──▶ lesson_materials  (type: slide|video|document|link, storage_path HOẶC url)
    │       └──▶ vocab             (hanzi, pinyin, meaning_vi, example)
    │                └──▶ vocab_reviews  (flashcard SRS — bảng đã có, tính năng làm ở P2-04)
    │
    ├──▶ announcements  (thông báo lớp — bảng đã có, giao diện làm ở P1-08)
    │
    └──▶ assignments  (title, instructions, due_at, published)
            └──▶ questions  (type, prompt, options jsonb, points, position)
                    ├──▶ question_keys  ★ ĐÁP ÁN — RLS chặn tuyệt đối học viên đọc
                    └──▶ submissions  (status: draft|submitted|graded, score, teacher_comment)
                            └──▶ submission_answers
                                   (text_answer, file_path, auto_score, teacher_score, comment)
```

**Vì sao đáp án tách ra bảng riêng `question_keys`?**
Nếu để cột `answer` ngay trong `questions`, học viên phải đọc được `questions` (để thấy đề bài) thì
cũng đọc được đáp án — RLS lọc theo _dòng_, không lọc theo _cột_. Tách ra bảng riêng thì chặn được
sạch sẽ.

> **Luật tuyệt đối:** không bao giờ `select` bảng `question_keys` ở bất kỳ trang nào dưới `app/student/`.

### 5.2 Ba cơ chế bảo vệ trong database

Ngoài RLS, database còn 2 lớp nữa. Phải hiểu cả ba mới debug được lỗi "permission denied".

**(a) RLS — lọc theo dòng**

```sql
-- Học viên chỉ thấy bài giảng đã đăng; giáo viên thấy cả bài nháp
create policy lessons_select on public.lessons for select
  using (public.teaches_class(class_id) or (published and public.in_class(class_id)));
```

**(b) Column grants — chặn theo cột**

```sql
revoke update on public.profiles from authenticated;
grant  update (full_name) on public.profiles to authenticated;
```

Nghĩa là người dùng đã đăng nhập chỉ được sửa cột `full_name`. Cố sửa `role` → lỗi `42501`
(permission denied). **Đây là lý do học viên không tự lên làm giáo viên được.**

Tương tự với `submissions`:

```sql
revoke insert, update on public.submissions from authenticated;
grant  insert (assignment_id, student_id) on public.submissions to authenticated;
grant  update (status, score, graded_at, teacher_comment, feedback_audio_path) on public.submissions to authenticated;
```

Học viên tạo bài làm chỉ được điền 2 cột — không tự điền `score` được.
Còn quyền `update` các cột điểm thì có ở tầng cột, nhưng RLS (`submissions_update` chỉ cho giáo viên)
chặn ở tầng dòng. **Hai lớp cộng lại mới ra kết quả đúng** — đây là chỗ dễ đọc nhầm nhất trong schema.

**(c) Hàm `security definer` — cửa hẹp có kiểm soát**

Hàm SQL chạy bằng quyền của **người tạo hàm** (admin), không phải người gọi. Dùng cho thao tác mà
người dùng không được làm trực tiếp, nhưng được làm **theo đúng một quy trình**.

| Hàm                                                                            | Ai gọi            | Làm gì                                                      |
| ------------------------------------------------------------------------------ | ----------------- | ----------------------------------------------------------- |
| `handle_new_user()`                                                            | trigger tự động   | Tạo dòng `profiles` khi có tài khoản mới                    |
| `join_class(code)`                                                             | học viên          | Tìm lớp theo mã, thêm vào `class_members`. Mã sai → ném lỗi |
| `submit_assignment(sub_id)`                                                    | học viên          | ★ Khoá bài, **xoá mọi điểm học viên tự điền**, chấm tự động |
| `is_teacher()`, `teaches_class(cid)`, `in_class(cid)`, `assignment_class(aid)` | dùng trong policy | Hàm trợ giúp                                                |

> **Vì sao các hàm trợ giúp phải là `security definer`?**
> Nếu policy của bảng A truy vấn bảng B, mà bảng B cũng có policy truy vấn bảng A → đệ quy vô hạn.
> Hàm `security definer` chạy bỏ qua RLS nên cắt được vòng lặp.

### 5.3 Hàm chấm tự động — đọc kỹ chỗ này

`submit_assignment` là trái tim của việc chấm. Ba việc theo thứ tự:

```sql
-- 1. Xoá sạch điểm cũ (kể cả điểm học viên tự điền lúc bài còn nháp)
update submission_answers
   set auto_score = null, teacher_score = null, comment = null
 where submission_id = sub_id;

-- 2. Chấm các câu có đáp án
update submission_answers sa
   set auto_score = case
         when exists (
           select 1 from unnest(string_to_array(k.answer, '|')) as a(v)
            where lower(regexp_replace(trim(a.v), '\s+', ' ', 'g'))
                = lower(regexp_replace(trim(coalesce(sa.text_answer, '')), '\s+', ' ', 'g'))
         ) then q.points else 0 end
  from questions q join question_keys k on k.question_id = q.id
 where sa.submission_id = sub_id and sa.question_id = q.id
   and q.type in ('multiple_choice', 'fill_blank', 'pinyin');

-- 3. Khoá bài
update submissions set status = 'submitted', submitted_at = now() where id = sub_id;
```

**Cách so khớp đáp án hiện tại:**

- `string_to_array(k.answer, '|')` — một câu có thể có **nhiều đáp án đúng**, ngăn bằng dấu `|`.
  Ví dụ: `zài jiàn|zàijiàn|zai4 jian4|zai4jian4`
- `trim` + `regexp_replace(..., '\s+', ' ')` — bỏ khoảng trắng đầu/cuối, gộp khoảng trắng liên tiếp
- `lower` — không phân biệt hoa thường

Nên `"  ZAI4   jian4 "` vẫn khớp `"zai4 jian4"`. (Có test pgTAP cho đúng trường hợp này.)

**Giới hạn hiện tại:** chưa chuẩn hoá pinyin. `nǐ hǎo` và `ni3 hao3` là hai chuỗi khác nhau, phải
liệt kê cả hai trong đáp án. Task **P2-01** sẽ tự chuẩn hoá.

### 5.4 Migration — quy tắc bắt buộc

**Migration** là file SQL mô tả **một thay đổi** schema. Database được dựng bằng cách chạy lần lượt
các file theo thứ tự tên.

```
supabase/migrations/
  20260101000000_init.sql          ← đã chạy
  20260215093000_them_cot_abc.sql  ← file bạn thêm sau này
```

| Luật                                                                               | Vì sao                                                                     |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Không bao giờ sửa migration đã có**                                              | Máy bạn đã chạy nó rồi; máy khác chạy bản sửa → hai database khác nhau     |
| Đổi schema = **tạo file mới**                                                      | Tên file bắt đầu bằng timestamp để đảm bảo thứ tự                          |
| Sau khi thêm migration, chạy đủ 3 lệnh                                             | `npm run db:reset` → `npm run db:types` → `npm run test:db`                |
| `alter type ... add value` phải nằm **file riêng**                                 | Postgres không cho dùng giá trị enum mới trong cùng transaction vừa tạo nó |
| Bảng mới **phải** có `enable row level security` + policy **trong cùng migration** | Bảng không có RLS = lộ dữ liệu                                             |

`supabase/schema.sql` chỉ để **đọc tham khảo** toàn bộ schema trong một lần. Đừng chạy, đừng sửa.

### 5.5 Storage

Hai "bucket" (thùng chứa file), **cả hai đều riêng tư**:

| Bucket        | Giới hạn | Quy ước đường dẫn                                                                                                |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `materials`   | 50 MB    | `{class_id}/{lesson_id}/{file}`                                                                                  |
| `submissions` | 10 MB    | `{class_id}/{student_id}/{assignment_id}/{file}`<br>`{class_id}/{student_id}/feedback/{file}` (giáo viên ghi âm) |

Phân quyền **đọc đường dẫn để biết ai được truy cập**:

```sql
create policy "submissions write" on storage.objects for insert
  with check (bucket_id = 'submissions' and (
    ((storage.foldername(name))[2] = auth.uid()::text      -- thư mục thứ 2 phải là chính mình
      and public.in_class(((storage.foldername(name))[1])::uuid))
    or public.teaches_class(((storage.foldername(name))[1])::uuid)));
```

Nên học viên **không** upload được vào thư mục của bạn cùng lớp (có test pgTAP).

Bucket riêng tư → không có URL công khai. Muốn hiện ảnh phải tạo **link ký có hạn 1 giờ**:

```ts
// lib/storage.ts
const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, 3600);
```

---

## 6. Ba luồng quan trọng nhất

### 6.1 Đăng nhập và phân quyền

```
1. Người dùng điền form ở /login
        ↓
2. Server Action login() (app/login/actions.ts)
     supabase.auth.signInWithPassword({ email, password })
     → Supabase trả về token, @supabase/ssr lưu vào cookie
        ↓
3. redirect('/')
        ↓
4. middleware.ts chạy: thấy đã có user → cho qua
        ↓
5. app/page.tsx: getSession() đọc profiles.role → redirect('/teacher') hoặc '/student'
        ↓
6. app/teacher/layout.tsx: requireRole('teacher')
     - Sai vai trò → đẩy về khu đúng
     - Đúng → render AppShell + trang con
```

**Chỗ hay hỏng:**

- Cookie không được lưu → quay lại `/login` ngay. Xem `lib/supabase/server.ts`, phần `setAll`.
- `middleware.ts` phải gọi `supabase.auth.getUser()` mỗi request để **làm mới token**. Bỏ đi thì
  người dùng bị đá ra sau 1 giờ.

### 6.2 Học viên nộp bài (luồng phức tạp nhất)

File: `app/student/actions.ts` → `submitAssignment()`

```
1. Học viên bấm "Nộp bài" → form gửi lên
        ↓
2. requireRole('student')
        ↓
3. Lấy thông tin bài tập + danh sách câu hỏi
        ↓
4. Tìm bản nháp (submissions status='draft'); chưa có thì tạo mới
     ↳ Nếu đã 'submitted' → redirect, không cho nộp lại
        ↓
5. Duyệt từng câu hỏi:
     - Lấy text từ ô nhập:  fd.get(`q_${q.id}`)
     - Lấy file từ ô file:  fd.get(`f_${q.id}`)
     - Có file → uploadFile() lên Storage, lấy về đường dẫn
     - Cả hai đều trống → bỏ qua, không tạo dòng
        ↓
6. upsert vào submission_answers  (upsert = có rồi thì sửa, chưa có thì thêm)
        ↓
7. Gọi RPC submit_assignment(sub_id)  ← chấm tự động, khoá bài (xem §5.3)
        ↓
8. revalidatePath('/student') + redirect
```

**Quy ước đặt tên ô trong form** — nhớ kỹ, đây là dây nối giữa giao diện và action:

| Tiền tố               | Dùng cho               | Ví dụ                                       |
| --------------------- | ---------------------- | ------------------------------------------- |
| `q_{question_id}`     | Câu trả lời dạng chữ   | `<input name="q_66666666-...">`             |
| `f_{question_id}`     | File (ảnh hoặc ghi âm) | `<input type="file" name="f_66666666-...">` |
| `score_{answer_id}`   | Điểm giáo viên chấm    | ở trang chấm bài                            |
| `comment_{answer_id}` | Lời chữa từng câu      | ở trang chấm bài                            |

**Giới hạn đã biết:** file hiện đi **qua Server Action**, mà Vercel giới hạn body request 4,5 MB →
ảnh chụp điện thoại sẽ lỗi khi deploy thật. Task **P1-03** sẽ đổi sang upload thẳng từ trình duyệt
lên Storage + nén ảnh.

### 6.3 Giáo viên chấm bài

File: `app/teacher/actions.ts` → `gradeSubmission()`

```
1. Giáo viên mở /teacher/submissions/{id}
     Trang hiện: câu trả lời, ĐÁP ÁN, điểm máy chấm, ô nhập điểm, ô chữa bài
        ↓
2. Điền điểm + lời chữa, bấm "Trả bài cho học viên"
        ↓
3. gradeSubmission():
     - Duyệt từng submission_answers:
         teacher_score = ô nhập (để trống = null, giữ điểm máy chấm)
         total += teacher_score ?? auto_score ?? 0
     - Có ghi âm nhận xét → upload lên submissions/{class}/{student}/feedback/
     - update submissions: status='graded', score=total, graded_at=now()
        ↓
4. Học viên mở lại bài → thấy điểm tổng, lời chữa màu đỏ dưới từng câu
```

**Quy tắc tính điểm:** `teacher_score` **ưu tiên hơn** `auto_score`. Giáo viên để trống ô điểm thì
giữ nguyên điểm máy chấm.

---

## 7. Hệ thống giao diện

### 7.1 Token màu — tại sao không viết màu trực tiếp

Vấn đề: muốn có chế độ tối mà code viết `bg-white` thì nền tối sẽ có mảng trắng chói.

Giải pháp: mọi màu là **biến CSS**, đổi giá trị theo chế độ, còn tên class giữ nguyên.

```css
/* app/globals.css */
:root {
  /* nền sáng */
  --surface: 255 255 255;
}
:root[data-theme='dark'] {
  /* nền tối */
  --surface: 24 29 36;
}
```

```ts
// tailwind.config.ts
surface: 'rgb(var(--surface) / <alpha-value>)';
```

```tsx
// component — không cần biết đang ở chế độ nào
<div className="bg-surface">
```

`<alpha-value>` là chỗ Tailwind thay độ mờ vào, nhờ đó `bg-jade/20` vẫn chạy.

### 7.2 Tám token

| Token       | Dùng cho                           | Sáng      | Tối       |
| ----------- | ---------------------------------- | --------- | --------- |
| `paper`     | Nền trang                          | `#F4F6F4` | `#11151A` |
| `surface`   | Nền thẻ, ô nhập, thanh điều hướng  | `#FFFFFF` | `#181D24` |
| `ink`       | Chữ chính                          | `#1B2127` | `#E6EAE7` |
| `muted`     | Chữ phụ                            | `#6A7278` | `#939DA4` |
| `line`      | Viền, kẻ ô                         | `#DEE3DD` | `#28303A` |
| `jade`      | Thao tác chính                     | `#2F6B5B` | `#4EA98D` |
| `seal`      | Lời chữa, lỗi, quá hạn             | `#B8322A` | `#E8736A` |
| `on-accent` | Chữ đặt **trên** nền jade/seal đặc | trắng     | gần đen   |

`on-accent` tồn tại vì ở nền tối, jade và seal được làm **sáng lên** cho đủ tương phản với nền đen —
lúc đó chữ trắng đặt lên chúng không còn đọc được, phải đổi sang gần đen.

> **Cấm tuyệt đối trong component:** `bg-white`, `text-white`, `bg-black`, màu hex, và màu có sẵn của
> Tailwind (`gray-*`, `amber-*`, `red-500`…). Chúng không đổi theo chế độ.

### 7.3 Class dùng chung (trong `app/globals.css`)

| Class                                                     | Dùng cho                                             |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `btn-primary` / `btn-ghost` / `btn-danger`                | Nút chính / nút phụ / nút xoá                        |
| `field`, `label`, `hint`                                  | Ô nhập, nhãn, dòng gợi ý                             |
| `panel`                                                   | Thẻ có viền và bóng nhẹ                              |
| `rows`                                                    | Danh sách có đường kẻ ngăn giữa các dòng             |
| `red-ink`                                                 | ★ Lời chữa của giáo viên — viền trái đỏ, nền đỏ nhạt |
| `tag-draft` / `tag-submitted` / `tag-graded` / `tag-late` | Nhãn trạng thái                                      |
| `safe-bottom`                                             | Chừa vạch home của iPhone cho thanh tab dưới đáy     |

Cần kiểu mới thì **thêm vào `globals.css`**, đừng rắc chuỗi class dài trong từng trang.

### 7.4 Cách chế độ tối hoạt động

Ba trạng thái, không phải hai:

```css
:root                                      /* ① mặc định: nền sáng, khai ĐỦ mọi token */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) { ... }  /* ② máy để tối, người dùng chưa chọn gì */
}
:root[data-theme='dark'] { ... }           /* ③ người dùng tự chọn tối — thắng cả ① và ② */
```

Dấu `:not([data-theme='light'])` ở ② rất quan trọng: nó cho phép người dùng chọn nền **sáng** ngay
cả khi máy đang để tối.

**Chống nháy trắng:** `app/layout.tsx` chèn một script chạy **trước khi trang vẽ lần đầu**:

```js
try {
  var t = localStorage.getItem('theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
} catch (e) {}
```

Nếu để React làm sau khi tải xong, người chọn nền tối sẽ thấy một nháy trắng mỗi lần mở trang.

### 7.5 Khung trang (`components/AppShell.tsx`)

| Khổ màn hình    | Bố cục                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------- |
| ≥ 1024px (`lg`) | Cột trái cố định rộng 15rem: thương hiệu, mục điều hướng, tên người dùng, nút sáng/tối, đăng xuất |
| < 1024px        | Thanh trên đỉnh (thương hiệu + nút sáng/tối + đăng xuất) + **thanh tab dưới đáy** khi có ≥2 mục   |

Thanh tab dưới đáy chỉ hiện khi có từ 2 mục trở lên — khu học viên hiện chỉ có 1 mục ("Lớp học") nên
chưa hiện. Khi P1-02 thêm trang tài khoản và P2-04 thêm trang ôn từ, thanh tab tự xuất hiện.

Thêm mục điều hướng mới: khai trong `layout.tsx` của khu, kèm `icon` khai trong `NavLinks.tsx`.

---

## 8. Test: ba lớp, mỗi lớp bắt loại lỗi khác nhau

| Lớp      | Công cụ    | Số test | Chạy nhanh? | Bắt lỗi gì                                        |
| -------- | ---------- | ------- | ----------- | ------------------------------------------------- |
| Unit     | Vitest     | 29      | ~0,3 giây   | Hàm thuần tính sai (ngày giờ, tách link YouTube…) |
| Database | pgTAP      | 40      | ~1 giây     | **Phân quyền sai — lộ dữ liệu**                   |
| Đầu-cuối | Playwright | 14      | ~70 giây    | Luồng người dùng gãy                              |

### 8.1 Unit test — `lib/*.test.ts`

Test hàm thuần: cho đầu vào, kiểm tra đầu ra. Không cần database, không cần trình duyệt.

```ts
it('hiểu ô datetime-local là giờ Việt Nam (UTC+7)', () => {
  expect(vnLocalToIso('2026-05-10T12:25')).toBe('2026-05-10T05:25:00.000Z');
});
```

> **Quy ước thời gian của dự án:** database lưu **UTC**; giao diện hiển thị và nhận nhập theo
> **`Asia/Ho_Chi_Minh`**. Chuyển đổi luôn đi qua `lib/format.ts`. Việt Nam không đổi giờ mùa hè nên
> quy đổi là +7 cố định.

### 8.2 pgTAP — `supabase/tests/*.sql` ★ quan trọng nhất

Test viết **bằng SQL**, chạy ngay trong database. Giả lập từng người dùng:

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub":"<uuid học viên>","role":"authenticated"}';

select is(
  (select count(*) from public.question_keys)::int, 0,
  'Học viên đọc question_keys được 0 dòng'
);
```

Mỗi file tự dựng dữ liệu **trong transaction rồi `rollback`** — chạy lại bao nhiêu lần cũng ra kết
quả như nhau, không phụ thuộc `seed.sql`.

Ba file:

| File                              | Kiểm tra                                                                                                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rls.test.sql` (20)               | Học viên không lập lớp, không tự nâng quyền, không đọc đáp án, không thấy bài nháp / bài chưa giao, không thấy bài làm và hồ sơ của bạn cùng lớp, không tự cho điểm. Giáo viên thấy lớp mình, **không** thấy lớp giáo viên khác |
| `submit_assignment.test.sql` (13) | Chấm đúng từng dạng câu, pinyin lệch hoa thường/khoảng trắng vẫn đúng, đáp án nhiều lựa chọn, tự luận để `null`, **xoá điểm học viên tự điền**, không nộp lại, không nộp hộ                                                     |
| `storage.test.sql` (7)            | Không upload sang thư mục người khác, không upload vào lớp mình không tham gia, không tự đăng tài liệu bài giảng                                                                                                                |

> **Luật:** thêm bảng mới → **phải** thêm test pgTAP cho policy của nó trong cùng lần làm.

### 8.3 Playwright — `e2e/*.spec.ts`

Điều khiển Chromium thật. `globalSetup` chạy `supabase db reset` trước mỗi lượt, nên luôn bắt đầu từ
cùng một dữ liệu.

| File                         | Kiểm tra                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `auth.spec.ts` (9)           | Chuyển hướng khi chưa đăng nhập, sai vai trò, sai mật khẩu, đăng ký, vào lớp bằng mã `DEMO01`, mã sai    |
| `student-submit.spec.ts` (3) | Làm đủ 6 dạng câu hỏi gồm **upload ảnh** và **ghi âm bằng micro giả**, nộp bài, kiểm tra không lộ đáp án |
| `teacher-grade.spec.ts` (2)  | Chấm tay câu tự luận, trả bài, học viên thấy 7/16 và lời chữa                                            |

Micro giả bật bằng cờ Chromium trong `playwright.config.ts`:

```ts
args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'];
```

**Lưu ý khi viết thêm e2e:** các file dùng **chung một database** và chạy tuần tự (`workers: 1`).
Đừng viết khẳng định kiểu "danh sách rỗng" — file khác có thể để lại dữ liệu.

### 8.4 CI — `.github/workflows/ci.yml`

Mỗi lần push lên `main` hoặc mở PR, GitHub tự chạy 2 job trên máy sạch:

```
Job 1 (~1 phút):   npm ci → npm run check → npm run build
Job 2 (~4 phút):   npm ci → supabase start → supabase test db
                          → playwright install chromium → npm run test:e2e
```

Xem kết quả: https://github.com/hynu15/web_tieng_trung/actions

---

## 9. Nhật ký lỗi đã gặp và cách sửa

Phần này giá trị nhất khi debug — nhiều lỗi sau này sẽ cùng loại với các lỗi dưới đây.

### Lỗi 1 — Học viên đã vào lớp vẫn thấy "Vào lớp đầu tiên của bạn" ⚠️ nghiêm trọng

**Triệu chứng:** đăng nhập `hv1`, dữ liệu trong database có đủ, nhưng trang báo chưa vào lớp nào.

**Nguyên nhân:** câu truy vấn nhập nhằng quan hệ.

```ts
.select('class:classes(id, name, teacher:profiles(full_name))')
```

PostgREST thấy **hai** đường nối `classes` ↔ `profiles`: qua `classes.teacher_id`, và qua bảng nối
`class_members`. Không biết chọn đường nào → trả lỗi `PGRST201`.

**Chỗ hiểm:** code viết `const { data } = await ...` — **không đọc `error`**. Query lỗi thì `data`
là `undefined`, và `if (!memberships?.length)` hiểu nhầm thành "chưa vào lớp nào". **Lỗi bị nuốt mất.**

**Cách sửa:** chỉ rõ khoá ngoại.

```ts
.select('class:classes(id, name, teacher:profiles!classes_teacher_id_fkey(full_name))')
```

**Bài học:** khi hai bảng có nhiều hơn một quan hệ, **luôn** chỉ rõ tên khoá ngoại. Và khi thấy
trang hiện "trạng thái rỗng" một cách vô lý → nghi ngay là query lỗi bị nuốt.

---

### Lỗi 2 — `any` che sáu lỗi thật

Khi thêm kiểu database và xoá `any`, TypeScript lập tức lộ ra 6 lỗi đang nằm sẵn trong code:

| #   | Lỗi                                                                        | Hậu quả nếu không sửa                              |
| --- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | `signedUrls()` khai nhận `string[]` nhưng cả 3 chỗ gọi truyền cột nullable | Lỗi lúc chạy khi có file trống                     |
| 2   | `questions.options` là `Json` chứ không phải `string[]`                    | `.map()` trên chuỗi → crash                        |
| 3   | `new Date(submitted_at)` với cột nullable ở 2 trang                        | Hiện "Invalid Date"                                |
| 4   | `byStudent.get(...)` có thể `undefined` nhưng bị đọc thẳng `.score`        | Crash trang danh sách                              |
| 5   | `src` của `<iframe>`/`<a>` nhận `null` (JSX cần `undefined`)               | Link hỏng                                          |
| 6   | `QUESTION_LABELS` khai `Record<string, string>`                            | Thêm dạng câu hỏi mới mà quên nhãn → không ai biết |

**Bài học:** `any` không làm code chạy đúng hơn, nó chỉ làm lỗi im lặng hơn. Đây là lý do
`CLAUDE.md` cấm `any` và ESLint đặt `no-explicit-any` ở mức `error`.

---

### Lỗi 3 — `npm run build` làm hỏng `npm run dev` đang chạy

**Triệu chứng:** `Cannot find module './vendor-chunks/next.js'`, trang trắng.

**Nguyên nhân:** `npm run dev` và `npm run build` dùng chung thư mục `.next`. Build ghi đè lên
thứ dev server đang đọc.

**Cách sửa:** tắt dev server → `rm -rf .next` → bật lại.

**Bài học:** đừng chạy `build` trong lúc `dev` đang mở.

---

### Lỗi 4 — Nội dung lệch sang phải sau khi thêm cột trái

**Nguyên nhân:** viết `mx-auto max-w-5xl lg:pl-64` trên cùng một thẻ. `mx-auto` căn giữa khối
1024px trong toàn bộ bề ngang, **rồi** `pl-64` đẩy nội dung vào trong khối đó → lệch phải và bị chật.

**Cách sửa:** tách hai lớp — lớp ngoài chừa chỗ cho cột trái, lớp trong căn giữa phần còn lại.

```tsx
<div className="lg:pl-60">
  <main className="mx-auto max-w-5xl px-4">{children}</main>
</div>
```

---

### Lỗi 5 — Chế độ tối "không chạy" (thật ra là chạy)

**Triệu chứng:** bấm nút đổi tối, ảnh chụp màn hình vẫn sáng.

**Thực tế:** chế độ tối chạy đúng. Công cụ chụp ảnh trả về khung hình cũ.

**Cách kiểm chứng đúng:** hỏi trình duyệt giá trị thật thay vì nhìn ảnh:

```js
getComputedStyle(document.body).backgroundColor; // → "rgb(17, 21, 26)" = đang tối
```

**Bài học:** khi nghi ngờ CSS, đo `getComputedStyle` chứ đừng tin mắt nhìn ảnh.

---

### Lỗi 6 — Test báo "strict mode violation: resolved to 2 elements"

**Nguyên nhân:** sau khi có cả cột trái lẫn thanh trên đỉnh, tên người dùng có **hai** bản trong DOM.
`getByRole` tự lọc bản đang ẩn (`display:none`), nhưng **`getByText` thì không**.

**Cách sửa:** chỉ rõ đang xét vùng nào.

```ts
await expect(page.getByRole('complementary').getByText('Nguyễn Minh An')).toBeVisible();
```

---

### Lỗi 7 — Test pgTAP: "permission denied for table submissions"

**Nguyên nhân:** test cố `insert into submissions (id, assignment_id, student_id)` dưới vai học viên.
Nhưng grant chỉ cho 2 cột: `grant insert (assignment_id, student_id)`. Cột `id` không nằm trong đó.

**Đây không phải bug** — là cơ chế bảo vệ chạy đúng. Sửa bằng cách dựng dữ liệu dưới quyền admin.

---

### Lỗi 8 — `supabase db reset` lỗi `HealthCheckTimeoutError`

**Nguyên nhân:** chạy ngay sau `supabase start`, container storage chưa kịp sẵn sàng.

**Cách sửa:** chờ 15 giây rồi thử lại. `e2e/global-setup.ts` đã tự động thử lại một lần.

---

### Lỗi 9 — Chữ chồng chéo trên điện thoại

**Triệu chứng:** ở 375px, tên app / nút điều hướng / "Đăng xuất" đều xuống dòng, thanh trên đỉnh cao 3 dòng.

**Cách sửa:** ẩn **chữ** thương hiệu ở khổ hẹp, giữ lại ô 汉 (`hidden sm:inline`), thêm `whitespace-nowrap`.

**Bài học:** phải kiểm tra thật ở 375px. Học viên chủ yếu dùng điện thoại.

---

## 10. Checklist khi gặp bug

Đi từ trên xuống, dừng ở chỗ đầu tiên thấy sai.

### Bước 0 — Xác định tầng

| Triệu chứng                                                   | Nghi ngờ tầng nào                                         |
| ------------------------------------------------------------- | --------------------------------------------------------- |
| Trang trắng, lỗi đỏ toàn màn hình                             | Code React / Server Component                             |
| Dữ liệu thiếu, trang hiện "chưa có gì" mà database có dữ liệu | **RLS hoặc query lỗi bị nuốt**                            |
| Bấm nút không có gì xảy ra                                    | Server Action hoặc form thiếu `name`                      |
| "permission denied"                                           | RLS hoặc column grant                                     |
| Màu sai, chữ chìm vào nền                                     | Token màu (dùng màu hardcode ở đâu đó)                    |
| Chạy trên máy được, CI hỏng                                   | Phụ thuộc vào dữ liệu còn sót, hoặc thiếu biến môi trường |

### Bước 1 — Thu thập thông tin

```bash
# Log server (nơi Server Component và Server Action ném lỗi)
# → nhìn terminal đang chạy `npm run dev`

# Dữ liệu thật trong database
# → mở http://127.0.0.1:54323 (Supabase Studio)

# Log trình duyệt
# → F12 → tab Console và tab Network
```

### Bước 2 — Khoanh vùng bằng test

```bash
npm run typecheck    # sai kiểu, sai tên cột
npm run lint         # biến thừa, any
npm run test         # hàm thuần tính sai
npm run test:db      # ★ phân quyền sai
npm run test:e2e     # luồng gãy
```

Test nào đỏ thì bug nằm ở tầng đó.

### Bước 3 — Nghi ngờ "query lỗi bị nuốt" (đã cắn một lần, xem Lỗi 1)

Tìm những chỗ viết `const { data } = await supabase...` mà **không đọc `error`**. Tạm thời sửa thành:

```ts
const { data, error } = await supabase.from('...').select('...');
console.log('LỖI QUERY:', error);
```

### Bước 4 — Nghi ngờ RLS

Kiểm tra bằng API, giả lập đúng người dùng đó:

```bash
ANON=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d= -f2)
TOKEN=$(curl -s -X POST "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"hv1@test.local","password":"Test12345!"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

curl -s "http://127.0.0.1:54321/rest/v1/lessons?select=title,published" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN"
```

Trả về `[]` mà đáng lẽ phải có dữ liệu → RLS quá chặt.
Trả về dữ liệu không nên thấy → **RLS quá lỏng, đây là lỗ bảo mật, ưu tiên cao nhất.**

### Bước 5 — Nghi ngờ dữ liệu bẩn

```bash
npm run db:reset     # dựng lại sạch từ migrations + seed
```

Hết lỗi → do dữ liệu, không phải do code.

### Bước 6 — Sau khi sửa

```bash
npm run check && npm run test:db && npm run test:e2e && npm run build
```

Sửa giao diện thì xem lại **cả hai chế độ sáng/tối** và **cả khổ 375px**.

---

## 11. Lệnh hay dùng

```bash
# ── Chạy hằng ngày ───────────────────────────────────────────
npx supabase start          # bật database (cần Docker)
npm run dev                 # bật web → http://localhost:3000
npx supabase stop           # tắt database

# ── Database ─────────────────────────────────────────────────
npm run db:reset            # dựng lại sạch từ migrations + seed.sql
npm run db:types            # sinh lại lib/database.types.ts (SAU MỌI MIGRATION)
npm run test:db             # test phân quyền RLS

# ── Kiểm tra trước khi commit ────────────────────────────────
npm run check               # typecheck + lint + unit test
npm run test:e2e            # test luồng người dùng
npm run build               # build production — phải pass trước khi commit
npm run format              # tự định dạng code

# ── Git ──────────────────────────────────────────────────────
git status
git add -A && git commit -m "P1-01: mô tả ngắn"
git push
```

**Cổng local:**

| Dịch vụ                      | Địa chỉ                                                   |
| ---------------------------- | --------------------------------------------------------- |
| Web                          | http://localhost:3000                                     |
| Supabase API                 | http://127.0.0.1:54321                                    |
| **Studio (xem/sửa dữ liệu)** | **http://127.0.0.1:54323**                                |
| Postgres                     | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Mailpit (xem email gửi ra)   | http://127.0.0.1:54324                                    |

**Tài khoản mẫu** — mật khẩu chung `Test12345!`: `giaovien@test.local`, `hv1@`, `hv2@`, `hv3@test.local`.
Mã vào lớp: `DEMO01`.

---

## 12. Cạm bẫy: những thứ rất dễ làm sai

| ❌ Đừng                                           | ✅ Làm thế này                                            | Vì sao                                                  |
| ------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| Sửa file migration đã có                          | Tạo migration mới                                         | Máy khác đã chạy bản cũ → hai database lệch nhau        |
| Sửa tay `lib/database.types.ts`                   | `npm run db:types`                                        | File sinh tự động, sửa tay sẽ bị ghi đè                 |
| Sửa `supabase/schema.sql`                         | Sửa migration                                             | File đó chỉ để đọc tham khảo                            |
| Dùng `bg-white`, `text-gray-500`                  | `bg-surface`, `text-muted`                                | Không đổi theo chế độ tối                               |
| `const { data } = await supabase...`              | Đọc cả `error`                                            | Query lỗi bị nuốt, trang hiện rỗng (Lỗi 1)              |
| `select` bảng `question_keys` ở khu student       | Không bao giờ                                             | Lộ đáp án                                               |
| Server Action thiếu `requireRole()`               | Luôn có ở dòng đầu                                        | Endpoint công khai, ai cũng gọi được                    |
| Tin `id` client gửi lên                           | Để RLS lọc + kiểm tra quyền sở hữu                        | Client sửa được mọi thứ gửi đi                          |
| Dùng `SUPABASE_SERVICE_ROLE_KEY` ở client         | Chỉ dùng trong route cron phía server                     | Khoá này **bỏ qua toàn bộ RLS**                         |
| Đặt khoá bí mật vào biến `NEXT_PUBLIC_*`          | Biến không có tiền tố đó                                  | `NEXT_PUBLIC_*` gửi xuống trình duyệt                   |
| Tạo bảng mới không bật RLS                        | `enable row level security` + policy trong cùng migration | Bảng không RLS = lộ sạch                                |
| Chạy `build` khi `dev` đang mở                    | Tắt dev trước                                             | Hỏng `.next` (Lỗi 3)                                    |
| Thêm thư viện cho việc vài chục dòng tự viết được | Tự viết                                                   | Quy tắc dự án; thư viện mới phải ghi lý do trong commit |
| Commit gộp nhiều task                             | Một task một commit                                       | Dễ lần ngược khi hỏng                                   |

---

## 13. Từ điển thuật ngữ

| Thuật ngữ              | Nghĩa                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **App Router**         | Cách định tuyến của Next.js: thư mục = URL                                         |
| **Server Component**   | Component chạy trên server, gọi DB trực tiếp, không tương tác                      |
| **Client Component**   | Component chạy trong trình duyệt, có `'use client'`, có `useState`/`onClick`       |
| **Server Action**      | Hàm `'use server'` gắn vào form, chạy trên server khi người dùng submit            |
| **Hydration**          | Bước React "gắn" JavaScript vào HTML server gửi xuống, cho nó tương tác được       |
| **RLS**                | Row Level Security — luật lọc dòng trong Postgres, lớp bảo mật thật                |
| **Policy**             | Một luật RLS cụ thể cho một bảng                                                   |
| **`security definer`** | Hàm SQL chạy bằng quyền người tạo, bỏ qua RLS                                      |
| **Migration**          | File SQL mô tả một thay đổi schema                                                 |
| **Seed**               | Dữ liệu mẫu nạp sau migration để có cái mà thử                                     |
| **RPC**                | Remote Procedure Call — gọi hàm SQL từ code: `supabase.rpc('join_class', {...})`   |
| **Upsert**             | Có rồi thì sửa, chưa có thì thêm                                                   |
| **Bucket**             | Thùng chứa file trong Supabase Storage                                             |
| **Signed URL**         | Link tạm có hạn để xem file trong bucket riêng tư                                  |
| **JSX**                | Cú pháp viết HTML lẫn trong JavaScript                                             |
| **Token (màu)**        | Tên gọi một màu (`jade`), giá trị đổi theo chế độ sáng/tối                         |
| **pgTAP**              | Thư viện viết test bằng SQL chạy trong Postgres                                    |
| **E2E**                | End-to-end — test cả luồng như người dùng thật                                     |
| **CI**                 | Continuous Integration — máy chủ tự chạy test mỗi lần push                         |
| **PostgREST**          | Dịch vụ tự sinh API REST từ bảng Postgres (Supabase dùng nó)                       |
| **`anon key`**         | Khoá công khai, gửi xuống trình duyệt được. Không có quyền gì đặc biệt, RLS vẫn áp |
| **`service_role key`** | Khoá admin, **bỏ qua RLS**. Chỉ dùng phía server, không bao giờ lộ ra client       |

---

## 14. Còn nợ gì

Giai đoạn P0 (nền móng) xong 6/6. Danh sách đầy đủ 30 task ở `docs/PLAN.md`.

**Những giới hạn đã biết của bản hiện tại:**

| Vấn đề                                 | Hậu quả                                                     | Task sẽ sửa |
| -------------------------------------- | ----------------------------------------------------------- | ----------- |
| File upload đi qua Server Action       | Vercel giới hạn body 4,5 MB → ảnh điện thoại lỗi khi deploy | **P1-03**   |
| Lỗi Server Action hiện trang lỗi chung | Nhập sai mã lớp → mất hết dữ liệu đã gõ                     | **P1-01**   |
| Chưa có xác nhận email / quên mật khẩu | Học viên quên mật khẩu phải nhờ giáo viên                   | **P1-02**   |
| Chưa sửa được câu hỏi đã tạo           | Gõ sai phải xoá làm lại                                     | **P1-05**   |
| Xoá bài giảng không dọn file Storage   | Rác tích tụ, Supabase free chỉ có 1 GB                      | **P1-04**   |
| Pinyin chưa chuẩn hoá                  | `nǐ hǎo` và `ni3 hao3` phải liệt kê cả hai trong đáp án     | **P2-01**   |
| Còn 4–6 vùng bấm cao dưới 40px         | Khó bấm trên điện thoại                                     | **P1-10**   |
| Chưa deploy                            | Chưa ai ngoài máy bạn vào được                              | **P3-04**   |

**Task tiếp theo theo thứ tự phụ thuộc: P1-01** — báo lỗi trên form bằng `useActionState` + zod.

---

## Phụ lục — Cách đọc `docs/PLAN.md`

`docs/PLAN.md` là file điều phối công việc, khác `report.md` (mô tả hệ thống):

- **Bảng tiến độ** — task nào xong (`[x]`), task nào phụ thuộc task nào.
- **Mô tả từng task** — mục tiêu, file sẽ sửa, các bước, tiêu chí "Hoàn thành khi".
- **Nhật ký** ở cuối — mỗi task xong ghi một mục: đã làm gì, gặp vấn đề gì, **ghi chú cho task sau**.

Phần "Nhật ký" rất đáng đọc khi debug: nó ghi lại quyết định kỹ thuật và lý do, thứ không nhìn ra
được từ code.

**Lệnh tắt cho Claude Code** (trong `.claude/commands/`): `/next` đề xuất task tiếp theo,
`/task P1-01` làm một task cụ thể, `/verify` chạy hết kiểm tra trước khi push.
