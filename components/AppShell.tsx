import Link from 'next/link';
import { logout } from '@/app/login/actions';
import { NavLinks } from './NavLinks';
import { Tianzige } from './Tianzige';

export function AppShell({
  name,
  roleLabel,
  links,
  children,
}: {
  name: string;
  roleLabel: string;
  links: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Tianzige char="汉" size={32} />
            Lớp Hán ngữ
          </Link>
          <NavLinks links={links} />
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-muted">
              {name || 'Chưa đặt tên'} · {roleLabel}
            </span>
            <form action={logout}>
              <button className="text-muted underline-offset-4 hover:text-ink hover:underline">Đăng xuất</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
