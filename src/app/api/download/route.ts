// app/api/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'missing key' }, { status: 400 });

  const filePath = path.join(process.cwd(), 'tmp', 'reports', path.basename(key));
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const buf = fs.readFileSync(filePath);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${key}"`,
    },
  });
}