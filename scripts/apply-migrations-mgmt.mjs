// Supabase Management API 経由でマイグレーションSQLを適用する一回限りのランナー。
// ルートの .mcp.json から project-ref と SUPABASE_ACCESS_TOKEN を読み取る（トークンは出力しない）。
// 使い方: node scripts/apply-migrations-mgmt.mjs <relative-sql-path> [<more>...]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, '..'); // Next-Biwako
const repoRoot = path.join(projectRoot, '..'); // 1226nest

const mcp = JSON.parse(readFileSync(path.join(repoRoot, '.mcp.json'), 'utf8'));
const sb = mcp.mcpServers?.supabase;
const ref = sb?.args?.[sb.args.indexOf('--project-ref') + 1];
const token = sb?.env?.SUPABASE_ACCESS_TOKEN;
if (!ref || !token) {
  console.error('ERROR: .mcp.json から project-ref / SUPABASE_ACCESS_TOKEN を取得できません');
  process.exit(1);
}

const endpoint = `https://api.supabase.com/v1/projects/${ref}/database/query`;

async function runSql(query, label) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${label} failed [${res.status}]: ${text}`);
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return json;
}

async function main() {
  // 1. 接続テスト（読み取りのみ）
  process.stdout.write('接続テスト ... ');
  const ping = await runSql('select current_database() as db, now() as now;', 'ping');
  console.log('OK', JSON.stringify(ping));

  // 2. 適用前スナップショット
  const before = await runSql(
    `select
       (select count(*) from information_schema.columns where table_name='coupons' and column_name='is_reusable') as is_reusable_col,
       (select count(*) from information_schema.tables where table_name='admin_rebooking_logs') as audit_tbl;`,
    'snapshot-before'
  );
  console.log('適用前:', JSON.stringify(before));

  // 3. マイグレーション適用
  const files = process.argv.slice(2);
  for (const f of files) {
    const sql = readFileSync(path.join(projectRoot, f), 'utf8');
    process.stdout.write(`Applying ${f} ... `);
    await runSql(sql, f);
    console.log('OK');
  }

  // 4. 検証
  const col = await runSql(
    `select column_name, data_type, column_default, is_nullable
       from information_schema.columns
      where table_name='coupons' and column_name='is_reusable';`,
    'verify-col'
  );
  const tbl = await runSql(
    `select column_name, data_type from information_schema.columns
      where table_name='admin_rebooking_logs' order by ordinal_position;`,
    'verify-tbl'
  );
  const reuse = await runSql(
    `select coupon_code, is_reusable from coupons where is_reusable = true order by coupon_code;`,
    'verify-reuse'
  );
  console.log('\n--- 検証 ---');
  console.log('coupons.is_reusable 列:', JSON.stringify(col));
  console.log('admin_rebooking_logs 列:', JSON.stringify(tbl));
  console.log('is_reusable=true のクーポン:', JSON.stringify(reuse));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
