// src/lib/db.ts
// 予約作り直しのトランザクション処理用に pg コネクションプールを共有する。
// 既存 save-reservation と同じく DATABASE_URL を利用する（本番のみ設定）。
import { Pool } from 'pg';

declare global {
  // 開発時のホットリロードでプールが量産されないようグローバルに保持する
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!global.__pgPool) {
    global.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase 接続では SSL が必要
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return global.__pgPool;
}
