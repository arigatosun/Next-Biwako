# 管理画面：ねっぱん予約の本サイト予約「作り直し」機能 要件定義書

> ステータス: ドラフト（すり合わせ中・未承認）
> 最終更新: 2026-06-17

## 1. 背景・目的

ねっぱん（OTA等、本サイト外）で既に予約済みの客は、別システム経由で本サイトの Supabase `reservations` テーブルにも自動取り込み済み。
この客を「本サイトの予約」として作り直したい。目的は以下（マスト）。

1. **本サイト経由のメール送信**（客向け予約確認＋管理者通知）
2. **クーポン適用**（割引）

現状は手作業（DB操作・メール送信・枠調整）で非常に煩雑。これを**管理画面のワンフロー**にまとめる。

### スコープ外（今回やらない）
- ねっぱん／OTA 側への反映（FastAPI 連携）。物理的な予約はねっぱんに既存のため**FastAPI は一切叩かない**（cancel/create とも DB のみ）。
- Stripe 決済（廃止済。支払いは**現地のみ＝onsite**）。

## 2. 前提・用語

- **枠**：1日あたり最大 **2ユニット**（`reservation-calendar/route.ts` `totalUnitsPerDay=2`、フォーム `checkStayAvailability` も上限2）。
- 枠を消費するのはステータス `pending / confirmed / paid / processing` の予約のみ。`customer_cancelled` 等にすると即座に空き枠が復活する。
- ねっぱん由来予約は DB に取込済（`neppan_reservation_id` を持つ）。
- 料金は `src/app/data/roomPrices.ts`（日別単価, 2025-04-01〜2026-12-31）＋ `src/app/data/foodPlans.ts`（食事プラン単価）で決まる。

## 3. 中核フロー（管理画面の1操作）

管理者が画面で新予約内容を確定すると、サーバ側が**単一DBトランザクション**で以下を実行する。

```
BEGIN
  1. 対象の既存（ねっぱん由来）予約を DB 上でキャンセル
     - reservation_status を 'customer_cancelled' に更新（cancellation_fee は付けない）
     - ★メール送信なし・FastAPI 送信なし
  2. 空き枠チェック（同トランザクション内・新予約の日程×棟数が上限2以内か）
  3. 新予約を INSERT
     - payment_method='onsite', payment_status='pending', reservation_status='confirmed'
     - sync_status は FastAPI を使わないため 'complete' を設定（CHECK制約の許可値は pending/complete/failed/processing。'complete' は再送cron対象外＝送信不要を表現）
     - クーポン coupon_code / affiliate_id / 割引後 payment_amount を反映
  4. クーポンを使用済みに（使い回し=is_reusable のものは更新しない）
COMMIT
→ コミット成功後にメール送信（客向け＋管理者）。失敗時は送らない。
→ 監査テーブルに操作記録（操作者・旧/新予約番号・日時）を残す。
```

> **決定A の補足**：キャンセルステータスは既存 `customer_cancelled` を再利用するため、status 単体では客都合キャンセルと作り直し由来を区別できない。区別が必要な場面は **監査テーブル `admin_rebooking_logs`（旧/新予約番号を記録）** で突き合わせて担保する。

**race condition 対策**：cancel と create を同一トランザクションに入れることで、空き枠が他トランザクションに露出しない（一般客は「旧予約が埋まっている」か「新予約が埋まっている」しか観測しない）。明示ロックは不要。実装は `save-reservation` と同じ `pg` Pool（`DATABASE_URL`）で行う。

## 4. 機能要件

### 4.1 画面（管理ダッシュボード内に新タブ／ページ）
- 既存 `AdminAuthContext` 認証下にマウント（管理者のみ）。
- **対象予約の検索**：氏名 / 電話番号 / 宿泊日で検索 → 候補一覧。同一客・同一宿泊日を自動ハイライトしつつ、**最終的にどれをキャンセル対象にするかは人が選択**（同日複数枠の取り違え防止）。
- **新予約フォーム**：下記 4.4 のテキストを貼り付け → 自動入力。手修正可。
- **料金は自動計算**＋手動上書き可（料金表外日付・特殊対応のフォールバック）。
- **クーポン適用**：コード入力 → 検証 → 割引額表示。
- 確定ボタンで 3章の処理を実行 → 結果（新予約番号・送信メール）を表示。

