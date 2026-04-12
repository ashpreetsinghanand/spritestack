import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';

export async function GET(req: NextRequest) {
  const fileQuery = req.nextUrl.searchParams.get('file');

  if (!fileQuery) {
    return new NextResponse('File parameter is required', { status: 400 });
  }

  const cwd = process.env.SPRITESTACK_CWD || process.cwd();
  
  // Resolve path safely relative to testsprite_tests
  const testspriteDir = path.join(cwd, 'testsprite_tests');
  const requestedPath = path.join(testspriteDir, fileQuery);

  // Prevent directory traversal
  if (!requestedPath.startsWith(testspriteDir)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!fs.existsSync(requestedPath)) {
    return new NextResponse(`File not found: ${fileQuery}`, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(requestedPath);
  const ext = path.extname(requestedPath).toLowerCase();

  let contentType = 'application/octet-stream';
  if (ext === '.html') contentType = 'text/html';
  else if (ext === '.json') contentType = 'application/json';
  else if (ext === '.mp4') contentType = 'video/mp4';

  const fileName = path.basename(requestedPath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
