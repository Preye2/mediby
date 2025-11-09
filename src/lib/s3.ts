// src/lib/s3.ts  (zero-deps stub)
import fs from 'fs';
import path from 'path';

export async function uploadToS3(buffer: Buffer, key: string): Promise<string> {
  const tmpDir = path.join(process.cwd(), 'tmp');          // project-local tmp
  const outDir = path.join(tmpDir, 'reports');             // nested folder
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const filePath = path.join(outDir, path.basename(key));  // strip any ".."
  fs.writeFileSync(filePath, buffer);

  const host = process.env.VERCEL_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${host}/api/download?key=${path.basename(key)}`;
}