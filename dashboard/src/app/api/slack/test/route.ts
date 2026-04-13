import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';

const CONFIG_PATH = path.join(
  process.env.SPRITESTACK_CWD || process.cwd(),
  '.spritestack',
  'config.json'
);

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (_) {}
  return {};
}

export async function POST(req: NextRequest) {
  const cfg = readConfig();
  const webhookUrl = cfg.slackWebhookUrl;

  if (!webhookUrl) {
    return NextResponse.json({ success: false, error: 'No webhook URL configured.' }, { status: 400 });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '🧪 *SpriteStack* — Test connection successful!',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '✅ *SpriteStack Slack Integration Active*\n\nThis is a test notification from your SpriteStack TestOps dashboard. Your webhook is working correctly.',
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Sent from SpriteStack TestOps Dashboard · ${new Date().toLocaleString()}`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ success: false, error: `Slack returned ${res.status}: ${text}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
