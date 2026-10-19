'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  {
    href: '/',
    label: 'Conversations',
    isActive: (path: string) => path === '/' || path.startsWith('/conversations'),
  },
  { href: '/prompt', label: 'AI Prompt', isActive: (path: string) => path.startsWith('/prompt') },
];

export const Nav = () => {
  const pathname = usePathname();

  if (pathname.startsWith('/login')) return null;

  return (
    <nav className="mb-6 flex gap-4 border-b border-slate-200 pb-3 text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={link.isActive(pathname) ? 'font-semibold' : 'text-slate-500 hover:text-slate-900'}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
};
