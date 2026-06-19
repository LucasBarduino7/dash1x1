'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CalendarDays, Ticket, TrendingUp, Users } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Alavancas', icon: TrendingUp, match: (p: string) => p === '/' },
  { href: '/workshop', label: 'Workshop', icon: Ticket, match: (p: string) => p.startsWith('/workshop') },
  { href: '/1x1', label: '1x1', icon: BarChart3, match: (p: string) => p.startsWith('/1x1') },
  {
    href: '/social-selling',
    label: 'Social Selling',
    icon: Users,
    match: (p: string) => p.startsWith('/social-selling'),
  },
  {
    href: '/evento-presencial',
    label: 'Evento Presencial',
    icon: CalendarDays,
    match: (p: string) => p.startsWith('/evento-presencial'),
  },
];

export function EcosystemNav() {
  const pathname = usePathname() || '/';
  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-brand)] text-sm font-bold text-white">
            S
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-[var(--color-text)] sm:block">
            Scale · Dashboards
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = t.match(pathname);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  active
                    ? 'inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-sm font-medium text-white'
                    : 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-[var(--color-surface-2)]'
                }
              >
                <Icon className="h-4 w-4" />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
