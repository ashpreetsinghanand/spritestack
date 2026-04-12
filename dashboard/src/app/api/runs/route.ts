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
      // Return empty data if no DB exists
      return NextResponse.json({ runs: [], stats: { total_runs: 0, total_tests: 0, total_passed: 0, total_failed: 0, avg_coverage: 0, avg_duration: 0 } });
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
    return NextResponse.json({ runs: [], stats: { total_runs: 0, total_tests: 0, total_passed: 0, total_failed: 0, avg_coverage: 0, avg_duration: 0 } });
  }
}