### 4.2 API（新規）
- `GET /api/admin/reservations/search?...`（氏名/電話/日付）— 全予約横断検索（既存はアフィリエイト紐付きのみで不足）。
- `POST /api/admin/rebooking` — 3章のトランザクション処理本体。リクエスト：{ targetReservationId, 新予約フィールド一式, couponCode? }。
- いずれも管理者認証必須。

### 4.3 料金自動計算（共有ユーティリティに切り出し）
- `roomTotal = Σ(roomPrices[日付].price) × num_units`（連泊は各泊を合算）。
- `mealTotal = Σ 食事プラン単価 × 人前`（`foodPlans`）。
- `room_rates`（{date, price}[]）も併せて生成（既存スキーマ互換）。
- `total_amount = roomTotal + mealTotal`、`payment_amount = total_amount − クーポン割引`。
- 料金計算ロジックを `src/lib/pricing.ts` に**新設**し、**v1 では管理画面のみが使用**（お客様が使う公開フォームは無改修）。既存 `PlanAndEstimateInfo.tsx` と同一仕様で実装し、一時的なロジック重複を許容する（既存機能への影響ゼロを優先）。公開フォームへの統一は将来の別タスク。
- **料金表に無い日付**は自動計算不可 → 手動入力にフォールバック（UIで明示）。

### 4.4 自動入力（貼り付けパース）
対象フォーマット例：
```
宿泊希望日：9/21　1泊
お名前：中橋佑太
フリガナ：ナカハシユウタ
電話番号：08042511880
郵便番号：615-0051
住所：京都府京都市右京区西院83
メールアドレス：ynakahashi@au.com
大人男性人数：5
大人女性人数：
子供寝具あり人数：
子供寝具なし人数：5
お食事（必要な場合〇〇人前とご記載ください）：
チェックイン予定時間：15:00
ご利用目的：ご旅行
LINEクーポン　1000円あり
```
パース仕様：
- 宿泊希望日「9/21」→ check_in_date（年は当年/翌年を近い将来で補完）＋ num_nights（「1泊」）。
- 住所「京都府…」→ prefecture（都道府県プレフィックス一致）＋ city_address（残り）。
- 人数空欄＝0。`guest_counts` を構築。
- 利用目的「ご旅行」→ purpose='travel' へマッピング。
- クーポン行は参考表示（コード自体は別途入力 or 既定コード適用）。
- **パース不可・欠落項目はフォームで手入力**（特に **棟数 num_units はテンプレに無いため必須手入力**、gender/birth_date は既定値）。

### 4.5 メール
- 新予約：客向け `GuestReservationEmail`（現地決済）＋ 管理者通知 `AdminReservationNotification`（既存テンプレ流用）。
- 旧予約のキャンセル：**メールを送らない**（既存 `/api/cancel-reservation` は無条件送信するため流用せず、専用のDOメール無しキャンセルを実装）。

## 5. データモデル変更
- `coupons` に `is_reusable boolean default false` を追加（**確定**）。**v1 では管理画面の作り直しフローのみが `is_reusable` を参照**（使い回しクーポンは `is_used` を更新しない）。**公開フォームの既存 `is_used` 判定（5000/3000・LEAFKYOTO 特例のハードコード）は据え置き＝無改修**。既存の使い回しコードは `is_reusable=true` へデータ補填。
- 監査テーブル `admin_rebooking_logs`（新規・**確定**）：操作者 / 旧予約ID・番号 / 新予約ID・番号 / 日時 / クーポン / 金額。作り直しの追跡はこのテーブルで担保する（`reservations.superseded_by` 列は追加しない）。
- `reservations` の TypeScript 型（`src/app/types/supabase.ts`）が実DB（`neppan_reservation_id` / `sync_status` / `pending_count` / `cancellation_fee` 欠落）と乖離 → 型を実態に合わせて更新。
- `sync_status` は CHECK制約により pending/complete/failed/processing のみ許可。作り直し新予約は **'complete'** を設定し、再送 cron（`check-pending-reservations` は pending/failed のみ対象）の対象外にする（'manual' は制約違反になるため不可）。

