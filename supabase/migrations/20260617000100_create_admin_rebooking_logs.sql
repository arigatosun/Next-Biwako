-- 管理画面での「ねっぱん予約の本サイト作り直し」操作の監査ログ。
-- 1操作（旧予約キャンセル＋新予約作成）につき 1 行を記録する。
-- キャンセルを既存ステータス customer_cancelled に寄せるため、
-- 「作り直し由来かどうか」はこのテーブルの旧/新予約番号で突き合わせて判別する。
CREATE TABLE IF NOT EXISTS admin_rebooking_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator VARCHAR(255),                         -- 操作した管理者（メール/識別子）
  old_reservation_id INTEGER,                    -- キャンセルした旧（ねっぱん由来）予約
  old_reservation_number VARCHAR(100),
  new_reservation_id INTEGER,                    -- 作成した新（本サイト）予約
  new_reservation_number VARCHAR(100),
  coupon_code VARCHAR(100),                       -- 適用クーポン（無ければ NULL）
  total_amount INTEGER,                           -- 割引前合計
  payment_amount INTEGER,                         -- 割引後（現地決済）金額
  note TEXT,                                      -- 任意メモ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_rebooking_logs_created_at
  ON admin_rebooking_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_admin_rebooking_logs_new_reservation_id
  ON admin_rebooking_logs (new_reservation_id);
