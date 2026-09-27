-- =====================================================================
-- Hanzi Class — migration khởi tạo (nguồn sự thật của database)
-- Sinh từ supabase/schema.sql tại task P0-01. Không sửa file này;
-- mọi thay đổi schema về sau là một migration mới.
-- =====================================================================


create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Kiểu enum
-- ---------------------------------------------------------------------
create type public.user_role         as enum ('teacher', 'student');
create type public.material_type     as enum ('slide', 'video', 'document', 'link');
create type public.question_type     as enum ('multiple_choice', 'fill_blank', 'pinyin', 'essay', 'writing', 'speaking');
create type public.submission_status as enum ('draft', 'submitted', 'graded');

-- ---------------------------------------------------------------------
-- 2. Bảng
-- ---------------------------------------------------------------------

-- Hồ sơ người dùng, 1-1 với auth.users. Mọi tài khoản mới là học viên;
-- giáo viên được nâng quyền thủ công (xem README).
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null default 'student',
  full_name   text not null default '',
  created_at  timestamptz not null default now()
);

create table public.classes (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  hsk_level   smallint check (hsk_level between 1 and 9),
  join_code   text not null unique
              default upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  created_at  timestamptz not null default now()
);

create table public.class_members (
  class_id    uuid not null references public.classes (id) on delete cascade,
  student_id  uuid not null references public.profiles (id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table public.lessons (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes (id) on delete cascade,
  title       text not null,
  summary     text,
  position    int not null default 0,
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.lesson_materials (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null references public.lessons (id) on delete cascade,
  type          public.material_type not null,
  title         text not null,
  storage_path  text,   -- file trong bucket 'materials' (slide PDF, tài liệu)
  url           text,   -- link ngoài (YouTube, Google Slides...)
  position      int not null default 0,
  created_at    timestamptz not null default now(),
  check (storage_path is not null or url is not null)
);

create table public.vocab (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons (id) on delete cascade,
  hanzi       text not null,
  pinyin      text not null,
  meaning_vi  text not null,
  example     text,
  position    int not null default 0
);

create table public.assignments (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes (id) on delete cascade,
  lesson_id     uuid references public.lessons (id) on delete set null,
  title         text not null,
  instructions  text,
  due_at        timestamptz,
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);

create table public.questions (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references public.assignments (id) on delete cascade,
  type           public.question_type not null,
  prompt         text not null,
  options        jsonb,              -- ["A", "B", "C"] cho câu trắc nghiệm
  points         numeric(5, 2) not null default 1,
  position       int not null default 0
);

-- Đáp án tách riêng khỏi questions: học viên đọc được câu hỏi
-- nhưng RLS không bao giờ cho đọc bảng này.
create table public.question_keys (
  question_id  uuid primary key references public.questions (id) on delete cascade,
  answer       text not null         -- nhiều đáp án chấp nhận: ngăn bằng '|'
);

create table public.submissions (
  id                   uuid primary key default gen_random_uuid(),
  assignment_id        uuid not null references public.assignments (id) on delete cascade,
  student_id           uuid not null references public.profiles (id) on delete cascade,
  status               public.submission_status not null default 'draft',
  submitted_at         timestamptz,
  graded_at            timestamptz,
  score                numeric(6, 2),
  teacher_comment      text,
  feedback_audio_path  text,         -- nhận xét bằng giọng nói của giáo viên
  created_at           timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table public.submission_answers (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references public.submissions (id) on delete cascade,
  question_id    uuid not null references public.questions (id) on delete cascade,
  text_answer    text,
  file_path      text,               -- ảnh bài viết tay / file ghi âm
  auto_score     numeric(5, 2),      -- hệ thống chấm
  teacher_score  numeric(5, 2),      -- giáo viên chấm (ưu tiên hơn auto_score)
  comment        text,               -- nhận xét của giáo viên cho câu này
  unique (submission_id, question_id)
);

create table public.announcements (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- Flashcard lặp lại ngắt quãng (giai đoạn 2), thuật toán SM-2
create table public.vocab_reviews (
  student_id     uuid not null references public.profiles (id) on delete cascade,
  vocab_id       uuid not null references public.vocab (id) on delete cascade,
  ease           real not null default 2.5,
  interval_days  int  not null default 0,
  reps           int  not null default 0,
  due_at         timestamptz not null default now(),
  primary key (student_id, vocab_id)
);

-- ---------------------------------------------------------------------
-- 3. Index
-- ---------------------------------------------------------------------
create index on public.class_members (student_id);
create index on public.lessons (class_id, position);
create index on public.lesson_materials (lesson_id, position);
create index on public.vocab (lesson_id, position);
create index on public.assignments (class_id, due_at);
create index on public.questions (assignment_id, position);
create index on public.submissions (assignment_id, status);
create index on public.submissions (student_id);
create index on public.submission_answers (submission_id);
create index on public.vocab_reviews (student_id, due_at);

-- ---------------------------------------------------------------------
-- 4. Hàm trợ giúp cho RLS (security definer để tránh đệ quy policy)
-- ---------------------------------------------------------------------
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'teacher');
$$;

create or replace function public.teaches_class(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes where id = cid and teacher_id = auth.uid());
$$;

create or replace function public.in_class(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.teaches_class(cid)
      or exists (select 1 from class_members where class_id = cid and student_id = auth.uid());
$$;

create or replace function public.assignment_class(aid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select class_id from assignments where id = aid;
$$;

-- ---------------------------------------------------------------------
-- 5. Trigger & RPC
-- ---------------------------------------------------------------------

-- Tạo profile khi có người đăng ký
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Học viên vào lớp bằng mã lớp
create or replace function public.join_class(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select id into cid from classes where join_code = upper(trim(code));
  if cid is null then
    raise exception 'Mã lớp không đúng';
  end if;
  insert into class_members (class_id, student_id)
  values (cid, auth.uid())
  on conflict do nothing;
  return cid;
end;
$$;

-- Học viên nộp bài: khoá bài, xoá mọi điểm tự điền, chấm tự động
-- các câu có đáp án (trắc nghiệm, điền từ, pinyin).
create or replace function public.submit_assignment(sub_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare s submissions%rowtype;
begin
  select * into s from submissions where id = sub_id and student_id = auth.uid();
  if not found then
    raise exception 'Không tìm thấy bài làm';
  end if;
  if s.status <> 'draft' then
    raise exception 'Bài này đã được nộp';
  end if;

  update submission_answers
     set auto_score = null, teacher_score = null, comment = null
   where submission_id = sub_id;

  -- So khớp không phân biệt hoa thường, bỏ khoảng trắng thừa.
  -- Pinyin: nên thống nhất một kiểu gõ (dấu thanh "nǐ hǎo" hoặc số "ni3 hao3")
  -- và liệt kê cả hai trong đáp án nếu chấp nhận cả hai: "nǐ hǎo|ni3 hao3".
  update submission_answers sa
     set auto_score = case
           when exists (
             select 1 from unnest(string_to_array(k.answer, '|')) as a(v)
              where lower(regexp_replace(trim(a.v), '\s+', ' ', 'g'))
                  = lower(regexp_replace(trim(coalesce(sa.text_answer, '')), '\s+', ' ', 'g'))
           ) then q.points else 0 end
    from questions q
    join question_keys k on k.question_id = q.id
   where sa.submission_id = sub_id
     and sa.question_id = q.id
     and q.type in ('multiple_choice', 'fill_blank', 'pinyin');

  update submissions
     set status = 'submitted', submitted_at = now()
   where id = sub_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Quyền theo cột (chặn học viên tự sửa role, điểm, trạng thái)
-- ---------------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant  update (full_name) on public.profiles to authenticated;

revoke insert, update on public.submissions from authenticated;
grant  insert (assignment_id, student_id) on public.submissions to authenticated;
grant  update (status, score, graded_at, teacher_comment, feedback_audio_path)
       on public.submissions to authenticated;

-- ---------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.classes            enable row level security;
alter table public.class_members      enable row level security;
alter table public.lessons            enable row level security;
alter table public.lesson_materials   enable row level security;
alter table public.vocab              enable row level security;
alter table public.assignments        enable row level security;
alter table public.questions          enable row level security;
alter table public.question_keys      enable row level security;
alter table public.submissions        enable row level security;
alter table public.submission_answers enable row level security;
alter table public.announcements      enable row level security;
alter table public.vocab_reviews      enable row level security;

-- profiles: xem chính mình; giáo viên xem học viên lớp mình; học viên xem giáo viên lớp mình
create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or exists (
    select 1 from class_members m join classes c on c.id = m.class_id
     where m.student_id = profiles.id and c.teacher_id = auth.uid()
  )
  or exists (
    select 1 from classes c
     where c.teacher_id = profiles.id and public.in_class(c.id)
  )
);
create policy profiles_update on public.profiles for update using (id = auth.uid());

-- classes
create policy classes_select on public.classes for select using (public.in_class(id));
create policy classes_insert on public.classes for insert
  with check (public.is_teacher() and teacher_id = auth.uid());
create policy classes_update on public.classes for update using (teacher_id = auth.uid());
create policy classes_delete on public.classes for delete using (teacher_id = auth.uid());

-- class_members (thêm qua join_class)
create policy members_select on public.class_members for select
  using (student_id = auth.uid() or public.teaches_class(class_id));
create policy members_delete on public.class_members for delete
  using (public.teaches_class(class_id));

-- lessons: học viên chỉ thấy bài đã xuất bản
create policy lessons_select on public.lessons for select
  using (public.teaches_class(class_id) or (published and public.in_class(class_id)));
create policy lessons_write on public.lessons for all
  using (public.teaches_class(class_id)) with check (public.teaches_class(class_id));

-- lesson_materials & vocab: kế thừa quyền đọc từ lessons (RLS áp cho subquery)
create policy materials_select on public.lesson_materials for select
  using (exists (select 1 from lessons l where l.id = lesson_id));
create policy materials_write on public.lesson_materials for all
  using (exists (select 1 from lessons l where l.id = lesson_id and public.teaches_class(l.class_id)))
  with check (exists (select 1 from lessons l where l.id = lesson_id and public.teaches_class(l.class_id)));

create policy vocab_select on public.vocab for select
  using (exists (select 1 from lessons l where l.id = lesson_id));
create policy vocab_write on public.vocab for all
  using (exists (select 1 from lessons l where l.id = lesson_id and public.teaches_class(l.class_id)))
  with check (exists (select 1 from lessons l where l.id = lesson_id and public.teaches_class(l.class_id)));

-- assignments
create policy assignments_select on public.assignments for select
  using (public.teaches_class(class_id) or (published and public.in_class(class_id)));
create policy assignments_write on public.assignments for all
  using (public.teaches_class(class_id)) with check (public.teaches_class(class_id));

-- questions
create policy questions_select on public.questions for select
  using (exists (select 1 from assignments a where a.id = assignment_id));
create policy questions_write on public.questions for all
  using (public.teaches_class(public.assignment_class(assignment_id)))
  with check (public.teaches_class(public.assignment_class(assignment_id)));

-- question_keys: chỉ giáo viên
create policy keys_teacher on public.question_keys for all
  using (exists (select 1 from questions q
                  where q.id = question_id
                    and public.teaches_class(public.assignment_class(q.assignment_id))))
  with check (exists (select 1 from questions q
                       where q.id = question_id
                         and public.teaches_class(public.assignment_class(q.assignment_id))));

-- submissions: học viên tạo bài của mình; giáo viên xem và chấm
create policy submissions_select on public.submissions for select
  using (student_id = auth.uid() or public.teaches_class(public.assignment_class(assignment_id)));
create policy submissions_insert on public.submissions for insert
  with check (student_id = auth.uid()
              and exists (select 1 from assignments a where a.id = assignment_id));
create policy submissions_update on public.submissions for update
  using (public.teaches_class(public.assignment_class(assignment_id)));

-- submission_answers
create policy answers_select on public.submission_answers for select
  using (exists (select 1 from submissions s where s.id = submission_id));
create policy answers_student_insert on public.submission_answers for insert
  with check (exists (
    select 1 from submissions s join questions q on q.assignment_id = s.assignment_id
     where s.id = submission_id and q.id = question_id
       and s.student_id = auth.uid() and s.status = 'draft'));
create policy answers_update on public.submission_answers for update
  using (exists (
    select 1 from submissions s
     where s.id = submission_id
       and ((s.student_id = auth.uid() and s.status = 'draft')
            or public.teaches_class(public.assignment_class(s.assignment_id)))));

-- announcements
create policy announcements_select on public.announcements for select
  using (public.in_class(class_id));
create policy announcements_write on public.announcements for all
  using (public.teaches_class(class_id))
  with check (public.teaches_class(class_id) and author_id = auth.uid());

-- vocab_reviews: của riêng từng học viên
create policy reviews_own on public.vocab_reviews for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ---------------------------------------------------------------------
-- 8. Storage
--   materials:   {class_id}/{lesson_id}/{file}
--   submissions: {class_id}/{student_id}/{assignment_id}/{file}
--                {class_id}/{student_id}/feedback/{file}   (giáo viên ghi âm)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('materials',   'materials',   false, 52428800),   -- 50 MB
       ('submissions', 'submissions', false, 10485760)    -- 10 MB
on conflict (id) do nothing;

create policy "materials read" on storage.objects for select
  using (bucket_id = 'materials' and public.in_class(((storage.foldername(name))[1])::uuid));
create policy "materials write" on storage.objects for insert
  with check (bucket_id = 'materials' and public.teaches_class(((storage.foldername(name))[1])::uuid));
create policy "materials delete" on storage.objects for delete
  using (bucket_id = 'materials' and public.teaches_class(((storage.foldername(name))[1])::uuid));

create policy "submissions read" on storage.objects for select
  using (bucket_id = 'submissions' and (
    (storage.foldername(name))[2] = auth.uid()::text
    or public.teaches_class(((storage.foldername(name))[1])::uuid)));
create policy "submissions write" on storage.objects for insert
  with check (bucket_id = 'submissions' and (
    ((storage.foldername(name))[2] = auth.uid()::text
      and public.in_class(((storage.foldername(name))[1])::uuid))
    or public.teaches_class(((storage.foldername(name))[1])::uuid)));