## 6. エッジケース
- 同日に2枠とも埋まり、対象がねっぱん由来でない場合の扱い（誤キャンセル防止＝人の最終選択で担保）。
- 料金表外日付（手動入力フォールバック）。
- クーポン未存在/使用済み/使い回しの判定。
- 連泊・複数棟（num_units≥2）の枠計算。
- トランザクション中の空き枠超過 → ロールバックしユーザーにエラー提示（予約は作られない）。
- メール送信失敗時：予約は確定済（コミット後）。再送導線/ログを用意。

## 7. 非機能・セキュリティ
- 管理者認証必須（既存 `AdminAuthContext` / admin API 認可方式に準拠）。
- 入力バリデーション（メール形式・電話・日付・人数・金額）。Zod 等でスキーマ化。
- サービスロールキーはサーバ側のみ。秘匿情報のハードコード禁止。
- 監査ログ（誰がいつ作り直したか・対象/新予約番号）を残す。

## 8. 完了条件（Definition of Done）
- 管理者が貼り付け→自動入力→料金自動計算→クーポン適用→確定までを1画面で完了でき、
- 旧予約がメール無しでキャンセル、新予約が作成され、客＆管理者にメントが届き、
- 枠が二重化せず・一般客に空き枠が露出せず（並行予約テストで担保）、
- FastAPI/ねっぱんへは一切送信されないこと。

## 9. 検証条件（テスト観点）
- **Unit**：料金計算util（連泊/複数棟/料金表外）、住所分割パーサ、人数空欄=0、クーポン判定（固定/率/使い回し/使用済み）。
- **Integration**：`/api/admin/rebooking` トランザクション（旧キャンセル＋新作成＋クーポン更新の原子性、ロールバック時に旧予約が元に戻る）、メール送信、FastAPI 非送信の確認。
- **E2E（Playwright）**：管理画面で貼り付け→確定→新予約番号表示。並行予約レース（cancel〜create間に一般予約APIを叩いても空き枠を取れない）。
- カバレッジ 80% 以上。

## 10. 段階実装案
1. 型更新 + `coupons.is_reusable` マイグレーション + 料金util抽出。
2. 検索API + rebooking トランザクションAPI（メール無しキャンセル含む）。
3. 管理画面UI（検索→フォーム→確定）。
4. 貼り付けパーサ + 自動入力。
5. メール結線 + 監査ログ。
6. テスト一式（unit/integration/E2E）。

## 11. 決定事項（確定 2026-06-17）
- A. 旧予約のキャンセルは既存 `customer_cancelled` を再利用。作り直し由来の区別は監査テーブル `admin_rebooking_logs`（旧/新予約番号）で担保（`superseded_by` 列は不採用）。
- B. `coupons.is_reusable` 列を追加。既存ハードコード分岐を本フラグに置換。
- C.（改訂）料金計算は `src/lib/pricing.ts` を**新設**し **v1 は管理画面のみ使用**。公開予約フロー（料金計算・クーポンis_used）は**無改修**＝既存機能への影響ゼロを優先（公開フォームへの統一は将来の別タスク）。
- D. 監査ログは新規 `admin_rebooking_logs` テーブルに記録。

## 12. L3 自己点検（リスク・留意）
- 品質(5)：並行予約レースは「単一トランザクション」で構造的に解消するが、**E2Eで実際に cancel〜create 間に一般予約APIを叩いて取れないことを検証**する（机上で終わらせない）。
- 品質(5)：個人情報（氏名・電話・住所・メール）を扱う管理機能のため、**管理者認可をAPI層で必須化**し、検索APIの認可漏れに注意。
- 設計(2)：FastAPI 非送信を `sync_status='complete'` で表現し、再送 cron（pending/failed のみ対象）が拾わないことを保証（拾うと二重作成リスク）。実DBの CHECK 制約で許可値は pending/complete/failed/processing。
- 納品(6)：料金表は2026-12-31まで。**それ以降の日付は自動計算不可**＝手動入力フォールバックをUIで明示（黙って0円にしない）。
