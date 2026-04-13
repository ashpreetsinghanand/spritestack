import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

function readConfig(cwd: string) {
  const cfgPath = path.join(cwd, '.spritestack', 'config.json');
  try {
    if (fs.existsSync(cfgPath)) return JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
  } catch (_) {}
  return {};
}

async function sendSlackNotification(webhookUrl: string, run: any, success: boolean) {
  const emoji = success ? '✅' : '❌';
  const color = success ? '#22c55e' : '#ef4444';
  const passRate = run?.total_tests > 0
    ? ((run.passed_tests / run.total_tests) * 100).toFixed(1)
    : '0.0';

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `${emoji} SpriteStack run ${success ? 'passed' : 'failed'}`,
      attachments: [
        {
          color,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${emoji} SpriteStack Test Run ${success ? 'Passed' : 'Failed'}*\n\`spritestack run\` completed with ${run ? `*${passRate}%* pass rate` : 'an error'}.`,
              },
            },
            run && {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Round:*\n${run.round}` },
                { type: 'mrkdwn', text: `*Type:*\n${run.test_type}` },
                { type: 'mrkdwn', text: `*Passed:*\n${run.passed_tests} / ${run.total_tests}` },
                { type: 'mrkdwn', text: `*Coverage:*\n${run.coverage_percent?.toFixed(1)}%` },
              ].filter(Boolean),
            },
            {
              type: 'context',
              elements: [
                { type: 'mrkdwn', text: `Powered by *SpriteStack* · ${new Date().toLocaleString()}` },
              ],
            },
          ].filter(Boolean),
        },
      ],
    }),
  });
}

export async function POST() {
  const cwd = process.env.SPRITESTACK_CWD || process.cwd();
  console.log(`Triggering run in ${cwd}...`);

  try {
    const { stdout } = await execAsync('npx spritestack run', { cwd, timeout: 300_000 });

    // Read latest run from DB and send Slack notification
    const cfg = readConfig(cwd);
    if (cfg.slackEnabled && cfg.slackWebhookUrl) {
      try {
        const Database = require('better-sqlite3');
        const dbPath = path.join(cwd, '.spritestack', 'runs.sqlite');
        if (fs.existsSync(dbPath)) {
          const db = new Database(dbPath, { readonly: true });
          const latestRun = db.prepare('SELECT * FROM test_runs ORDER BY id DESC LIMIT 1').get();
          db.close();

          const shouldNotify =
            (cfg.slackNotifyOnPass && latestRun?.status === 'passed') ||
            (cfg.slackNotifyOnFail && latestRun?.status !== 'passed') ||
            // Default: always notify if both flags are absent
            (cfg.slackNotifyOnPass === undefined && cfg.slackNotifyOnFail === undefined);

          if (shouldNotify) {
            await sendSlackNotification(cfg.slackWebhookUrl, latestRun, latestRun?.status === 'passed');
          }
        }
      } catch (slackErr) {
        console.error('Slack notification failed:', slackErr);
      }
    }

    return NextResponse.json({ success: true, logs: stdout });
  } catch (error: any) {
    const cfg = readConfig(cwd);
    // Also notify on failure if enabled
    if (cfg.slackEnabled && cfg.slackWebhookUrl && cfg.slackNotifyOnFail !== false) {
      try {
        await sendSlackNotification(cfg.slackWebhookUrl, null, false);
      } catch (_) {}
    }
    console.error('Run failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
