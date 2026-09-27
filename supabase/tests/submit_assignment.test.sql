-- Hàm submit_assignment là chỗ duy nhất học viên được đổi trạng thái bài làm.
-- Nó khoá bài, xoá mọi điểm học viên tự điền, rồi chấm các câu có đáp án.
-- Sai ở đây nghĩa là điểm sai cho cả lớp, nên test kỹ từng nhánh.

begin;
select plan(13);

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
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'sub-gv@test.invalid',  'Giáo viên'),
  ('b1000000-0000-4000-8000-00000000000a'::uuid, 'sub-hva@test.invalid', 'Học viên A'),
  ('b1000000-0000-4000-8000-00000000000b'::uuid, 'sub-hvb@test.invalid', 'Học viên B')
) as u(id, email, ten);

update public.profiles set role = 'teacher' where id = 'a1000000-0000-4000-8000-000000000001';

insert into public.classes (id, teacher_id, name, join_code) values
  ('c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Lớp', 'SUB001');

insert into public.class_members (class_id, student_id) values
  ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-00000000000a'),
  ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-00000000000b');

insert into public.assignments (id, class_id, title, published) values
  ('e1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Bài tập', true);

insert into public.questions (id, assignment_id, type, prompt, points, position) values
  ('f1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'multiple_choice', 'Trắc nghiệm đúng', 2, 1),
  ('f1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001', 'multiple_choice', 'Trắc nghiệm sai',  2, 2),
  ('f1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000001', 'pinyin',          'Pinyin lệch kiểu gõ', 2, 3),
  ('f1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000001', 'pinyin',          'Pinyin nhiều đáp án', 2, 4),
  ('f1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000001', 'fill_blank',      'Điền chữ Hán', 2, 5),
  ('f1000000-0000-4000-8000-000000000006', 'e1000000-0000-4000-8000-000000000001', 'essay',           'Tự luận', 4, 6);

insert into public.question_keys (question_id, answer) values
  ('f1000000-0000-4000-8000-000000000001', 'Xin chào'),
  ('f1000000-0000-4000-8000-000000000002', 'Xin chào'),
  ('f1000000-0000-4000-8000-000000000003', 'zai4 jian4'),
  ('f1000000-0000-4000-8000-000000000004', 'nǐ hǎo|ni3 hao3'),
  ('f1000000-0000-4000-8000-000000000005', '师');

-- =====================================================================
-- Bài làm của học viên A, kèm điểm học viên tự điền ở câu tự luận.
--
-- Dựng dưới quyền admin để đặt được id cố định: quyền theo cột
-- (`grant insert (assignment_id, student_id)`) không cho học viên tự chọn id.
-- Việc học viên tạo được bài làm của mình đã có test riêng trong rls.test.sql.
-- =====================================================================
insert into public.submissions (id, assignment_id, student_id) values
  ('11000000-0000-4000-8000-00000000000a', 'e1000000-0000-4000-8000-000000000001',
   'b1000000-0000-4000-8000-00000000000a');

insert into public.submission_answers (submission_id, question_id, text_answer) values
  ('11000000-0000-4000-8000-00000000000a', 'f1000000-0000-4000-8000-000000000001', 'Xin chào'),
  ('11000000-0000-4000-8000-00000000000a', 'f1000000-0000-4000-8000-000000000002', 'Cảm ơn'),
  ('11000000-0000-4000-8000-00000000000a', 'f1000000-0000-4000-8000-000000000003', '  ZAI4   jian4 '),
  ('11000000-0000-4000-8000-00000000000a', 'f1000000-0000-4000-8000-000000000004', 'ni3 hao3'),
  ('11000000-0000-4000-8000-00000000000a', 'f1000000-0000-4000-8000-000000000005', '师'),
  ('11000000-0000-4000-8000-00000000000a', 'f1000000-0000-4000-8000-000000000006', 'Bài viết của em.');

set local role authenticated;
set local request.jwt.claims = '{"sub":"b1000000-0000-4000-8000-00000000000a","role":"authenticated"}';

-- Học viên tự điền điểm cho mình trong lúc bài còn nháp (policy answers_update
-- cho phép sửa câu trả lời khi bài chưa nộp, kể cả cột teacher_score).
update public.submission_answers set teacher_score = 99
 where submission_id = '11000000-0000-4000-8000-00000000000a'
   and question_id = 'f1000000-0000-4000-8000-000000000006';

select is(
  (select teacher_score from public.submission_answers
    where question_id = 'f1000000-0000-4000-8000-000000000006')::numeric,
  99::numeric,
  'Trước khi nộp, điểm học viên tự điền vẫn còn trong bảng'
);

-- =====================================================================
-- Nộp bài
-- =====================================================================
select lives_ok(
  $$select public.submit_assignment('11000000-0000-4000-8000-00000000000a')$$,
  'Học viên nộp được bài của chính mình'
);

select is(
  (select status from public.submissions where id = '11000000-0000-4000-8000-00000000000a')::text,
  'submitted',
  'Nộp xong bài chuyển sang trạng thái submitted'
);

select isnt(
  (select submitted_at from public.submissions where id = '11000000-0000-4000-8000-00000000000a'),
  null,
  'Nộp xong có mốc thời gian nộp'
);

-- =====================================================================
-- Chấm tự động từng dạng câu
-- =====================================================================
select is(
  (select auto_score from public.submission_answers
    where question_id = 'f1000000-0000-4000-8000-000000000001')::numeric,
  2::numeric,
  'Trắc nghiệm chọn đúng được trọn điểm'
);

select is(
  (select auto_score from public.submission_answers
    where question_id = 'f1000000-0000-4000-8000-000000000002')::numeric,
  0::numeric,
  'Trắc nghiệm chọn sai được 0 điểm'
);

select is(
  (select auto_score from public.submission_answers
    where question_id = 'f1000000-0000-4000-8000-000000000003')::numeric,
  2::numeric,
  'Pinyin viết hoa và thừa khoảng trắng vẫn được tính đúng'
);

select is(
  (select auto_score from public.submission_answers
    where question_id = 'f1000000-0000-4000-8000-000000000004')::numeric,
  2::numeric,
  'Đáp án nhiều lựa chọn ngăn bằng | thì khớp lựa chọn nào cũng đúng'
);

select is(
  (select auto_score from public.submission_answers
    where question_id = 'f1000000-0000-4000-8000-000000000005')::numeric,
  2::numeric,
  'Điền từ khớp chữ Hán được trọn điểm'
);

select is(
  (select auto_score from public.submission_answers
    where question_id = 'f1000000-0000-4000-8000-000000000006'),
  null,
  'Câu tự luận để trống cho giáo viên chấm tay'
);

select is(
  (select teacher_score from public.submission_answers
    where question_id = 'f1000000-0000-4000-8000-000000000006'),
  null,
  'Điểm học viên tự điền bị xoá khi nộp bài'
);

-- =====================================================================
-- Không nộp lại được, và không nộp hộ người khác được
-- =====================================================================
select throws_ok(
  $$select public.submit_assignment('11000000-0000-4000-8000-00000000000a')$$,
  'Bài này đã được nộp',
  'Nộp lần thứ hai bị từ chối'
);

set local request.jwt.claims = '{"sub":"b1000000-0000-4000-8000-00000000000b","role":"authenticated"}';

select throws_ok(
  $$select public.submit_assignment('11000000-0000-4000-8000-00000000000a')$$,
  'Không tìm thấy bài làm',
  'Học viên B không nộp hộ được bài của học viên A'
);

select * from finish();
rollback;
