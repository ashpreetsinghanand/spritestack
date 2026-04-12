'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  GitCompare, TrendingUp, RefreshCw, Play,
  CheckCircle2, XCircle, AlertTriangle, Zap, Activity, Clock,
  BarChart3, Shield, ChevronRight, ArrowUpRight,
} from 'lucide-react';

interface TestRun {
  id: number;
  run_id: string;
  project_name: string;
  round: number;
  test_type: string;
  status: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  coverage_percent: number;
  duration_ms: number;
  created_at: string;
}

interface Stats {
  total_runs: number;
  total_tests: number;
  total_passed: number;
  total_failed: number;
  avg_coverage: number;
  avg_duration: number;
}

function fmtDur(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export default function Dashboard() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/runs').then(r => r.json()).then(d => {
      setRuns(d.runs || []);
      setStats(d.stats || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = [...runs].sort((a, b) => a.id - b.id);
  const r1 = sorted.find(r => r.round === 1);
  const r2 = sorted.find(r => r.round === 2);
  const r1Rate = r1 && r1.total_tests > 0 ? (r1.passed_tests / r1.total_tests) * 100 : 0;
  const r2Rate = r2 && r2.total_tests > 0 ? (r2.passed_tests / r2.total_tests) * 100 : 0;
  const improvement = r1 && r2 ? r2Rate - r1Rate : 0;

  const trendData = sorted.map(r => ({
    label: `R${r.round}`,
    passRate: r.total_tests > 0 ? Math.round((r.passed_tests / r.total_tests) * 100) : 0,
    coverage: Math.round(r.coverage_percent),
  }));

  const cmpData = r1 && r2 ? [
    { name: 'Pass Rate %', 'Round 1': Math.round(r1Rate), 'Round 2': Math.round(r2Rate) },
    { name: 'Coverage %', 'Round 1': Math.round(r1.coverage_percent), 'Round 2': Math.round(r2.coverage_percent) },
    { name: 'Passed', 'Round 1': r1.passed_tests, 'Round 2': r2.passed_tests },
  ] : [];

  const filtered = tab === 'all' ? runs : runs.filter(r => r.test_type === tab);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full bg-background gap-4">
      <div className="w-9 h-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <p className="text-muted-foreground text-sm">Loading SpriteStack…</p>
    </div>
  );

  const metricCards = [
    { icon: Activity, label: 'Total Runs', value: stats?.total_runs ?? 0, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    {
      icon: CheckCircle2, label: 'Tests Passed', value: stats?.total_passed ?? 0,
      sub: `of ${stats?.total_tests ?? 0} total`, color: 'text-emerald-500', bg: 'bg-emerald-500/10',
      badge: stats?.total_tests ? `${((stats.total_passed / stats.total_tests) * 100).toFixed(0)}%` : null,
    },
    { icon: XCircle, label: 'Tests Failed', value: stats?.total_failed ?? 0, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    {
      icon: Shield, label: 'Avg Coverage', value: stats ? `${stats.avg_coverage.toFixed(1)}%` : '—',
      color: 'text-purple-500', bg: 'bg-purple-500/10',
      badge: r1 && r2 ? `+${(r2.coverage_percent - r1.coverage_percent).toFixed(1)}%` : null,
    },
    { icon: Clock, label: 'Avg Duration', value: stats ? fmtDur(stats.avg_duration) : '—', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ];

  const cmpItems = r1 && r2 ? [
    { label: 'Pass Rate', r1v: `${r1Rate.toFixed(1)}%`, r2v: `${r2Rate.toFixed(1)}%`, better: r2Rate >= r1Rate, delta: `${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}%` },
    { label: 'Coverage', r1v: `${r1.coverage_percent.toFixed(1)}%`, r2v: `${r2.coverage_percent.toFixed(1)}%`, better: r2.coverage_percent >= r1.coverage_percent, delta: `${r2.coverage_percent >= r1.coverage_percent ? '+' : ''}${(r2.coverage_percent - r1.coverage_percent).toFixed(1)}%` },
    { label: 'Tests Passed', r1v: String(r1.passed_tests), r2v: String(r2.passed_tests), better: r2.passed_tests >= r1.passed_tests, delta: `+${r2.passed_tests - r1.passed_tests}` },
    { label: 'Issues Found', r1v: String(r1.failed_tests), r2v: String(r2.failed_tests), better: r2.failed_tests <= r1.failed_tests, delta: `${r2.failed_tests <= r1.failed_tests ? '-' : '+'}${Math.abs(r2.failed_tests - r1.failed_tests)}` },
  ] : [];

  const tabs = ['all', 'functional', 'load', 'bulk-prompt'];
  const tableHeaders = ['Round', 'Type', 'Status', 'Total', 'Pass Rate', 'Coverage', 'Issues', 'Duration', 'Date'];

  return (
    <>
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between py-4 px-6 border-b border-border bg-card">
        <div>
          <h1 className="text-lg font-bold text-card-foreground mb-0.5">TestOps Dashboard</h1>
          <p className="text-xs text-muted-foreground m-0">Powered by TestSprite MCP • Real-time testing insights</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground bg-muted/50 border border-border hover:bg-muted cursor-pointer transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 border-none shadow-md cursor-pointer hover:opacity-90">
            <Play size={13} /> Run Tests
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto p-5 md:p-6 flex flex-col gap-5">

        {/* Improvement Banner */}
        {r1 && r2 && improvement > 0 && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-500 m-0">
                +{improvement.toFixed(1)}% improvement from Round 1 → Round 2
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-0">
                TestSprite MCP detected real bugs in Round 1. After fixes, Round 2 shows significant gains.
              </p>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-5 gap-3">
          {metricCards.map(card => (
            <div key={card.label} className="bg-card border border-border rounded-xl p-4 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg} ${card.color}`}>
                  <card.icon size={16} />
                </div>
                {card.badge && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${card.bg} ${card.color}`}>
                    <ArrowUpRight size={10} />{card.badge}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-card-foreground leading-none">{card.value}</div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1.5">{card.label}</div>
              {card.sub && <div className="text-[11px] text-muted-foreground opacity-80 mt-0.5">{card.sub}</div>}
            </div>
          ))}
        </div>

        {/* Round Comparison */}
        {r1 && r2 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitCompare size={15} className="text-purple-500" />
                <span className="text-sm font-semibold text-card-foreground">Round 1 → Round 2 Comparison</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                MCP Improvement
              </span>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-4 gap-2.5">
              {cmpItems.map(item => (
                <div key={item.label} className="bg-background border border-border rounded-lg p-3 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2.5">{item.label}</div>
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <span className="text-base font-semibold text-muted-foreground">{item.r1v}</span>
                    <ChevronRight size={13} className="text-muted-foreground opacity-50" />
                    <span className={`text-xl font-bold ${item.better ? 'text-emerald-500' : 'text-rose-500'}`}>{item.r2v}</span>
                  </div>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${item.better ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-rose-500/10 text-rose-600 dark:text-rose-500'}`}>
                    {item.delta}
                  </span>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="h-44 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cmpData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="transparent" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                  <YAxis stroke="transparent" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                  <Tooltip cursor={{ fill: 'var(--color-muted)' }} contentStyle={{ backgroundColor: 'var(--color-popover)', borderColor: 'var(--color-border)', borderRadius: 8, color: 'var(--color-foreground)', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-muted-foreground)' }} />
                  <Bar dataKey="Round 1" fill="#64748b" fillOpacity={0.4} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Round 2" fill="#6366f1" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trend Chart */}
        {trendData.length > 1 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-indigo-500" />
              <span className="text-sm font-semibold text-card-foreground">Pass Rate & Coverage Trends</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" stroke="transparent" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                  <YAxis stroke="transparent" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-popover)', borderColor: 'var(--color-border)', borderRadius: 8, color: 'var(--color-foreground)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-muted-foreground)' }} />
                  <Area type="monotone" dataKey="passRate" name="Pass Rate %" stroke="#6366f1" fill="url(#g1)" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                  <Area type="monotone" dataKey="coverage" name="Coverage %" stroke="#10b981" fill="url(#g2)" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Run History */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={15} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-card-foreground">Test Run History</span>
            </div>
            <div className="flex gap-0.5 p-0.5 bg-muted rounded-lg">
              {tabs.map(t => (
                <button 
                  key={t} 
                  onClick={() => setTab(t)} 
                  className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    t === tab ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {tableHeaders.map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="p-10 text-center text-muted-foreground text-sm">
                    No runs yet. Run <code className="text-primary font-mono bg-muted px-1.5 py-0.5 rounded">spritestack run</code> to start.
                  </td></tr>
                ) : filtered.map((run, i) => {
                  const pr = run.total_tests > 0 ? (run.passed_tests / run.total_tests) * 100 : 0;
                  const prColor = pr >= 80 ? 'text-emerald-500' : pr >= 60 ? 'text-amber-500' : 'text-rose-500';
                  const cov = run.coverage_percent;
                  const covBg = cov >= 80 ? 'bg-emerald-500' : cov >= 60 ? 'bg-amber-500' : 'bg-rose-500';
                  const isLast = i === filtered.length - 1;
                  return (
                    <tr key={run.id} className={isLast ? '' : 'border-b border-border'}>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          R{run.round}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <TypeChip type={run.test_type} />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <StatusChip status={run.status} />
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{run.total_tests}</td>
                      <td className={`px-3 py-2.5 font-semibold tabular-nums ${prColor}`}>{pr.toFixed(1)}%</td>
                      <td className="px-3 py-2.5 min-w-[130px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${covBg}`} style={{ width: `${Math.min(cov, 100)}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground min-w-[38px] text-right">{cov.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {run.failed_tests > 0
                          ? <span className="flex items-center gap-1 text-rose-500 text-xs"><AlertTriangle size={12} />{run.failed_tests}</span>
                          : <span className="flex items-center gap-1 text-emerald-500 text-xs"><CheckCircle2 size={12} />0</span>
                        }
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs tabular-nums">{fmtDur(run.duration_ms)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">{format(parseISO(run.created_at), 'MMM d, HH:mm')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground">
          SpriteStack v0.1.0 · Powered by{' '}
          <a href="https://testsprite.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">TestSprite MCP</a>
        </div>
      </main>
    </>
  );
}

function StatusChip({ status }: { status: string }) {
  const ok = status === 'passed';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-500/20'}`}>
      {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {ok ? 'PASS' : 'FAIL'}
    </span>
  );
}

function TypeChip({ type }: { type: string }) {
  const map: Record<string, string> = {
    all: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    functional: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    load: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    'bulk-prompt': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  };
  const cls = map[type] || 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {type}
    </span>
  );
}
