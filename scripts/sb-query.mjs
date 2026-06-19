// Supabase Management API 経由で任意SQLを実行する補助スクリプト（検証・使い捨て検証予約用）。
// トークンは .mcp.json から読み取り、出力しない。
// 使い方: node scripts/sb-query.mjs "select ..."
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(scriptDir, '..', '..');
const mcp = JSON.parse(readFileSync(path.join(repoRoot, '.mcp.json'), 'utf8'));
const sb = mcp.mcpServers?.supabase;
const ref = sb?.args?.[sb.args.indexOf('--project-ref') + 1];
const token = sb?.env?.SUPABASE_ACCESS_TOKEN;

const query = process.argv[2];
if (!query) {
  console.error('usage: node scripts/sb-query.mjs "<sql>"');
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});
const text = await res.text();
if (!res.ok) {
  console.error(`[${res.status}] ${text}`);
  process.exit(1);
}
console.log(text);
