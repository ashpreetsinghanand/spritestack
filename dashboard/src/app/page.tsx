'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  FlaskConical, LayoutDashboard, TrendingUp, GitCompare,
  FileText, Video, Settings, ExternalLink, RefreshCw, Play,
  CheckCircle2, XCircle, AlertTriangle, Zap, Activity, Clock,
  BarChart3, Shield, ChevronRight, Wifi, ArrowUpRight, Download, File,
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

const tooltipStyle = {
  backgroundColor: '#161b27',
  border: '1px solid #1e2538',
  borderRadius: 10,
  color: '#cbd5e1',
  fontSize: 12,
};

export default function Dashboard() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [activeSection, setActiveSection] = useState('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

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
    <div style={S.loading}>
      <div style={S.spinner} />
      <p style={{ color: '#64748b', fontSize: 14 }}>Loading SpriteStack…</p>
    </div>
  );

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'overview' },
    { icon: GitCompare, label: 'Compare', id: 'compare' },
    { icon: TrendingUp, label: 'Trends', id: 'trends' },
    { icon: FileText, label: 'Reports', id: 'artifacts' },
    { icon: FlaskConical, label: 'Test Runs', id: 'history' },
  ];

  const mockArtifacts = [
    { name: 'Round 2 Functional Replay', type: 'video/mp4', icon: Video, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', date: 'Today, 14:32' },
    { name: 'Round 1 Final HTML Report', type: 'text/html', icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', date: 'Today, 14:15' },
    { name: 'TestOps Exec Summary', type: 'application/pdf', icon: File, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', date: 'Yesterday, 09:00' },
  ];

  const metricCards = [
    { icon: Activity, label: 'Total Runs', value: stats?.total_runs ?? 0, color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    {
      icon: CheckCircle2, label: 'Tests Passed', value: stats?.total_passed ?? 0,
      sub: `of ${stats?.total_tests ?? 0} total`, color: '#22c55e', bg: 'rgba(34,197,94,0.12)',
      badge: stats?.total_tests ? `${((stats.total_passed / stats.total_tests) * 100).toFixed(0)}%` : null,
    },
    { icon: XCircle, label: 'Tests Failed', value: stats?.total_failed ?? 0, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    {
      icon: Shield, label: 'Avg Coverage', value: stats ? `${stats.avg_coverage.toFixed(1)}%` : '—',
      color: '#a855f7', bg: 'rgba(168,85,247,0.12)',
      badge: r1 && r2 ? `+${(r2.coverage_percent - r1.coverage_percent).toFixed(1)}%` : null,
    },
    { icon: Clock, label: 'Avg Duration', value: stats ? fmtDur(stats.avg_duration) : '—', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
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
    <div style={S.root}>
      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoIcon}>
            <FlaskConical size={16} color="white" />
          </div>
          <div>
            <div style={S.logoText}>SpriteStack</div>
            <div style={S.logoSub}>TestOps Ecosystem</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={S.nav}>
          <p style={S.navSection}>OVERVIEW</p>
          {navItems.map(item => (
            <button key={item.label} onClick={() => scrollTo(item.id)} style={activeSection === item.id ? S.navItemActive : S.navItem}>
              <item.icon size={15} />
              <span>{item.label}</span>
              {activeSection === item.id && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
            </button>
          ))}
          <p style={{ ...S.navSection, marginTop: 20 }}>SETTINGS</p>
          <button style={S.navItem} onClick={() => setIsSettingsOpen(true)}>
            <Settings size={15} /><span>Settings</span>
          </button>
          <a href="https://testsprite.com" target="_blank" rel="noreferrer" style={{ ...S.navItem, textDecoration: 'none' }}>
            <ExternalLink size={15} /><span>TestSprite</span>
          </a>
        </nav>

        {/* MCP Badge */}
        <div style={S.mcpBadge}>
          <div style={S.mcpDot} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#22c55e' }}>MCP Connected</div>
            <div style={{ fontSize: 10, color: '#475569' }}>TestSprite active</div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={S.main}>
        {/* Header */}
        <header style={S.header}>
          <div>
            <h1 style={S.headerTitle}>TestOps Dashboard</h1>
            <p style={S.headerSub}>Powered by TestSprite MCP • Real-time testing insights</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load} style={S.btnSecondary}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button style={S.btnPrimary}>
              <Play size={13} /> Run Tests
            </button>
          </div>
        </header>

        {/* Body */}
        <main style={S.body}>

          {/* Improvement Banner */}
          {r1 && r2 && improvement > 0 && (
            <div style={S.banner}>
              <div style={S.bannerIcon}><Zap size={18} color="#22c55e" /></div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', margin: 0 }}>
                  +{improvement.toFixed(1)}% improvement from Round 1 → Round 2
                </p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                  TestSprite MCP detected real bugs in Round 1. After fixes, Round 2 shows significant gains.
                </p>
              </div>
            </div>
          )}

          {/* Metric Cards */}
          <div id="overview" style={S.grid5}>
            {metricCards.map(card => (
              <div key={card.label} style={S.metricCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ ...S.metricIconBox, background: card.bg, color: card.color }}>
                    <card.icon size={16} />
                  </div>
                  {card.badge && (
                    <span style={{ ...S.badge, background: card.bg, color: card.color, border: `1px solid ${card.color}33` }}>
                      <ArrowUpRight size={10} />{card.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{card.label}</div>
                {card.sub && <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{card.sub}</div>}
              </div>
            ))}
          </div>

          {/* Round Comparison */}
          {r1 && r2 && (
            <div id="compare" style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GitCompare size={15} color="#a855f7" />
                  <span style={S.cardTitle}>Round 1 → Round 2 Comparison</span>
                </div>
                <span style={{ ...S.badge, background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                  MCP Improvement
                </span>
              </div>

              {/* Comparison Cards */}
              <div style={S.grid4}>
                {cmpItems.map(item => (
                  <div key={item.label} style={S.cmpCard}>
                    <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{item.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#475569' }}>{item.r1v}</span>
                      <ChevronRight size={13} color="#334155" />
                      <span style={{ fontSize: 20, fontWeight: 700, color: item.better ? '#22c55e' : '#ef4444' }}>{item.r2v}</span>
                    </div>
                    <span style={{
                      display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: item.better ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: item.better ? '#22c55e' : '#ef4444',
                    }}>{item.delta}</span>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div style={{ height: 180, marginTop: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cmpData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" stroke="transparent" tick={{ fill: '#475569', fontSize: 11 }} />
                    <YAxis stroke="transparent" tick={{ fill: '#475569', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                    <Bar dataKey="Round 1" fill="rgba(100,116,139,0.4)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Round 2" fill="rgba(99,102,241,0.85)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Trend Chart */}
          {trendData.length > 1 && (
            <div id="trends" style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <TrendingUp size={15} color="#6366f1" />
                <span style={S.cardTitle}>Pass Rate & Coverage Trends</span>
              </div>
              <div style={{ height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="label" stroke="transparent" tick={{ fill: '#475569', fontSize: 12 }} />
                    <YAxis stroke="transparent" tick={{ fill: '#475569', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                    <Area type="monotone" dataKey="passRate" name="Pass Rate %" stroke="#6366f1" fill="url(#g1)" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                    <Area type="monotone" dataKey="coverage" name="Coverage %" stroke="#22c55e" fill="url(#g2)" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Artifacts & Reports */}
          <div id="artifacts" style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FileText size={15} color="#ec4899" />
              <span style={S.cardTitle}>Reports, Videos & Artifacts</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {mockArtifacts.map((art, idx) => (
                <div key={idx} style={{ background: '#080b12', border: '1px solid #0f1520', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: art.bg, color: art.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <art.icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}>{art.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{art.type} • {art.date}</div>
                    </div>
                  </div>
                  <button style={{ ...S.btnSecondary, justifyContent: 'center', width: '100%', marginTop: 'auto' }}>
                    <Download size={13} /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Run History */}
          <div id="history" style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={15} color="#64748b" />
                <span style={S.cardTitle}>Test Run History</span>
              </div>
              {/* Tabs */}
              <div style={S.tabRow}>
                {tabs.map(t => (
                  <button key={t} onClick={() => setTab(t)} style={t === tab ? S.tabActive : S.tab}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {tableHeaders.map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#334155', fontSize: 13 }}>
                      No runs yet. Run <code style={{ color: '#6366f1', fontFamily: 'monospace' }}>spritestack run</code> to start.
                    </td></tr>
                  ) : filtered.map((run, i) => {
                    const pr = run.total_tests > 0 ? (run.passed_tests / run.total_tests) * 100 : 0;
                    const prColor = pr >= 80 ? '#22c55e' : pr >= 60 ? '#f59e0b' : '#ef4444';
                    const cov = run.coverage_percent;
                    const covColor = cov >= 80 ? '#22c55e' : cov >= 60 ? '#f59e0b' : '#ef4444';
                    const isLast = i === filtered.length - 1;
                    return (
                      <tr key={run.id} style={{ borderBottom: isLast ? 'none' : '1px solid #0f1520' }}>
                        <td style={S.td}>
                          <span style={{ ...S.roundBadge }}>R{run.round}</span>
                        </td>
                        <td style={S.td}>
                          <TypeChip type={run.test_type} />
                        </td>
                        <td style={S.td}>
                          <StatusChip status={run.status} />
                        </td>
                        <td style={{ ...S.td, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{run.total_tests}</td>
                        <td style={{ ...S.td, color: prColor, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{pr.toFixed(1)}%</td>
                        <td style={{ ...S.td, minWidth: 130 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', minWidth: 50, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(cov, 100)}%`, background: covColor, borderRadius: 99, transition: 'width .3s' }} />
                            </div>
                            <span style={{ fontSize: 12, color: '#64748b', minWidth: 38, textAlign: 'right' }}>{cov.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={S.td}>
                          {run.failed_tests > 0
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 12 }}><AlertTriangle size={12} />{run.failed_tests}</span>
                            : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22c55e', fontSize: 12 }}><CheckCircle2 size={12} />0</span>
                          }
                        </td>
                        <td style={{ ...S.td, color: '#475569', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{fmtDur(run.duration_ms)}</td>
                        <td style={{ ...S.td, color: '#475569', fontSize: 12 }}>{format(parseISO(run.created_at), 'MMM d, HH:mm')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '16px 0 32px', color: '#334155', fontSize: 12 }}>
            SpriteStack v0.1.0 · Powered by{' '}
            <a href="https://testsprite.com" target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>TestSprite MCP</a>
            {' '}·{' '}
            <a href="https://npmjs.com/package/spritestack" target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>npm</a>
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div style={S.modalOverlay}>
          <div style={S.modalContent}>
            <div style={S.modalHeader}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9', margin: 0 }}>Dashboard Settings</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div style={S.modalBody}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} color="#6366f1" /> Slack Integration
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
                Configure a Slack Webhook URL to receive real-time alerts when SLOs are breached or critical functional tests fail during a test run.
              </p>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#cbd5e1', marginBottom: 8 }}>Slack Webhook URL</label>
                <input 
                  type="text" 
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  style={S.input}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button onClick={() => setIsSettingsOpen(false)} style={S.btnSecondary}>Cancel</button>
                <button 
                  onClick={() => {
                    setIsSaving(true);
                    setTimeout(() => { setIsSaving(false); setIsSettingsOpen(false); }, 600);
                  }}
                  style={S.btnPrimary}
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chip components ──────────────────────────────────────────────────────────
function StatusChip({ status }: { status: string }) {
  const ok = status === 'passed';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: ok ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)',
      color: ok ? '#22c55e' : '#ef4444',
      border: ok ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)',
    }}>
      {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {ok ? 'PASS' : 'FAIL'}
    </span>
  );
}

function TypeChip({ type }: { type: string }) {
  const map: Record<string, [string, string]> = {
    all: ['rgba(139,92,246,0.15)', '#8b5cf6'],
    functional: ['rgba(59,130,246,0.15)', '#3b82f6'],
    load: ['rgba(249,115,22,0.15)', '#f97316'],
    'bulk-prompt': ['rgba(6,182,212,0.15)', '#06b6d4'],
  };
  const [bg, color] = map[type] || ['rgba(100,116,139,0.15)', '#64748b'];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500,
      background: bg, color, border: `1px solid ${color}33`,
    }}>{type}</span>
  );
}

// ── Style constants ──────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100vh',
    background: '#080b12',
    color: '#e2e8f0',
    fontFamily: "'Inter', system-ui, sans-serif",
    overflow: 'hidden',
  },
  // Sidebar
  sidebar: {
    width: 228,
    flexShrink: 0,
    background: '#0d1018',
    borderRight: '1px solid #0f1520',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '18px 16px',
    borderBottom: '1px solid #0f1520',
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
  },
  logoText: { fontSize: 14, fontWeight: 700, color: '#f1f5f9' },
  logoSub: { fontSize: 10, color: '#475569' },
  nav: { flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 },
  navSection: { fontSize: 10, fontWeight: 600, color: '#334155', letterSpacing: '0.08em', padding: '4px 8px', margin: 0 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
    borderRadius: 8, fontSize: 13, color: '#64748b', background: 'transparent',
    border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all .15s',
  },
  navItemActive: {
    display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
    borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#818cf8',
    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
    cursor: 'pointer', width: '100%', textAlign: 'left',
  },
  mcpBadge: {
    display: 'flex', alignItems: 'center', gap: 8,
    margin: '8px 12px 12px', padding: '10px 12px', borderRadius: 10,
    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)',
  },
  mcpDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
    boxShadow: '0 0 6px rgba(34,197,94,0.8)', flexShrink: 0,
    animation: 'pulse 2s infinite',
  },
  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
  header: {
    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px', borderBottom: '1px solid #0f1520', background: '#090c14',
  },
  headerTitle: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0, marginBottom: 2 },
  headerSub: { fontSize: 12, color: '#475569', margin: 0 },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
    borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
  },
  btnSecondary: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
    borderRadius: 8, fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,0.04)',
    border: '1px solid #0f1520', cursor: 'pointer',
  },
  body: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  // Banner
  banner: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderRadius: 12,
    background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)',
  },
  bannerIcon: {
    width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.14)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  // Metric cards
  grid5: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 },
  metricCard: {
    background: '#0d1018', border: '1px solid #0f1520', borderRadius: 12,
    padding: 16, transition: 'border-color .2s',
  },
  metricIconBox: {
    width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
  },
  // Cards
  card: {
    background: '#0d1018', border: '1px solid #0f1520', borderRadius: 14, padding: '18px 20px',
  },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  // Comparison
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  cmpCard: {
    background: '#080b12', border: '1px solid #0f1520', borderRadius: 10, padding: 14, textAlign: 'center',
  },
  // Round badge
  roundBadge: {
    display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
    background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)',
  },
  // Tabs
  tabRow: { display: 'flex', gap: 2, padding: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 8 },
  tab: {
    padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500,
    color: '#475569', background: 'transparent', border: 'none', cursor: 'pointer',
  },
  tabActive: {
    padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
    color: '#fff', background: '#6366f1', border: 'none', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
  },
  // Table
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600,
    color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid #0f1520', whiteSpace: 'nowrap',
  },
  td: { padding: '11px 12px', verticalAlign: 'middle' },
  // Loading
  loading: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#080b12', gap: 16,
  },
  spinner: {
    width: 36, height: 36, borderRadius: '50%',
    border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1',
    animation: 'spin 0.8s linear infinite',
  },
  // Modal
  modalOverlay: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(5, 7, 10, 0.8)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modalContent: {
    background: '#0d1018', border: '1px solid #1e2538', borderRadius: 16,
    width: 480, maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #1e2538',
  },
  modalBody: {
    padding: 24,
  },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    background: '#080b12', border: '1px solid #1e2538', color: '#e2e8f0',
    fontSize: 13, outline: 'none', transition: 'border-color .2s',
  },
};
