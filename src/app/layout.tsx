import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Betting Stream Tracker',
  description: 'Track multiple concurrent betting streams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 border-r bg-card p-4">
            <h1 className="mb-8 text-xl font-bold">StreamTracker</h1>
            <nav className="space-y-2">
              <Link href="/" className="block rounded-lg px-4 py-2 hover:bg-accent">
                Dashboard
              </Link>
              <Link href="/streams" className="block rounded-lg px-4 py-2 hover:bg-accent">
                Streams
              </Link>
              <Link href="/bets" className="block rounded-lg px-4 py-2 hover:bg-accent">
                Bets
              </Link>
              <Link href="/bankroll" className="block rounded-lg px-4 py-2 hover:bg-accent">
                Bankroll
              </Link>
              <Link href="/leagues" className="block rounded-lg px-4 py-2 hover:bg-accent">
                Leagues
              </Link>
              <Link href="/analytics" className="block rounded-lg px-4 py-2 hover:bg-accent">
                Analytics
              </Link>
              <Link href="/settings" className="block rounded-lg px-4 py-2 hover:bg-accent">
                Settings
              </Link>
            </nav>
          </div>
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}