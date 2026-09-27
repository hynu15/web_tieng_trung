'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavIcon = 'tong-quan' | 'bai-giang' | 'bai-tap' | 'hoc-vien' | 'lop-hoc';

export type NavLink = { href: string; label: string; icon: NavIcon };

const ICONS: Record<NavIcon, React.ReactNode> = {
  'tong-quan': (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  'bai-giang': (
    <>
      <path d="M4 5.5h16v14H4z" />
      <path d="M4 9.5h16M12 9.5v10" />
    </>
  ),
  'bai-tap': (
    <>
      <path d="M9 3.5h9v17H6V6.5z" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  'hoc-vien': (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.2 2.9-5.2 6-5.2s6 2 6 5.2" />
      <path d="M17.5 11h4M19.5 9v4" />
    </>
  ),
  'lop-hoc': (
    <>
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M5.5 12v8h13v-8" />
    </>
  ),
};

function Icon({ name, className }: { name: NavIcon; className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

// Mục đầu tiên là gốc của khu, chỉ sáng khi đứng đúng nó; các mục còn lại
// sáng cho cả trang con (vd. /teacher/lessons/abc vẫn sáng mục Bài giảng).
function dangMo(pathname: string, link: NavLink, root: string) {
  return link.href === root ? pathname === root : pathname.startsWith(link.href);
}

export function NavLinks({ links, variant }: { links: NavLink[]; variant: 'sidebar' | 'tabbar' }) {
  const pathname = usePathname();
  const root = links[0].href;

  if (variant === 'tabbar') {
    return (
      <nav
        aria-label="Điều hướng chính"
        className="safe-bottom grid border-t border-line bg-surface px-2 pt-1.5"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
      >
        {links.map((l) => {
          const active = dangMo(pathname, l, root);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[11px] leading-tight ${
                active ? 'font-semibold text-jade-dark' : 'text-muted'
              }`}
            >
              <Icon name={l.icon} className="h-5 w-5" />
              <span className="truncate">{l.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Điều hướng chính" className="flex flex-col gap-0.5">
      {links.map((l) => {
        const active = dangMo(pathname, l, root);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? 'bg-jade-soft font-semibold text-jade-dark'
                : 'text-muted hover:bg-paper hover:text-ink'
            }`}
          >
            <Icon name={l.icon} className="h-[18px] w-[18px] shrink-0" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
