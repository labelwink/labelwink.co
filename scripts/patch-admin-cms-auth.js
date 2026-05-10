const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'app', 'api', 'admin', 'cms');
const files = [
  'banners/route.ts',
  'banners/[id]/route.ts',
  'sections/route.ts',
  'sections/reorder/route.ts',
  'collections/route.ts',
  'about/route.ts',
  'flash-sale/route.ts',
  'occasions/route.ts',
  'trust-badges/route.ts',
  '[page]/route.ts',
];

files.forEach((relative) => {
  const filePath = path.join(dir, relative);
  let content = fs.readFileSync(filePath, 'utf8');
  const importPattern = /import \{ NextResponse \} from 'next\/server';\nimport \{ createClient, createAdminClient \} from '@\/lib\/supabase\/server';\n/;
  if (importPattern.test(content) && !content.includes("import { requireAdmin } from '@/lib/requireAdmin';")) {
    content = content.replace(importPattern, "import { NextResponse } from 'next/server';\nimport { createClient, createAdminClient } from '@/lib/supabase/server';\nimport { requireAdmin } from '@/lib/requireAdmin';\n");
  }
  content = content.replace(/async function verifyAdmin\([\s\S]*?\}\n\n(?=export async function GET\()/, '');
  content = content.replace(/const isAdmin = await verifyAdmin\(\);\n  if \(!isAdmin\) return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);/g,
    'const guard = await requireAdmin();\n  if (guard) return guard;');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('patched', relative);
});
