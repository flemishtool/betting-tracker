'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/streams', label: 'Streams', icon: '🌊' },
  { href: '/bets', label: 'Bets', icon: '🎰' },
  { href: '/opportunities', label: 'Opportunities', icon: '🎯' },
  { href: '/leagues', label: 'Leagues', icon: '🏆' },
  { href: '/markets', label: 'Markets', icon: '📈' },
  { href: '/bankroll', label: 'Bankroll', icon: '💰' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 h-full w-52 bg-gray-900 border-r border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-8">
        <span className="text-2xl">⚽</span>
        <h1 className="text-xl font-bold text-white">Bet Tracker</h1>
      </div>
      
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
