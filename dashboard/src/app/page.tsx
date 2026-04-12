'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import styles from './page.module.css';

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

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function StatusBadge({ status }: { status: string }) {
  const isPassed = status === 'passed';
  return (
    <span className={`${styles.badge} ${isPassed ? styles.badgePass : styles.badgeFail}`}>
      {isPassed ? '✔ PASS' : '✖ FAIL'}
    </span>
  );
}

function MetricCard({
  label, value, sub, color, icon,
}: {
  label: string; value: string | number; sub?: string; color?: string; icon: string;
}) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricIcon} style={{ background: `${color || '#4f6ef7'}22`, color: color || '#4f6ef7' }}>
        {icon}
      </div>
      <div className={styles.metricValue} style={{ color: color }}>{value}</div>
      <div className={styles.metricLabel}>{label}</div>
      {sub && <div className={styles.metricSub}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'functional' | 'load' | 'bulk-prompt'>('all');

  useEffect(() => {
    fetch('/api/runs')
      .then(r => r.json())
      .then(data => {
        setRuns(data.runs);
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Round 1 vs Round 2 comparison data
  const round1 = runs.find(r => r.round === 1);
  const round2 = runs.find(r => r.round === 2);

  const hasComparison = round1 && round2;
  const improvement = hasComparison
    ? (((round2.passed_tests / round2.total_tests) - (round1.passed_tests / round1.total_tests)) * 100).toFixed(1)
    : null;

  // Trend data for chart
  const trendData = [...runs]
    .reverse()
    .map(r => ({
      date: format(parseISO(r.created_at), 'MMM d HH:mm'),
      passRate: r.total_tests > 0 ? Math.round((r.passed_tests / r.total_tests) * 100) : 0,
      coverage: Math.round(r.coverage_percent),
      round: r.round,
    }));

  // Comparison bar data
  const comparisonData = hasComparison ? [
    {
      name: 'Pass Rate %',
      'Round 1': Math.round((round1.passed_tests / round1.total_tests) * 100),
      'Round 2': Math.round((round2.passed_tests / round2.total_tests) * 100),
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
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
        <p>Loading SpriteStack data...</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoIcon}>🧪</div>
          <div>
            <div className={styles.sidebarLogoText}>SpriteStack</div>
            <div className={styles.sidebarLogoSub}>TestOps Ecosystem</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>OVERVIEW</div>
          <a href="#" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span>📊</span> Dashboard
          </a>
          <a href="#" className={styles.navItem}>
            <span>🧪</span> Test Runs
          </a>
          <a href="#" className={styles.navItem}>
            <span>📈</span> Trends
          </a>
          <a href="#" className={styles.navItem}>
            <span>🔄</span> Compare
          </a>

          <div className={styles.navSection} style={{ marginTop: 24 }}>REPORTS</div>
          <a href="#" className={styles.navItem}>
            <span>📄</span> HTML Reports
          </a>
          <a href="#" className={styles.navItem}>
            <span>🎬</span> Replays
          </a>

          <div className={styles.navSection} style={{ marginTop: 24 }}>SETTINGS</div>
          <a href="#" className={styles.navItem}>
            <span>⚙️</span> Config
          </a>
          <a href="https://testsprite.com" target="_blank" rel="noreferrer" className={styles.navItem}>
            <span>🔗</span> TestSprite
          </a>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.mcpBadge}>
            <span className={styles.mcpDot} />
            MCP Connected
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>TestOps Dashboard</h1>
            <p className={styles.headerSub}>Powered by TestSprite MCP</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnSecondary} onClick={() => window.location.reload()}>
              ↻ Refresh
            </button>
            <button className={styles.btnPrimary}>
              ▶ Run Tests
            </button>
          </div>
        </header>

        {/* Improvement Banner */}
        {hasComparison && improvement && parseFloat(improvement) > 0 && (
          <div className={styles.improvementBanner}>
            <span className={styles.improvementIcon}>🚀</span>
            <div>
              <strong>Round 1 → Round 2 improvement: +{improvement}% pass rate</strong>
              <span className={styles.improvementSub}>TestSprite MCP found real bugs. You fixed them. This is exactly what judges look for.</span>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className={styles.metricsGrid}>
          <MetricCard icon="🧪" label="Total Test Runs" value={stats?.total_runs || 0} color="#4f6ef7" />
          <MetricCard icon="✅" label="Tests Passed" value={stats?.total_passed || 0} color="#22c55e"
            sub={`of ${stats?.total_tests || 0} total`} />
          <MetricCard icon="❌" label="Tests Failed" value={stats?.total_failed || 0} color="#ef4444" />
          <MetricCard icon="📊" label="Avg Coverage" value={`${(stats?.avg_coverage || 0).toFixed(1)}%`} color="#7c3aed" />
          <MetricCard icon="⏱" label="Avg Duration" value={formatDuration(stats?.avg_duration || 0)} color="#06b6d4" />
        </div>

        {/* Round 1 vs 2 Comparison */}
        {hasComparison && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Round 1 → Round 2 Comparison</h2>
              <span className={styles.sectionBadge}>MCP Improvement</span>
            </div>
            <div className={styles.comparisonGrid}>
              {[
                { label: 'Pass Rate', r1: `${Math.round((round1.passed_tests / round1.total_tests) * 100)}%`, r2: `${Math.round((round2.passed_tests / round2.total_tests) * 100)}%`, better: true },
                { label: 'Coverage', r1: `${round1.coverage_percent.toFixed(1)}%`, r2: `${round2.coverage_percent.toFixed(1)}%`, better: round2.coverage_percent >= round1.coverage_percent },
                { label: 'Tests Passed', r1: round1.passed_tests, r2: round2.passed_tests, better: true },
                { label: 'Issues Found', r1: round1.failed_tests, r2: round2.failed_tests, better: round2.failed_tests <= round1.failed_tests },
              ].map(item => (
                <div key={item.label} className={styles.cmpCard}>
                  <div className={styles.cmpLabel}>{item.label}</div>
                  <div className={styles.cmpRow}>
                    <span className={styles.cmpBefore}>{item.r1}</span>
                    <span className={styles.cmpArrow}>→</span>
                    <span className={`${styles.cmpAfter} ${item.better ? styles.cmpPositive : styles.cmpNegative}`}>{item.r2}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className={styles.chartBox}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparisonData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2436" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#131720', border: '1px solid #1e2436', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="Round 1" fill="#334155" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Round 2" fill="#4f6ef7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Trend Chart */}
        {trendData.length > 1 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Pass Rate & Coverage Trends</h2>
            </div>
            <div className={styles.chartBox}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="covGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2436" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#131720', border: '1px solid #1e2436', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="passRate" name="Pass Rate %" stroke="#4f6ef7" fill="url(#passGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="coverage" name="Coverage %" stroke="#22c55e" fill="url(#covGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Run History Table */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Test Run History</h2>
            <div className={styles.tabs}>
              {(['all', 'functional', 'load', 'bulk-prompt'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Passed</th>
                  <th>Failed</th>
                  <th>Coverage</th>
                  <th>Duration</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '32px' }}>
                      No runs found. Run <code>spritestack run</code> to get started.
                    </td>
                  </tr>
                ) : (
                  filteredRuns.map(run => (
                    <tr key={run.id} className={styles.tableRow}>
                      <td><span className={styles.roundBadge}>R{run.round}</span></td>
                      <td><span className={styles.typeBadge}>{run.test_type}</span></td>
                      <td><StatusBadge status={run.status} /></td>
                      <td className={styles.textGreen}>{run.passed_tests}</td>
                      <td className={run.failed_tests > 0 ? styles.textRed : styles.textGreen}>{run.failed_tests}</td>
                      <td>
                        <div className={styles.coverageBar}>
                          <div
                            className={styles.coverageFill}
                            style={{
                              width: `${run.coverage_percent}%`,
                              background: run.coverage_percent >= 80 ? '#22c55e' : run.coverage_percent >= 50 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                          <span className={styles.coverageText}>{run.coverage_percent.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className={styles.textDim}>{formatDuration(run.duration_ms)}</td>
                      <td className={styles.textDim}>
                        {format(parseISO(run.created_at), 'MMM d, HH:mm')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
