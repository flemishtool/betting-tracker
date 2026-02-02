'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/streams', label: 'Streams', icon: '🌊' },
  { href: '/bets', label: 'All Bets', icon: '🎰' },
  { href: '/markets', label: 'Markets', icon: '📈' },
  { href: '/leagues', label: 'Leagues', icon: '🏆' },
  { href: '/bankroll', label: 'Bankroll', icon: '💰' },
  { href: '/analytics', label: 'Analytics', icon: '📉' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <span className="text-2xl">🎯</span>
          <span className="text-xl font-bold">Betting Tracker</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Added v2 marker */}
        <div className="border-t p-4">
          <div className="rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">
            <p className="font-medium">Betting Tracker v2</p>
            <p>Track • Analyze • Profit</p>
          </div>
        </div>
      </div>
    </aside>
  );
}