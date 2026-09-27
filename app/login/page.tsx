import Link from 'next/link';
import { HanziWord } from '@/components/Tianzige';
import { SubmitButton } from '@/components/SubmitButton';
import { login, signup } from './actions';

type Props = { searchParams: Promise<{ mode?: string; error?: string; message?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { mode, error, message } = await searchParams;
  const isSignup = mode === 'signup';

  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl items-center gap-12 px-4 py-12 md:grid-cols-[1.1fr_1fr]">
      <section>
        <HanziWord text="学中文" size={88} />
        <h1 className="mt-8 max-w-md text-3xl leading-snug">
          Bài giảng, bài tập và lời chữa của giáo viên, ở cùng một chỗ.
        </h1>
        <p className="mt-3 max-w-md text-muted">
          Học viên vào lớp bằng mã do giáo viên gửi. Bài viết tay chụp ảnh nộp, bài nói ghi âm ngay trên điện thoại.
        </p>
      </section>

      <section className="panel w-full max-w-sm md:justify-self-end">
        <h2 className="mb-5">{isSignup ? 'Tạo tài khoản học viên' : 'Đăng nhập'}</h2>

        {error && <p className="red-ink mb-4">{error}</p>}
        {message && <p className="mb-4 rounded-md bg-jade-soft px-3 py-2 text-sm text-jade-dark">{message}</p>}

        <form action={isSignup ? signup : login} className="space-y-4">
          {isSignup && (
            <div>
              <label className="label" htmlFor="full_name">Họ và tên</label>
              <input id="full_name" name="full_name" required className="field" autoComplete="name" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className="field" autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Mật khẩu</label>
            <input
              id="password" name="password" type="password" required minLength={isSignup ? 8 : undefined}
              className="field" autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </div>
          <SubmitButton className="btn-primary w-full" pendingText="Đang xử lý…">
            {isSignup ? 'Tạo tài khoản' : 'Đăng nhập'}
          </SubmitButton>
        </form>

        <p className="mt-5 text-sm text-muted">
          {isSignup ? (
            <>Đã có tài khoản? <Link href="/login" className="text-jade underline">Đăng nhập</Link></>
          ) : (
            <>Học viên mới? <Link href="/login?mode=signup" className="text-jade underline">Tạo tài khoản</Link></>
          )}
        </p>
      </section>
    </main>
  );
}
