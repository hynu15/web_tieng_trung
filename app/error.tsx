'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-20">
      <h1>Thao tác chưa thực hiện được</h1>
      <p className="red-ink">{error.message || 'Lỗi không xác định.'}</p>
      <button onClick={reset} className="btn-primary">
        Thử lại
      </button>
    </main>
  );
}
