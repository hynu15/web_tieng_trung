Thực hiện task $ARGUMENTS trong docs/PLAN.md.

1. Đọc CLAUDE.md và toàn bộ mục task $ARGUMENTS trong docs/PLAN.md.
2. Kiểm tra các task trong "Phụ thuộc" đã được đánh dấu [x]. Nếu chưa, dừng và báo lại.
3. Đọc các file liên quan được liệt kê trong task trước khi sửa.
4. Trình bày kế hoạch: danh sách file tạo/sửa, migration (nếu có), test sẽ viết. Nếu task có nhãn [Hỏi trước], chờ tôi xác nhận.
5. Thực hiện, rồi chạy các lệnh trong mục "Kiểm tra" của task, cùng `npm run build`.
6. Đối chiếu từng dòng "Hoàn thành khi". Dòng nào chưa đạt thì làm tiếp hoặc báo rõ lý do.
7. Cập nhật bảng tiến độ và Nhật ký trong docs/PLAN.md, rồi commit với message "$ARGUMENTS: <mô tả ngắn>".
