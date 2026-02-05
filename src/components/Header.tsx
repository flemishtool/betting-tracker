'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/streams', label: 'Streams' },
    { href: '/bets', label: 'Bets' },
    { href: '/upcoming', label: 'Fixtures' },
    { href: '/bankroll', label: 'Bankroll' },
    { href: '/leagues', label: 'Leagues' },
    { href: '/markets', label: 'Markets' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/opportunities', label: 'Opportunities' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-xl font-bold text-white">
            Betting Tracker
          </Link>
          <nav className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded text-sm font-medium transition ${
                  pathname === item.href
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
