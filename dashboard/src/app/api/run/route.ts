import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const cwd = process.env.SPRITESTACK_CWD || process.cwd();
    // Assuming the dashboard is running as part of the monorepo test
    // or globally installed CLI. We execute spritestack run.
    console.log(`Triggering run in ${cwd}...`);
    
    // We execute async and await it. For a local dev server this is fine.
    // In production, you'd use a job queue, but this is a local TestOps tool.
    const { stdout, stderr } = await execAsync('npx spritestack run', { cwd });
    
    return NextResponse.json({ success: true, logs: stdout });
  } catch (error: any) {
    console.error('Run failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
