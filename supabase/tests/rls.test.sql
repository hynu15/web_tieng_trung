-- Kiểm tra phân quyền bằng RLS: đây là lớp bảo mật thật của ứng dụng, không
-- phải mấy câu if trong React. Mỗi khẳng định giả lập một người dùng thật
-- bằng `set local role authenticated` + `request.jwt.claims`.
--
-- Dữ liệu dựng trong chính transaction rồi rollback, nên không phụ thuộc vào
-- supabase/seed.sql và chạy lại bao nhiêu lần cũng ra kết quả như nhau.

begin;
select plan(20);

-- =====================================================================
-- Dữ liệu dựng sẵn
--   gv1 dạy lop1 (hvA, hvB).  gv2 dạy lop2, không liên quan gì tới lop1.
--   hvC đã có tài khoản nhưng chưa vào lớp nào.
-- =====================================================================
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
       u.email, 'khong-dung-de-dang-nhap', now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('full_name', u.ten), now(), now(), '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'rls-gv1@test.invalid', 'Giáo viên Một'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'rls-gv2@test.invalid', 'Giáo viên Hai'),
  ('b0000000-0000-4000-8000-00000000000a'::uuid, 'rls-hva@test.invalid', 'Học viên A'),
  ('b0000000-0000-4000-8000-00000000000b'::uuid, 'rls-hvb@test.invalid', 'Học viên B'),
  ('b0000000-0000-4000-8000-00000000000c'::uuid, 'rls-hvc@test.invalid', 'Học viên C')
) as u(id, email, ten);

update public.profiles set role = 'teacher'
 where id in ('a0000000-0000-4000-8000-000000000001',
              'a0000000-0000-4000-8000-000000000002');

insert into public.classes (id, teacher_id, name, join_code) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Lớp 1', 'RLS001'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'Lớp 2', 'RLS002');

insert into public.class_members (class_id, student_id) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-00000000000a'),
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-00000000000b');

insert into public.lessons (id, class_id, title, published) values
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Bài đã đăng', true),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'Bài còn nháp', false);

insert into public.assignments (id, class_id, title, published) values
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Bài tập đã giao', true),
  ('e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'Bài tập chưa giao', false);

insert into public.questions (id, assignment_id, type, prompt, points, position) values
  ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'fill_blank', 'Điền từ', 2, 1);

insert into public.question_keys (question_id, answer) values
  ('f0000000-0000-4000-8000-000000000001', 'đáp án bí mật');

-- Bài của học viên B, dùng để kiểm tra học viên A không dòm được.
insert into public.submissions (id, assignment_id, student_id, status, submitted_at, score) values
  ('10000000-0000-4000-8000-00000000000b', 'e0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-00000000000b', 'submitted', now(), 7);

-- Postgres không cho đặt CTE sửa dữ liệu trong subquery, nên dùng helper này
-- để đếm số dòng một câu UPDATE thực sự đổi được. Hàm không phải security
-- definer nên vẫn chạy dưới quyền của người dùng đang giả lập.
create function pg_temp.dem_dong_doi_duoc(cau_lenh text) returns integer
language plpgsql as $fn$
declare n integer;
begin
  execute cau_lenh;
  get diagnostics n = row_count;
  return n;
end
$fn$;

-- =====================================================================
-- 1. Học viên không được tự nâng quyền hay tự lập lớp
-- =====================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-00000000000a","role":"authenticated"}';

select throws_ok(
  $$insert into public.classes (teacher_id, name, join_code)
    values ('b0000000-0000-4000-8000-00000000000a', 'Lớp tự lập', 'HACK01')$$,
  '42501',
  null,
  'Học viên không tạo được lớp'
);

select throws_ok(
  $$update public.profiles set role = 'teacher'
     where id = 'b0000000-0000-4000-8000-00000000000a'$$,
  '42501',
  null,
  'Học viên không tự đổi được role của mình'
);

select lives_ok(
  $$update public.profiles set full_name = 'Tên mới'
     where id = 'b0000000-0000-4000-8000-00000000000a'$$,
  'Học viên vẫn đổi được họ tên của chính mình'
);

