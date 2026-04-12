'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  FlaskConical,
  LayoutDashboard,
  TrendingUp,
  GitCompare,
  FileText,
  Video,
  Settings,
  ExternalLink,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Activity,
  Clock,
  BarChart3,
  Shield,
  ChevronRight,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { cn, formatDuration, formatPercent } from '@/lib/utils';

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

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isPassed = status === 'passed';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      isPassed
        ? 'bg-green-500/15 text-green-400 border border-green-500/20'
        : 'bg-red-500/15 text-red-400 border border-red-500/20'
    )}>
      {isPassed
        ? <CheckCircle2 className="w-3 h-3" />
        : <XCircle className="w-3 h-3" />}
      {isPassed ? 'PASS' : 'FAIL'}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    all: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    functional: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    load: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    'bulk-prompt': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  };
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      colors[type] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'
    )}>
      {type}
    </span>
  );
}

function MetricCard({
  icon: Icon, label, value, sub, color, trend, trendValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  const trendIcon = trend === 'up'
    ? <ArrowUpRight className="w-3 h-3 text-green-400" />
    : trend === 'down'
    ? <ArrowDownRight className="w-3 h-3 text-red-400" />
    : <Minus className="w-3 h-3 text-zinc-500" />;

  return (
    <div className="group relative rounded-xl border border-white/5 bg-white/[0.03] p-5 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-200">
      {/* Glow */}
      <div className={cn('absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300', `bg-gradient-to-br ${color} blur-xl -z-10`)} />

      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', `bg-gradient-to-br ${color}`)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {trend && trendValue && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-500'
          )}>
            {trendIcon}
            {trendValue}
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-zinc-600 mt-1">{sub}</div>}
    </div>
  );
}

function CoverageBar({ value, className }: { value: number; className?: string }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 min-w-[48px]">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-zinc-400 w-10 text-right">{formatPercent(value)}</span>
    </div>
  );
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: FlaskConical, label: 'Test Runs', active: false },
  { icon: TrendingUp, label: 'Trends', active: false },
  { icon: GitCompare, label: 'Compare', active: false },
  { icon: FileText, label: 'Reports', active: false },
  { icon: Video, label: 'Replays', active: false },
];

