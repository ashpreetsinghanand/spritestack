"use client";

import Link from 'next/link';
// Slack icon is rendered via inline SVG

export default function SettingsPage() {
  return (
    <>
      <header className="shrink-0 py-4 px-6 border-b border-border bg-card">
        <h1 className="text-lg font-bold text-card-foreground mb-0.5">Settings</h1>
        <p className="text-xs text-muted-foreground m-0">Configure your SpriteStack TestOps instance.</p>
      </header>

      <main className="flex-1 overflow-y-auto p-5 md:p-6 bg-background">
        <div className="max-w-2xl flex flex-col gap-3">

          <Link
            href="/settings/slack"
            className="group flex items-start gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none">
                <path d="M5.4 15.6a1.8 1.8 0 1 1-1.8-1.8h1.8v1.8zm.9 0a1.8 1.8 0 1 1 3.6 0V20.4a1.8 1.8 0 1 1-3.6 0V15.6zm1.8-10.2a1.8 1.8 0 1 1 1.8-1.8V5.4H8.1zm0 .9a1.8 1.8 0 1 1 0 3.6H3.6a1.8 1.8 0 1 1 0-3.6H8.1zm10.2 1.8a1.8 1.8 0 1 1 1.8 1.8H18.3V8.1zm-.9 0a1.8 1.8 0 1 1-3.6 0V3.6a1.8 1.8 0 1 1 3.6 0V8.1zm-1.8 10.2a1.8 1.8 0 1 1-1.8 1.8V18.3h1.8zm0-.9a1.8 1.8 0 1 1 0-3.6H20.4a1.8 1.8 0 1 1 0 3.6H15.6z" fill="currentColor" className="text-purple-500" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">Slack Integration</div>
              <div className="text-xs text-muted-foreground mt-0.5">Configure incoming webhooks and notification preferences for test run alerts.</div>
            </div>
            <svg viewBox="0 0 24 24" width={16} height={16} className="text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

        </div>
      </main>
    </>
  );
}
