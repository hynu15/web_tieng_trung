-- Ảnh bài viết tay và file ghi âm nằm trong bucket riêng tư. Đường dẫn quy ước:
--   submissions/{class_id}/{student_id}/{assignment_id}/{file}
--   materials/{class_id}/{lesson_id}/{file}
-- Phân quyền dựa vào thư mục trong tên file, nên test kỹ chuyện học viên đổi
-- đường dẫn sang thư mục người khác.

begin;
select plan(7);

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
  ('a2000000-0000-4000-8000-000000000001'::uuid, 'st-gv@test.invalid',  'Giáo viên'),
  ('b2000000-0000-4000-8000-00000000000a'::uuid, 'st-hva@test.invalid', 'Học viên A'),
  ('b2000000-0000-4000-8000-00000000000b'::uuid, 'st-hvb@test.invalid', 'Học viên B')
) as u(id, email, ten);

update public.profiles set role = 'teacher' where id = 'a2000000-0000-4000-8000-000000000001';

insert into public.classes (id, teacher_id, name, join_code) values
  ('c2000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'Lớp', 'STO001');

insert into public.class_members (class_id, student_id) values
  ('c2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-00000000000a'),
  ('c2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-00000000000b');

-- File của học viên B, dùng để kiểm tra học viên A không đọc được.
insert into storage.objects (bucket_id, name, owner) values
  ('submissions',
   'c2000000-0000-4000-8000-000000000001/b2000000-0000-4000-8000-00000000000b/bai1/anh.jpg',
   'b2000000-0000-4000-8000-00000000000b');

set local role authenticated;
set local request.jwt.claims = '{"sub":"b2000000-0000-4000-8000-00000000000a","role":"authenticated"}';

-- =====================================================================
-- Ghi
-- =====================================================================
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner) values
      ('submissions',
       'c2000000-0000-4000-8000-000000000001/b2000000-0000-4000-8000-00000000000a/bai1/anh.jpg',
       'b2000000-0000-4000-8000-00000000000a')$$,
  'Học viên upload được vào thư mục của chính mình'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner) values
      ('submissions',
       'c2000000-0000-4000-8000-000000000001/b2000000-0000-4000-8000-00000000000b/bai1/gia-mao.jpg',
       'b2000000-0000-4000-8000-00000000000a')$$,
  '42501',
  null,
  'Học viên không upload được vào thư mục của học viên khác'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner) values
      ('submissions',
       'c9999999-0000-4000-8000-000000000009/b2000000-0000-4000-8000-00000000000a/bai1/anh.jpg',
       'b2000000-0000-4000-8000-00000000000a')$$,
  '42501',
  null,
  'Học viên không upload được vào lớp mình không tham gia'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner) values
      ('materials',
       'c2000000-0000-4000-8000-000000000001/d2000000-0000-4000-8000-000000000001/slide.pdf',
       'b2000000-0000-4000-8000-00000000000a')$$,
  '42501',
  null,
  'Học viên không tự đăng tài liệu bài giảng được'
);

-- =====================================================================
-- Đọc
-- =====================================================================
select is(
  (select count(*) from storage.objects
    where name like 'c2000000-0000-4000-8000-000000000001/b2000000-0000-4000-8000-00000000000b/%')::int,
  0,
  'Học viên A không đọc được file của học viên B cùng lớp'
);

select is(
  (select count(*) from storage.objects
    where name like 'c2000000-0000-4000-8000-000000000001/b2000000-0000-4000-8000-00000000000a/%')::int,
  1,
  'Học viên A đọc được file của chính mình'
);

set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (select count(*) from storage.objects where bucket_id = 'submissions')::int,
  2,
  'Giáo viên đọc được file bài nộp của cả lớp mình'
);

select * from finish();
rollback;