const customTooltipStyle = {
  backgroundColor: 'hsl(222 40% 9%)',
  border: '1px solid hsl(222 35% 16%)',
  borderRadius: '10px',
  color: 'hsl(210 40% 85%)',
  fontSize: '12px',
};

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sidebarOpen] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    fetch('/api/runs')
      .then(r => r.json())
      .then(data => {
        setRuns(data.runs || []);
        setStats(data.stats || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const round1 = [...runs].sort((a, b) => a.id - b.id).find(r => r.round === 1);
  const round2 = [...runs].sort((a, b) => a.id - b.id).find(r => r.round === 2);
  const hasComparison = !!(round1 && round2);

  const r1Rate = round1 && round1.total_tests > 0
    ? (round1.passed_tests / round1.total_tests) * 100 : 0;
  const r2Rate = round2 && round2.total_tests > 0
    ? (round2.passed_tests / round2.total_tests) * 100 : 0;
  const improvement = hasComparison ? (r2Rate - r1Rate) : 0;

  // Trend data
  const trendData = [...runs]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(r => ({
      label: `R${r.round} ${format(parseISO(r.created_at), 'HH:mm')}`,
      passRate: r.total_tests > 0 ? Math.round((r.passed_tests / r.total_tests) * 100) : 0,
      coverage: Math.round(r.coverage_percent),
    }));

  const comparisonData = hasComparison ? [
    {
      name: 'Pass Rate %',
      'Round 1': Math.round(r1Rate),
      'Round 2': Math.round(r2Rate),
    },
    {
      name: 'Coverage %',
      'Round 1': Math.round(round1.coverage_percent),
      'Round 2': Math.round(round2.coverage_percent),
    },
    {
      name: 'Tests Passed',
      'Round 1': round1.passed_tests,
      'Round 2': round2.passed_tests,
    },
  ] : [];

  const filteredRuns = activeTab === 'all' ? runs : runs.filter(r => r.test_type === activeTab);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(222_47%_5%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            <FlaskConical className="absolute inset-0 m-auto w-5 h-5 text-violet-400" />
          </div>
          <p className="text-sm text-zinc-500">Loading SpriteStack data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[hsl(222_47%_5%)] text-white overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={cn(
        'flex flex-col border-r border-white/5 bg-white/[0.02] transition-all duration-300',
        sidebarOpen ? 'w-58' : 'w-16'
      )} style={{ width: sidebarOpen ? 232 : 64, flexShrink: 0 }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">SpriteStack</div>
              <div className="text-[10px] text-zinc-500 truncate">TestOps Ecosystem</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-2 mb-2">
            {sidebarOpen && <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Overview</p>}
          </div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              className={cn(
                'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-150',
                item.active
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              {sidebarOpen && item.active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
            </button>
          ))}

          <div className="px-2 mt-4 mb-2">
            {sidebarOpen && <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Settings</p>}
          </div>
          <button className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-150">
            <Settings className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <a
            href="https://testsprite.com"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-150"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>TestSprite</span>}
          </a>
        </nav>

        {/* MCP Status */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-2.5 py-2',
            'bg-green-500/10 border border-green-500/20'
          )}>
            <Wifi className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="text-xs font-medium text-green-400">MCP Connected</div>
                <div className="text-[10px] text-zinc-500">TestSprite active</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
          <div>
            <h1 className="text-lg font-semibold text-white">TestOps Dashboard</h1>
            <p className="text-xs text-zinc-500">Powered by TestSprite MCP • Real-time testing insights</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 transition-all shadow-lg shadow-blue-500/20">
              <Play className="w-3.5 h-3.5" />
              Run Tests
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">

            {/* Improvement Banner */}
            {hasComparison && improvement > 0 && (
              <div className="relative overflow-hidden rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5" />
                <div className="relative flex items-center gap-3">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-green-500/20">
                    <Zap className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-400">
                      +{improvement.toFixed(1)}% improvement from Round 1 → Round 2
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      TestSprite MCP detected real bugs in Round 1. After fixes, Round 2 shows significant coverage and pass rate gains.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricCard
                icon={Activity}
                label="Total Runs"
                value={stats?.total_runs ?? 0}
                color="from-blue-500/30 to-blue-600/20"
              />
              <MetricCard
                icon={CheckCircle2}
                label="Tests Passed"
                value={stats?.total_passed ?? 0}
                sub={`of ${stats?.total_tests ?? 0} total`}
                color="from-green-500/30 to-green-600/20"
                trend="up"
                trendValue={stats?.total_tests ? `${((stats.total_passed / stats.total_tests) * 100).toFixed(0)}%` : undefined}
              />
              <MetricCard
                icon={XCircle}
                label="Tests Failed"
                value={stats?.total_failed ?? 0}
                color="from-red-500/30 to-red-600/20"
                trend={hasComparison && round2 && round1 && round2.failed_tests < round1.failed_tests ? 'down' : 'neutral'}
                trendValue={hasComparison && round2 && round1 ? `${round1.failed_tests - round2.failed_tests} fixed` : undefined}
              />
              <MetricCard
                icon={Shield}
                label="Avg Coverage"
                value={stats ? `${stats.avg_coverage.toFixed(1)}%` : '—'}
                color="from-violet-500/30 to-violet-600/20"
                trend={hasComparison && round2 && round1 && round2.coverage_percent > round1.coverage_percent ? 'up' : 'neutral'}
                trendValue={hasComparison && round2 && round1 ? `+${(round2.coverage_percent - round1.coverage_percent).toFixed(1)}%` : undefined}
              />
              <MetricCard
                icon={Clock}
                label="Avg Duration"
                value={stats ? formatDuration(stats.avg_duration) : '—'}
                color="from-cyan-500/30 to-cyan-600/20"
              />
            </div>

            {/* Round Comparison */}
            {hasComparison && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-violet-400" />
                    <h2 className="text-sm font-semibold text-white">Round 1 → Round 2 Comparison</h2>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 font-medium">
                    MCP Improvement
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  {[
                    {
                      label: 'Pass Rate',
                      r1: `${r1Rate.toFixed(1)}%`,
                      r2: `${r2Rate.toFixed(1)}%`,
                      better: r2Rate >= r1Rate,
                      delta: `${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}%`,
                    },
                    {
                      label: 'Coverage',
                      r1: `${round1.coverage_percent.toFixed(1)}%`,
                      r2: `${round2.coverage_percent.toFixed(1)}%`,
                      better: round2.coverage_percent >= round1.coverage_percent,
                      delta: `${round2.coverage_percent >= round1.coverage_percent ? '+' : ''}${(round2.coverage_percent - round1.coverage_percent).toFixed(1)}%`,
                    },
                    {
                      label: 'Tests Passed',
                      r1: String(round1.passed_tests),
                      r2: String(round2.passed_tests),
                      better: round2.passed_tests >= round1.passed_tests,
                      delta: `+${round2.passed_tests - round1.passed_tests}`,
                    },
                    {
                      label: 'Issues Found',
                      r1: String(round1.failed_tests),
                      r2: String(round2.failed_tests),
                      better: round2.failed_tests <= round1.failed_tests,
                      delta: `${round2.failed_tests <= round1.failed_tests ? '-' : '+'}${Math.abs(round2.failed_tests - round1.failed_tests)}`,
                    },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{item.label}</div>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-base font-semibold text-zinc-500">{item.r1}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-600" />
                        <span className={cn('text-lg font-bold', item.better ? 'text-green-400' : 'text-red-400')}>{item.r2}</span>
                      </div>
                      <div className={cn(
                        'inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        item.better ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                      )}>
                        {item.delta}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bar chart */}
                <div className="h-44 -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} barCategoryGap="35%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" stroke="transparent" tick={{ fill: '#71717a', fontSize: 11 }} />
                      <YAxis stroke="transparent" tick={{ fill: '#71717a', fontSize: 11 }} />
                      <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#71717a' }} />
                      <Bar dataKey="Round 1" fill="rgba(113,113,122,0.4)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Round 2" fill="rgba(99,102,241,0.8)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Trends Chart */}
            {trendData.length > 1 && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-white">Pass Rate & Coverage Trends</h2>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="covGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="label" stroke="transparent" tick={{ fill: '#71717a', fontSize: 11 }} />
                      <YAxis stroke="transparent" tick={{ fill: '#71717a', fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip contentStyle={customTooltipStyle} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#71717a' }} />
                      <Area type="monotone" dataKey="passRate" name="Pass Rate %" stroke="#6366f1" fill="url(#passGrad)" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                      <Area type="monotone" dataKey="coverage" name="Coverage %" stroke="#22c55e" fill="url(#covGrad)" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Run History Table */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-sm font-semibold text-white">Test Run History</h2>
                </div>
                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
                  {(['all', 'functional', 'load', 'bulk-prompt'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium transition-all',
                        activeTab === tab
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Round', 'Type', 'Status', 'Tests', 'Pass Rate', 'Coverage', 'Issues', 'Duration', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRuns.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-zinc-500 text-sm">
                          <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          No runs yet. Run <code className="text-blue-400 font-mono text-xs">spritestack run</code> to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredRuns.map((run, i) => {
                        const passRate = run.total_tests > 0
                          ? ((run.passed_tests / run.total_tests) * 100)
                          : 0;
                        return (
                          <tr
                            key={run.id}
                            className={cn(
                              'border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors',
                              i === filteredRuns.length - 1 && 'border-b-0'
                            )}
                          >
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/20">
                                R{run.round}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <TypeBadge type={run.test_type} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={run.status} />
                            </td>
                            <td className="px-4 py-3 text-zinc-400 tabular-nums text-xs">{run.total_tests}</td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                'tabular-nums text-xs font-semibold',
                                passRate >= 80 ? 'text-green-400' : passRate >= 60 ? 'text-yellow-400' : 'text-red-400'
                              )}>
                                {passRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 min-w-[120px]">
                              <CoverageBar value={run.coverage_percent} />
                            </td>
                            <td className="px-4 py-3">
                              {run.failed_tests > 0 ? (
                                <div className="flex items-center gap-1 text-xs text-red-400">
                                  <AlertTriangle className="w-3 h-3" />
                                  {run.failed_tests}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-xs text-green-400">
                                  <CheckCircle2 className="w-3 h-3" />
                                  0
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-zinc-500 tabular-nums text-xs whitespace-nowrap">
                              {formatDuration(run.duration_ms)}
                            </td>
                            <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                              {format(parseISO(run.created_at), 'MMM d, HH:mm')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
