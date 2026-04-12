import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

function getDb() {
  const cwd = process.env.SPRITESTACK_CWD || process.cwd();
  const dbPath = path.join(cwd, '.spritestack', 'runs.sqlite');

  if (!fs.existsSync(dbPath)) {
    return null;
  }

  const db = new Database(dbPath, { readonly: true });
  return db;
}

export async function GET() {
  try {
    const db = getDb();

    if (!db) {
      // Return mock data if no DB exists (demo mode)
      return NextResponse.json(getMockData());
    }

    const runs = db.prepare(`
      SELECT * FROM test_runs ORDER BY created_at DESC LIMIT 50
    `).all();

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_runs,
        SUM(total_tests) as total_tests,
        SUM(passed_tests) as total_passed,
        SUM(failed_tests) as total_failed,
        AVG(coverage_percent) as avg_coverage,
        AVG(duration_ms) as avg_duration
      FROM test_runs
    `).get() as any;

    db.close();

    return NextResponse.json({ runs, stats });
  } catch (error) {
    console.error('DB error:', error);
    return NextResponse.json(getMockData());
  }
}

function getMockData() {
  const now = Date.now();
  const runs = [
    {
      id: 1,
      run_id: 'abc123',
      project_name: 'My App',
      round: 1,
      test_type: 'all',
      status: 'failed',
      total_tests: 38,
      passed_tests: 22,
      failed_tests: 16,
      coverage_percent: 58.4,
      duration_ms: 87000,
      created_at: new Date(now - 3600000 * 5).toISOString(),
    },
    {
      id: 2,
      run_id: 'def456',
      project_name: 'My App',
      round: 2,
      test_type: 'all',
      status: 'passed',
      total_tests: 42,
      passed_tests: 39,
      failed_tests: 3,
      coverage_percent: 84.7,
      duration_ms: 72000,
      created_at: new Date(now - 3600000 * 2).toISOString(),
    },
    {
      id: 3,
      run_id: 'ghi789',
      project_name: 'My App',
      round: 1,
      test_type: 'load',
      status: 'failed',
      total_tests: 24,
      passed_tests: 14,
      failed_tests: 10,
      coverage_percent: 62.1,
      duration_ms: 120000,
      created_at: new Date(now - 3600000 * 1).toISOString(),
    },
  ];

  const stats = {
    total_runs: 3,
    total_tests: 104,
    total_passed: 75,
    total_failed: 29,
    avg_coverage: 68.4,
    avg_duration: 93000,
  };

  return { runs, stats };
}
