import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-20">
      <h1>Không tìm thấy trang này</h1>
      <p className="text-muted">
        Bài có thể đã bị xoá, chưa được đăng, hoặc bạn không có quyền xem.
      </p>
      <Link href="/" className="btn-primary">
        Về trang chính
      </Link>
    </main>
  );
}
