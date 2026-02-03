'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/streams', label: 'Streams', icon: '🌊' },
  { href: '/bets', label: 'All Bets', icon: '🎰' },
  { href: '/bankroll', label: 'Bankroll', icon: '💰' },
  { href: '/leagues', label: 'Leagues', icon: '🏆' },
  { href: '/markets', label: 'Markets', icon: '📈' },
  { href: '/analytics', label: 'Analytics', icon: '📉' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <span className="text-2xl">🎯</span>
          <span className="text-lg font-bold">Betting Tracker</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center text-xs text-muted-foreground">
            <p className="font-medium">Betting Tracker v1.1</p>
            <p>Track • Analyze • Profit</p>
          </div>
        </div>
      </div>
    </aside>
  );
}