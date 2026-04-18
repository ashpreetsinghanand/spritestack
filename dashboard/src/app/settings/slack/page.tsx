"use client";

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2, XCircle, Loader2, Save, Send, BellRing, BellOff, Info,
} from 'lucide-react';

interface SlackConfig {
  slackWebhookUrl?: string;
  slackEnabled?: boolean;
  slackNotifyOnFail?: boolean;
  slackNotifyOnPass?: boolean;
}

type Status = 'idle' | 'saving' | 'saved' | 'error';
type TestStatus = 'idle' | 'sending' | 'ok' | 'fail';

export default function SlackPage() {
  const [config, setConfig] = useState<SlackConfig>({
    slackEnabled: true,
    slackNotifyOnFail: true,
    slackNotifyOnPass: false,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<Status>('idle');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/slack');
      const data = await res.json();
      setConfig(prev => ({
        slackEnabled: true,
        slackNotifyOnFail: true,
        slackNotifyOnPass: false,
        ...data,
      }));
    } catch (e: any) {
      setLoadError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e: any) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const sendTest = async () => {
    setTestStatus('sending');
    setTestError(null);
    try {
      const res = await fetch('/api/slack/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pass the current (possibly unsaved) webhook URL so users can test before saving
        body: JSON.stringify({ webhookUrl: config.slackWebhookUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setTestStatus('ok');
      setTimeout(() => setTestStatus('idle'), 4000);
    } catch (e: any) {
      setTestError(e.message);
      setTestStatus('fail');
      setTimeout(() => { setTestStatus('idle'); setTestError(null); }, 6000);
    }
  };

  const isConnected = Boolean(config.slackWebhookUrl);

  return (
    <>
      <header className="shrink-0 py-4 px-6 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4A154B]/20 flex items-center justify-center border border-[#4A154B]/30">
            {/* Slack icon approximation using Lucide */}
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <path d="M5.4 15.6a1.8 1.8 0 1 1-1.8-1.8h1.8v1.8zm.9 0a1.8 1.8 0 1 1 3.6 0V20.4a1.8 1.8 0 1 1-3.6 0V15.6zm1.8-10.2a1.8 1.8 0 1 1 1.8-1.8V5.4H8.1zm0 .9a1.8 1.8 0 1 1 0 3.6H3.6a1.8 1.8 0 1 1 0-3.6H8.1zm10.2 1.8a1.8 1.8 0 1 1 1.8 1.8H18.3V8.1zm-.9 0a1.8 1.8 0 1 1-3.6 0V3.6a1.8 1.8 0 1 1 3.6 0V8.1zm-1.8 10.2a1.8 1.8 0 1 1-1.8 1.8V18.3h1.8zm0-.9a1.8 1.8 0 1 1 0-3.6H20.4a1.8 1.8 0 1 1 0 3.6H15.6zm-10.2-1.8a1.8 1.8 0 1 1-1.8-1.8h1.8v1.8z" fill="currentColor" className="text-purple-400" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-card-foreground m-0">Slack Integration</h1>
            <p className="text-xs text-muted-foreground m-0">Receive real-time test alerts in your Slack workspace</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 md:p-6 bg-background">
        <div className="max-w-2xl flex flex-col gap-5">

          {/* Connection Status Banner */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${isConnected
            ? 'bg-emerald-500/8 border-emerald-500/20'
            : 'bg-amber-500/8 border-amber-500/20'}`}
          >
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-amber-500'}`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold m-0 ${isConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {isConnected ? 'Webhook configured' : 'No webhook configured'}
              </p>
              <p className="text-xs text-muted-foreground m-0 mt-0.5">
                {isConnected
                  ? `Notifications will be sent to your Slack workspace after each test run.`
                  : 'Add your incoming webhook URL below to start receiving notifications.'}
              </p>
            </div>
          </div>

          {/* Webhook URL Card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-card-foreground m-0">Incoming Webhook URL</h2>
            </div>
            <div className="p-5">
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Webhook URL
              </label>
              <input
                type="url"
                value={config.slackWebhookUrl ?? ''}
                onChange={e => setConfig(prev => ({ ...prev, slackWebhookUrl: e.target.value }))}
                placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXX"
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground font-mono"
              />
              <p className="text-xs text-muted-foreground mt-2 mb-0 flex items-start gap-1.5">
                <Info size={12} className="mt-0.5 shrink-0 text-blue-500" />
                Create an incoming webhook in your Slack App dashboard at&nbsp;
                <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" className="text-primary hover:underline">api.slack.com/apps</a>
                &nbsp;→ Incoming Webhooks → Activate.
              </p>
            </div>
          </div>

          {/* Notification Settings Card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-card-foreground m-0">Notification Settings</h2>
              {/* Master enable toggle */}
              <button
                onClick={() => setConfig(prev => ({ ...prev, slackEnabled: !prev.slackEnabled }))}
                className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 focus:outline-none ${config.slackEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                aria-label="Toggle Slack notifications"
                style={{ height: '22px', width: '40px' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform"
                  style={{
                    transform: config.slackEnabled ? 'translateX(18px)' : 'translateX(0)',
                    width: '18px',
                    height: '18px',
                  }}
                />
              </button>
            </div>

            <div className={`divide-y divide-border transition-opacity ${config.slackEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {/* Notify on fail */}
              <div className="flex items-start justify-between px-5 py-4 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BellRing size={15} className="text-rose-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground m-0">Notify on test failure</p>
                    <p className="text-xs text-muted-foreground mt-0.5 m-0">Get alerted immediately when a test run has failures or SLO breaches.</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, slackNotifyOnFail: !prev.slackNotifyOnFail }))}
                  className={`relative shrink-0 rounded-full transition-colors focus:outline-none ${config.slackNotifyOnFail ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  style={{ height: '22px', width: '40px', marginTop: '2px' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform"
                    style={{
                      width: '18px',
                      height: '18px',
                      transform: config.slackNotifyOnFail ? 'translateX(18px)' : 'translateX(0)',
                    }}
                  />
                </button>
              </div>

              {/* Notify on pass */}
              <div className="flex items-start justify-between px-5 py-4 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BellOff size={15} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground m-0">Notify on test success</p>
                    <p className="text-xs text-muted-foreground mt-0.5 m-0">Also send a notification when all tests pass successfully.</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, slackNotifyOnPass: !prev.slackNotifyOnPass }))}
                  className={`relative shrink-0 rounded-full transition-colors focus:outline-none ${config.slackNotifyOnPass ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  style={{ height: '22px', width: '40px', marginTop: '2px' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform"
                    style={{
                      width: '18px',
                      height: '18px',
                      transform: config.slackNotifyOnPass ? 'translateX(18px)' : 'translateX(0)',
                    }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            {/* Test notification */}
            <button
              onClick={sendTest}
              disabled={!isConnected || testStatus === 'sending'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testStatus === 'sending' ? <Loader2 size={15} className="animate-spin" /> :
               testStatus === 'ok'      ? <CheckCircle2 size={15} className="text-emerald-500" /> :
               testStatus === 'fail'    ? <XCircle size={15} className="text-rose-500" /> :
               <Send size={15} />}
              {testStatus === 'sending' ? 'Sending...' :
               testStatus === 'ok'      ? 'Message Sent!' :
               testStatus === 'fail'    ? 'Send Failed' :
               'Send Test Message'}
            </button>

            {/* Save */}
            <button
              onClick={save}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-60 ml-auto"
            >
              {saveStatus === 'saving' ? <Loader2 size={15} className="animate-spin" /> :
               saveStatus === 'saved'  ? <CheckCircle2 size={15} /> :
               saveStatus === 'error'  ? <XCircle size={15} /> :
               <Save size={15} />}
              {saveStatus === 'saving' ? 'Saving...' :
               saveStatus === 'saved'  ? 'Saved!' :
               saveStatus === 'error'  ? 'Save Failed' :
               'Save Settings'}
            </button>
          </div>

          {/* Test error feedback */}
          {testError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
              <XCircle size={15} className="shrink-0" />
              <span>{testError}</span>
            </div>
          )}

          {/* How to get a webhook URL guide */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-card-foreground m-0 mb-3 flex items-center gap-2">
              <Info size={14} className="text-blue-500" /> How to set up a Slack Webhook
            </h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground flex flex-col gap-2 m-0 pl-1">
              <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" className="text-primary hover:underline">api.slack.com/apps</a> and click <strong className="text-foreground">Create New App</strong>.</li>
              <li>Choose <strong className="text-foreground">From scratch</strong>, name it (e.g. "SpriteStack"), and select your workspace.</li>
              <li>Under <strong className="text-foreground">Features</strong>, choose <strong className="text-foreground">Incoming Webhooks</strong> and toggle it on.</li>
              <li>Click <strong className="text-foreground">Add New Webhook to Workspace</strong> and pick a channel.</li>
              <li>Copy the webhook URL and paste it above.</li>
            </ol>
          </div>

        </div>
      </main>
    </>
  );
}
