-- =====================================================================
-- Dữ liệu mẫu cho phát triển local. Chạy tự động sau migration khi gọi
-- `npx supabase db reset`. Không bao giờ chạy file này trên bản thật.
--
-- Tài khoản (mật khẩu chung: Test12345!)
--   giaovien@test.local  — giáo viên
--   hv1@test.local       — học viên, đã trong lớp DEMO01
--   hv2@test.local       — học viên, đã trong lớp DEMO01
--   hv3@test.local       — học viên, đã trong lớp DEMO01
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tài khoản trong auth.users
--    Trigger on_auth_user_created tự tạo dòng public.profiles tương ứng,
--    lấy full_name từ raw_user_meta_data.
-- ---------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  crypt('Test12345!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', u.full_name),
  now(), now(), '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'giaovien@test.local', 'Cô Lan'),
  ('22222222-2222-2222-2222-222222222221'::uuid, 'hv1@test.local',      'Nguyễn Minh An'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'hv2@test.local',      'Trần Thu Hà'),
  ('22222222-2222-2222-2222-222222222223'::uuid, 'hv3@test.local',      'Lê Quốc Bảo')
) as u(id, email, full_name);

-- Supabase Auth cần một dòng identity 'email' cho mỗi tài khoản,
-- nếu không thì đăng nhập bằng mật khẩu sẽ báo sai thông tin.
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  u.id::text,
  now(), now(), now()
from auth.users u;

-- ---------------------------------------------------------------------
-- 2. Nâng quyền giáo viên
-- ---------------------------------------------------------------------
update public.profiles
   set role = 'teacher'
 where id = '11111111-1111-1111-1111-111111111111';

-- ---------------------------------------------------------------------
-- 3. Lớp và học viên trong lớp
-- ---------------------------------------------------------------------
insert into public.classes (id, teacher_id, name, hsk_level, join_code) values
  ('33333333-3333-3333-3333-333333333333',
   '11111111-1111-1111-1111-111111111111',
   'HSK 1 — Lớp tối thứ 3, 5', 1, 'DEMO01');

insert into public.class_members (class_id, student_id) values
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222221'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222223');

-- ---------------------------------------------------------------------
-- 4. Bài giảng: một bài đã đăng, một bài còn nháp
-- ---------------------------------------------------------------------
insert into public.lessons (id, class_id, title, summary, position, published) values
  ('44444444-4444-4444-4444-444444444441',
   '33333333-3333-3333-3333-333333333333',
   'Bài 1 — Chào hỏi và giới thiệu',
   'Học cách chào, cảm ơn, tạm biệt và nói mình là học sinh hay giáo viên.',
   1, true),
  ('44444444-4444-4444-4444-444444444442',
   '33333333-3333-3333-3333-333333333333',
   'Bài 2 — Gia đình',
   'Bài này còn nháp: học viên chưa thấy được.',
   2, false);

insert into public.lesson_materials (lesson_id, type, title, url, position) values
  ('44444444-4444-4444-4444-444444444441', 'video',
   'Video phát âm 4 thanh điệu',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1),
  ('44444444-4444-4444-4444-444444444441', 'link',
   'Bảng chữ cái pinyin tra nhanh',
   'https://www.purpleculture.net/chinese-pinyin-chart/', 2);

-- ---------------------------------------------------------------------
-- 5. Từ vựng của bài 1
-- ---------------------------------------------------------------------
insert into public.vocab (lesson_id, hanzi, pinyin, meaning_vi, example, position) values
  ('44444444-4444-4444-4444-444444444441', '你好', 'nǐ hǎo',    'xin chào',          '你好！我是老师。', 1),
  ('44444444-4444-4444-4444-444444444441', '谢谢', 'xiè xie',   'cảm ơn',            '谢谢老师！',       2),
  ('44444444-4444-4444-4444-444444444441', '老师', 'lǎo shī',   'giáo viên, thầy cô','她是我的老师。',   3),
  ('44444444-4444-4444-4444-444444444441', '学生', 'xué sheng', 'học sinh, học viên','我是学生。',       4),
  ('44444444-4444-4444-4444-444444444441', '再见', 'zài jiàn',  'tạm biệt',          '老师，再见！',     5);

-- ---------------------------------------------------------------------
-- 6. Bài tập đã giao, đủ 6 dạng câu hỏi
-- ---------------------------------------------------------------------
insert into public.assignments
  (id, class_id, lesson_id, title, instructions, due_at, published) values
  ('55555555-5555-5555-5555-555555555555',
   '33333333-3333-3333-3333-333333333333',
   '44444444-4444-4444-4444-444444444441',
   'Bài tập 1 — Chào hỏi',
   'Làm hết 6 câu. Câu viết tay thì chụp ảnh, câu đọc thì ghi âm trực tiếp trên trang.',
   now() + interval '7 days',
   true);

insert into public.questions (id, assignment_id, type, prompt, options, points, position) values
  ('66666666-6666-6666-6666-666666666661',
   '55555555-5555-5555-5555-555555555555', 'multiple_choice',
   '「你好」có nghĩa là gì?',
   '["Xin chào", "Cảm ơn", "Tạm biệt", "Xin lỗi"]'::jsonb, 2, 1),

  ('66666666-6666-6666-6666-666666666662',
   '55555555-5555-5555-5555-555555555555', 'fill_blank',
   'Điền chữ Hán còn thiếu: 老__ (giáo viên)',
   null, 2, 2),

  ('66666666-6666-6666-6666-666666666663',
   '55555555-5555-5555-5555-555555555555', 'pinyin',
   'Viết pinyin của 再见',
   null, 2, 3),

  ('66666666-6666-6666-6666-666666666664',
   '55555555-5555-5555-5555-555555555555', 'essay',
   'Viết 2–3 câu tự giới thiệu bằng tiếng Trung (tên, nghề, lời chào).',
   null, 4, 4),

  ('66666666-6666-6666-6666-666666666665',
   '55555555-5555-5555-5555-555555555555', 'writing',
   'Viết chữ 学 năm lần vào ô 田字格 trên giấy, rồi chụp ảnh nộp.',
   null, 3, 5),

  ('66666666-6666-6666-6666-666666666666',
   '55555555-5555-5555-5555-555555555555', 'speaking',
   'Ghi âm đọc to câu: 你好，我是学生。',
   null, 3, 6);

-- Đáp án chỉ cho ba dạng máy chấm được. Nhiều đáp án chấp nhận: ngăn bằng '|'.
insert into public.question_keys (question_id, answer) values
  ('66666666-6666-6666-6666-666666666661', 'Xin chào'),
  ('66666666-6666-6666-6666-666666666662', '师'),
  ('66666666-6666-6666-6666-666666666663', 'zài jiàn|zàijiàn|zai4 jian4|zai4jian4');

-- ---------------------------------------------------------------------
-- 7. Một thông báo lớp
-- ---------------------------------------------------------------------
insert into public.announcements (class_id, author_id, body) values
  ('33333333-3333-3333-3333-333333333333',
   '11111111-1111-1111-1111-111111111111',
   'Tuần này nhớ làm Bài tập 1 trước buổi học thứ 5. Câu ghi âm nên thu ở nơi yên tĩnh.');
