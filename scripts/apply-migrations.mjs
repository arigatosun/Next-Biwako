// 本番DBへマイグレーションSQLを適用する一回限りのランナー。
// DATABASE_URL を .env / .env.local から読み取り、各SQLを冪等に実行する。
// 使い方: node scripts/apply-migrations.mjs <relative-sql-path> [<more>...]
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(file) {
  try {
    const txt = readFileSync(path.join(root, file), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      if (/^\s*#/.test(line)) continue;
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        process.env[m[1]] = v;
      }
    }
  } catch {
    /* ファイルが無ければ無視 */
  }
}
loadEnv('.env.local');
loadEnv('.env');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('ERROR: DATABASE_URL が見つかりません (.env / .env.local)');
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('ERROR: 適用するSQLファイルを引数で指定してください');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  for (const f of files) {
    const sql = readFileSync(path.join(root, f), 'utf8');
    process.stdout.write(`Applying ${f} ... `);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('OK');
    } catch (e) {
      await client.query('ROLLBACK');
      console.log('FAILED');
      console.error(`  ${e.message}`);
      throw e;
    }
  }

  // 検証
  const col = await client.query(
    `select 1 from information_schema.columns where table_name='coupons' and column_name='is_reusable'`
  );
  const tbl = await client.query(
    `select 1 from information_schema.tables where table_name='admin_rebooking_logs'`
  );
  const reuse = await client.query(
    `select coupon_code, is_reusable from coupons where is_reusable = true order by coupon_code`
  );
  console.log('\n--- 検証 ---');
  console.log('coupons.is_reusable 列:', col.rowCount === 1 ? '存在' : '欠落');
  console.log('admin_rebooking_logs テーブル:', tbl.rowCount === 1 ? '存在' : '欠落');
  console.log('is_reusable=true のクーポン:', reuse.rows);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
