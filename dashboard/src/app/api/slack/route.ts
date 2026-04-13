import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const CONFIG_PATH = path.join(
  process.env.SPRITESTACK_CWD || process.cwd(),
  '.spritestack',
  'config.json'
);

interface SpritestackDashboardConfig {
  slackWebhookUrl?: string;
  slackEnabled?: boolean;
  slackChannel?: string;
  slackNotifyOnFail?: boolean;
  slackNotifyOnPass?: boolean;
}

function readConfig(): SpritestackDashboardConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (_) {}
  return {};
}

function writeConfig(cfg: SpritestackDashboardConfig) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

export async function GET() {
  const cfg = readConfig();
  return NextResponse.json(cfg);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = readConfig();
    const updated: SpritestackDashboardConfig = { ...current, ...body };
    writeConfig(updated);
    return NextResponse.json({ success: true, config: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
