'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {links.map((l) => {
        const root = links[0].href;
        const active = l.href === root ? pathname === root : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
              active ? 'bg-jade-soft font-medium text-jade-dark' : 'text-muted hover:text-ink'
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
