"use client";

import { useState } from 'react';
import { Zap, Save } from 'lucide-react';

export default function SettingsPage() {
  const [slackWebhook, setSlackWebhook] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  return (
    <>
      <header className="shrink-0 py-4 px-6 border-b border-border bg-card">
        <h1 className="text-lg font-bold text-card-foreground mb-0.5">Configuration & Settings</h1>
        <p className="text-xs text-muted-foreground m-0">Manage integrations and environment variables for your MCP instance.</p>
      </header>

      <main className="flex-1 overflow-y-auto p-5 md:p-6 bg-background">
        <div className="max-w-2xl">
          
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <h3 className="text-base font-semibold text-card-foreground flex items-center gap-2 m-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Zap size={16} className="text-indigo-500" />
                </div>
                Slack Integration
              </h3>
              <p className="text-sm text-muted-foreground mt-2 mb-0">
                Configure a Slack Webhook URL to receive real-time alerts when Service Level Objectives (SLOs) are breached or when critical functional tests fail during a test run.
              </p>
            </div>
            
            <div className="px-6 py-5 bg-muted/20">
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Slack Webhook URL
                </label>
                <input 
                  type="text" 
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground shadow-sm"
                />
                <p className="text-xs text-muted-foreground mt-2 mb-0">
                  You can find your webhook URL in your Slack App configurations under "Incoming Webhooks".
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => {
                    setIsSaving(true);
                    setTimeout(() => setIsSaving(false), 800);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving Changes...' : <><Save size={16} /> Save Integrations</>}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