-- =====================================================================
-- 2. Đáp án không bao giờ lộ cho học viên
-- =====================================================================
select is(
  (select count(*) from public.question_keys)::int, 0,
  'Học viên đọc question_keys được 0 dòng'
);

select is(
  (select count(*) from public.questions)::int, 1,
  'Học viên vẫn đọc được đề bài của bài đã giao'
);

-- =====================================================================
-- 3. Bài nháp và bài chưa giao bị ẩn
-- =====================================================================
select is(
  (select count(*) from public.lessons)::int, 1,
  'Học viên trong lớp chỉ thấy bài giảng đã đăng, không thấy bài nháp'
);

select is(
  (select count(*) from public.assignments)::int, 1,
  'Học viên trong lớp chỉ thấy bài tập đã giao, không thấy bài chưa giao'
);

-- =====================================================================
-- 4. Học viên A không dòm được bài và hồ sơ của học viên B
-- =====================================================================
select is(
  (select count(*) from public.submissions
    where student_id = 'b0000000-0000-4000-8000-00000000000b')::int, 0,
  'Học viên A không thấy bài làm của học viên B cùng lớp'
);

select is(
  (select count(*) from public.profiles
    where id = 'b0000000-0000-4000-8000-00000000000b')::int, 0,
  'Học viên A không thấy hồ sơ của học viên B cùng lớp'
);

select is(
  (select count(*) from public.profiles
    where id = 'a0000000-0000-4000-8000-000000000001')::int, 1,
  'Học viên vẫn thấy hồ sơ giáo viên của lớp mình'
);

-- =====================================================================
-- 5. Học viên không tự cho điểm được
-- =====================================================================
select throws_ok(
  $$insert into public.submissions (assignment_id, student_id, score)
    values ('e0000000-0000-4000-8000-000000000001',
            'b0000000-0000-4000-8000-00000000000a', 10)$$,
  '42501',
  null,
  'Học viên không insert được cột score'
);

select lives_ok(
  $$insert into public.submissions (assignment_id, student_id)
    values ('e0000000-0000-4000-8000-000000000001',
            'b0000000-0000-4000-8000-00000000000a')$$,
  'Học viên vẫn tạo được bài làm của chính mình'
);

-- Policy submissions_update chỉ cho giáo viên: học viên không tự đổi trạng thái
-- hay điểm của bài mình, kể cả khi bài còn nháp. Đổi trạng thái đi qua
-- hàm submit_assignment (security definer).
select is(
  pg_temp.dem_dong_doi_duoc(
    $$update public.submissions set status = 'graded'
       where student_id = 'b0000000-0000-4000-8000-00000000000a'$$
  ),
  0,
  'Học viên không update được trạng thái bài làm của mình'
);

-- =====================================================================
-- 6. Học viên chưa vào lớp thì không thấy gì
-- =====================================================================
set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-00000000000c","role":"authenticated"}';

select is(
  (select count(*) from public.assignments)::int, 0,
  'Học viên chưa vào lớp không thấy bài tập nào'
);

select is(
  (select count(*) from public.lessons)::int, 0,
  'Học viên chưa vào lớp không thấy bài giảng nào'
);

-- =====================================================================
-- 7. Giáo viên thấy và chấm được lớp mình, không thấy lớp người khác
-- =====================================================================
set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (select count(*) from public.lessons)::int, 2,
  'Giáo viên thấy cả bài giảng nháp của lớp mình'
);

select is(
  (select count(*) from public.question_keys)::int, 1,
  'Giáo viên đọc được đáp án của lớp mình'
);

select is(
  pg_temp.dem_dong_doi_duoc(
    $$update public.submissions set status = 'graded', score = 8, graded_at = now()
       where id = '10000000-0000-4000-8000-00000000000b'$$
  ),
  1,
  'Giáo viên chấm được bài của lớp mình'
);

set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}';

select is(
  (select count(*) from public.classes
    where id = 'c0000000-0000-4000-8000-000000000001')::int, 0,
  'Giáo viên khác không thấy lớp của giáo viên một'
);

select is(
  (select count(*) from public.submissions)::int, 0,
  'Giáo viên khác không thấy bài làm của lớp không phải của mình'
);

select * from finish();
rollback;
