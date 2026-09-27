import Link from 'next/link';
import { logout } from '@/app/login/actions';
import { NavLinks, type NavLink } from './NavLinks';
import { ThemeToggle } from './ThemeToggle';
import { Tianzige } from './Tianzige';

// Trên điện thoại hẹp chỉ để lại ô 汉: đủ nhận ra app mà không đẩy nút
// điều hướng và nút đăng xuất xuống dòng.
function ThuongHieu({ nho = false }: { nho?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
      <Tianzige char="汉" size={nho ? 28 : 32} />
      <span className={nho ? 'hidden whitespace-nowrap sm:inline' : 'whitespace-nowrap'}>
        Lớp Hán ngữ
      </span>
    </Link>
  );
}

function NutDangXuat({ className }: { className: string }) {
  return (
    <form action={logout}>
      <button className={className}>Đăng xuất</button>
    </form>
  );
}

export function AppShell({
  name,
  roleLabel,
  links,
  children,
}: {
  name: string;
  roleLabel: string;
  links: NavLink[];
  children: React.ReactNode;
}) {
  const tenHienThi = name || 'Chưa đặt tên';
  // Thanh tab dưới đáy chỉ có nghĩa khi có từ hai nơi để đi. Khu học viên hiện
  // chỉ có một mục nên dùng thanh trên đỉnh; khi P1-02 thêm trang tài khoản và
  // P2-04 thêm trang ôn từ thì thanh tab tự xuất hiện.
  const coThanhTab = links.length > 1;

  return (
    <div className="min-h-dvh">
      {/* ---------- Cột trái, từ khổ máy tính trở lên ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface px-3 py-4 lg:flex">
        <div className="px-2 pb-5">
          <ThuongHieu />
        </div>
        <NavLinks links={links} variant="sidebar" />
        <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
          <span className="min-w-0 flex-1 px-1 text-sm">
            <span className="block truncate font-medium">{tenHienThi}</span>
            <span className="block text-xs text-muted">{roleLabel}</span>
          </span>
          <ThemeToggle />
        </div>
        <NutDangXuat className="mt-2 rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-paper hover:text-ink" />
      </aside>

      {/* ---------- Thanh trên đỉnh, chỉ ở khổ điện thoại và máy tính bảng ---------- */}
      <header className="sticky top-0 z-20 border-b border-line bg-surface lg:hidden">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <ThuongHieu nho />
          {!coThanhTab && <NavLinks links={links} variant="sidebar" />}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted sm:block">{tenHienThi}</span>
            <ThemeToggle />
            <NutDangXuat className="whitespace-nowrap rounded-lg px-2 py-2 text-sm text-muted hover:text-ink" />
          </div>
        </div>
      </header>

      {/* Cột trái rộng 15rem và nằm ngoài luồng, nên phần còn lại phải tự chừa
          chỗ bằng padding; căn giữa nội dung trong phần còn lại đó. */}
      <div className="lg:pl-60">
        <main
          className={`mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8 ${
            coThanhTab ? 'pb-28 lg:pb-8' : 'pb-10'
          }`}
        >
          {children}
        </main>
      </div>

      {/* ---------- Thanh tab dưới đáy, chỉ ở khổ điện thoại ---------- */}
      {coThanhTab && (
        <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
          <NavLinks links={links} variant="tabbar" />
        </div>
      )}
    </div>
  );
}
