Chạy lần lượt và báo cáo kết quả từng bước, dừng ở bước lỗi đầu tiên và đề xuất cách sửa:

1. `npm run build`
2. `npm run check`
3. `npx supabase test db` (bỏ qua nếu Supabase local chưa chạy, và nói rõ là đã bỏ qua)
4. `npm run test:e2e` (nếu script đã tồn tại)

Sau đó rà `git diff` tìm: `any` mới, mã màu hex trong component, select bảng `question_keys` ở khu student,
dùng service role key ngoài route cron, bảng mới thiếu RLS.
