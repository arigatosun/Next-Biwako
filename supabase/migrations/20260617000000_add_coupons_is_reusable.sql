-- 使い回しクーポン（COUPONNEST=LINE1000円, LEAFKYOTO 等）を識別するフラグを追加する。
-- v1 では「管理画面の予約作り直しフロー」でのみ参照する。
-- is_reusable = TRUE のクーポンは適用しても is_used を更新しない（複数客で使い回せる）。
-- ※お客様が使う公開予約フローの既存 is_used 判定は本マイグレーションでは変更しない。
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS is_reusable BOOLEAN NOT NULL DEFAULT FALSE;

-- 既存の使い回しコードを TRUE へ補填（公開フローでハードコード除外されていたコード）。
UPDATE coupons
SET is_reusable = TRUE
WHERE coupon_code IN ('COUPONNEST', 'LEAFKYOTO');
