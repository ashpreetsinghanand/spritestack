import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpriteStack Dashboard — TestOps Ecosystem',
  description: 'The complete TestOps dashboard for TestSprite MCP. View test history, trends, Round 1 vs Round 2 comparisons, and live coverage metrics.',
  keywords: ['TestSprite', 'TestOps', 'testing', 'MCP', 'SpriteStack'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
