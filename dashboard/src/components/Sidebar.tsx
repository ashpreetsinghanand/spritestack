"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  FlaskConical, LayoutDashboard, FileText, Settings, ExternalLink, Moon, Sun
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: FileText, label: 'Reports & Artifacts', href: '/reports' },
  ];

  return (
    <aside className="w-[228px] shrink-0 bg-card border-r border-border flex flex-col h-screen overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0 shadow-md">
          <FlaskConical size={16} color="white" />
        </div>
        <div>
          <div className="text-sm font-bold text-card-foreground">SpriteStack</div>
          <div className="text-[10px] text-muted-foreground">TestOps Ecosystem</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-muted-foreground tracking-wider px-2 py-1 m-0">OVERVIEW</p>
        
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive 
                  ? 'bg-primary/10 text-primary font-medium border border-primary/20' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
              }`}
            >
              <item.icon size={15} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <p className="text-[10px] font-semibold text-muted-foreground tracking-wider px-2 py-1 mt-5 m-0">SETTINGS</p>
        
        <Link 
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/settings'
              ? 'bg-primary/10 text-primary font-medium border border-primary/20' 
              : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
          }`}
        >
          <Settings size={15} />
          <span>Settings</span>
        </Link>
        <a 
          href="https://testsprite.com" 
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ExternalLink size={15} />
          <span>TestSprite</span>
        </a>

        {/* Theme Toggle */}
        <p className="text-[10px] font-semibold text-muted-foreground tracking-wider px-2 py-1 mt-5 m-0">THEME</p>
        {mounted && (
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        )}
      </nav>

      {/* MCP Badge */}
      <div className="flex items-center gap-2 mx-3 mb-3 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_6px_rgba(34,197,94,0.8)] animate-pulse" />
        <div>
          <div className="text-[11px] font-semibold text-green-600 dark:text-green-500">MCP Connected</div>
          <div className="text-[10px] text-muted-foreground">TestSprite active</div>
        </div>
      </div>
    </aside>
  );
}
