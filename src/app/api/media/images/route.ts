import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const CATALOG_DIR = path.join(process.cwd(), 'public', 'catalog');
const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  let entries: string[] = [];
  try {
    entries = await fs.readdir(CATALOG_DIR);
  } catch {
    // folder may not exist yet
  }

  const images = entries
    .filter((name) => ALLOWED_EXT.has(path.extname(name).toLowerCase()))
    .map((name) => ({
      id: name,
      url: `/catalog/${name}`,
      filename: name,
    }));

  return NextResponse.json({ images });
}
