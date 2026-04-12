import * as fs from 'fs-extra';
import * as path from 'path';
import Database from 'better-sqlite3';

export interface TestRun {
  id?: number;
  runId: string;
  projectName: string;
  round: number;
  testType: 'functional' | 'load' | 'bulk-prompt' | 'all';
  status: 'running' | 'passed' | 'failed' | 'error';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coveragePercent: number;
  durationMs: number;
  reportPath?: string;
  videoPath?: string;
  summaryJson?: string;
  createdAt?: string;
}

let db: Database.Database | null = null;

export function getDb(cwd: string): Database.Database {
  if (db) return db;

  const dbDir = path.join(cwd, '.spritestack');
  fs.ensureDirSync(dbDir);
  const dbPath = path.join(dbDir, 'runs.sqlite');

  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS test_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      project_name TEXT NOT NULL,
      round INTEGER DEFAULT 1,
      test_type TEXT NOT NULL,
      status TEXT NOT NULL,
      total_tests INTEGER DEFAULT 0,
      passed_tests INTEGER DEFAULT 0,
      failed_tests INTEGER DEFAULT 0,
      coverage_percent REAL DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      report_path TEXT,
      video_path TEXT,
      summary_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS test_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      fix_suggestion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_test_runs_run_id ON test_runs(run_id);
    CREATE INDEX IF NOT EXISTS idx_test_runs_created_at ON test_runs(created_at);
  `);

  return db;
}

export function saveRun(cwd: string, run: TestRun): number {
  const database = getDb(cwd);
  const stmt = database.prepare(`
    INSERT INTO test_runs (
      run_id, project_name, round, test_type, status,
      total_tests, passed_tests, failed_tests, coverage_percent,
      duration_ms, report_path, video_path, summary_json
    ) VALUES (
      @runId, @projectName, @round, @testType, @status,
      @totalTests, @passedTests, @failedTests, @coveragePercent,
      @durationMs, @reportPath, @videoPath, @summaryJson
    )
  `);

  const result = stmt.run({
    runId: run.runId,
    projectName: run.projectName,
    round: run.round,
    testType: run.testType,
    status: run.status,
    totalTests: run.totalTests,
    passedTests: run.passedTests,
    failedTests: run.failedTests,
    coveragePercent: run.coveragePercent,
    durationMs: run.durationMs,
    reportPath: run.reportPath || null,
    videoPath: run.videoPath || null,
    summaryJson: run.summaryJson || null,
  });

  return result.lastInsertRowid as number;
}

export function getAllRuns(cwd: string): TestRun[] {
  const database = getDb(cwd);
  const rows = database.prepare(`
    SELECT * FROM test_runs ORDER BY created_at DESC LIMIT 100
  `).all() as any[];

  return rows.map(rowToRun);
}

export function getRunById(cwd: string, runId: string): TestRun | null {
  const database = getDb(cwd);
  const row = database.prepare(`
    SELECT * FROM test_runs WHERE run_id = ?
  `).get(runId) as any;

  return row ? rowToRun(row) : null;
}

export function getRecentRuns(cwd: string, limit = 10): TestRun[] {
  const database = getDb(cwd);
  const rows = database.prepare(`
    SELECT * FROM test_runs ORDER BY created_at DESC LIMIT ?
  `).all(limit) as any[];
  return rows.map(rowToRun);
}

function rowToRun(row: any): TestRun {
  return {
    id: row.id,
    runId: row.run_id,
    projectName: row.project_name,
    round: row.round,
    testType: row.test_type,
    status: row.status,
    totalTests: row.total_tests,
    passedTests: row.passed_tests,
    failedTests: row.failed_tests,
    coveragePercent: row.coverage_percent,
    durationMs: row.duration_ms,
    reportPath: row.report_path,
    videoPath: row.video_path,
    summaryJson: row.summary_json,
    createdAt: row.created_at,
  };
}
