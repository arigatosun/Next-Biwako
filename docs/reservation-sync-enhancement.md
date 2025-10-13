# 予約同期リトライ機能 設計書

## 背景

- 既存の `/reservation-form` からの確定処理では Supabase の `reservations` テーブルにデータを挿入し、同じペイロードを FastAPI エンドポイント `https://44fd-34-97-99-223.ngrok-free.app/create_reservation` に送信している。
- Cron (`/api/cron/check-pending-reservations`) は 15 分間隔で `sync_status = 'pending'` の予約を巡回し、`pending_count` を増やし 2 回以上検出したものをメールで通知するだけで、外部システムへの再送は行っていない。
- `sync_status` が `pending` のまま残った予約に対して自動再送を行い、それでも解決しない場合に通知したい。また、再送後にユーザーが別途取り直した予約が完了した際、古い予約のステータスも完了へ揃える必要がある。

## 現状まとめ

- フロントエンド (`PaymentAndPolicy.tsx`)
  - 予約確定時に `ReservationInsert` 型のオブジェクトを構築し Supabase へ保存。
  - 同じオブジェクトを FastAPI へ `POST` 送信 (`sendReservationData`)。
  - 送信フィールドは以下（抜粋）。

    | キー | 型 | 内容 |
    | ---- | -- | ---- |
    | `reservation_number` | string | `RES-<timestamp>` を採番。
    | `name`, `name_kana` | string | 氏名とふりがな。
    | `email`, `phone_number` | string | 連絡先。
    | `guest_counts` | JSON | 棟 × 日 × 区分ごとの人数。
    | `meal_plans` | JSON | 棟 × 日 × プランID の食事情報。
    | `room_rates` | Array | 日毎の料金明細。
    | `room_rate`, `total_meal_price`, `total_amount`, `payment_amount` | number | 各種金額。
    | `payment_method` | `'onsite' | 'credit'` | 決済手段。
    | `payment_status`, `reservation_status`, `sync_status`, `pending_count` | string/number | 初期値は `processing`/`confirmed`/`pending`/`0` など。
    | `coupon_code`, `affiliate_id` | string / number | クーポン・アフィリエイト情報。

- Cron (`/api/cron/check-pending-reservations`)
  - Supabase から `sync_status = 'pending'` を取得し `pending_count` を +1。
  - `pending_count >= 2` で Resend により管理者へ通知。
  - エンドポイント再送や `sync_status` の更新は未実装。

## 課題

1. `pending` が複数回検出されても自動的な再送が行われず、常に人手対応が必要。
2. `sync_status = 'failed'` の予約は Cron 対象外のため再送機会が無い。
3. ユーザーが再度予約し直したケースで、新しい予約が完了しても古い予約が `pending/failed` のまま残り、運用上ノイズとなる。

## 追加要件

1. `sync_status` が `pending` または `failed` の予約について、`pending_count`（仮称：`error_count`）が 2 回目以降になったタイミングで FastAPI へ再送する。
2. 再送成功時は該当レコードの `sync_status` を `complete` / `processing` など適切な状態へ更新し、カウンタをリセットする。
3. FastAPI への再送が成功したにも関わらず別途ユーザーが取り直した予約が `complete` になった場合、元の未完了予約も `sync_status = 'complete'` に更新する（同一顧客・同一宿泊日などの条件で紐付け）。
4. 再送に失敗した場合は従来通りメール通知し、`sync_status` を `failed` に更新する。

## 変更方針

### 1. データモデル拡張

- `reservations` テーブルに以下のフィールドを追加（SQL マイグレーションで対応）。
  - `error_count`（既存 `pending_count` をリネーム）: smallint, デフォルト 0。
  - `last_sync_result` : text（最新の FastAPI 応答内容を記録、任意）。
  - `superseded_by` : bigint nullable（より新しい予約 ID を参照し、完了連動に使用）。
- 既存コードでは `pending_count` を参照しているため、リネーム後はコンテキスト側も `error_count` を利用するように置換。

### 2. FastAPI 送信ユーティリティのサーバー共有化

- `src/lib/reservationSync.ts`（新規）を作成。
  - `mapReservationRowToPayload(reservation: Reservation): ReservationInsert` を定義。Supabase Row から FastAPI へ送る JSON を生成（`created_at` など不要フィールド除外、`pending_count/error_count` は 0 に潰して送る）。
  - `postReservationToFastApi(payload: ReservationInsert): Promise<void>` を定義。`fetch` でエンドポイントへ POST、200 系以外なら `throw`。タイムアウトやエラー内容をログに残す。
- フロント側 `sendReservationData` も可能であればこのユーティリティを呼ぶよう統一（共通化は別タスクだが、仕様差異が無いことを確認）。

### 3. Cron `/api/cron/check-pending-reservations` のロジック変更

1. 対象抽出を `sync_status IN ('pending', 'failed')` に変更。
2. 各予約の `error_count` を +1 し、`last_pending_checked_at` を更新。
3. トリガー条件: `error_count >= 2` になったレコードについて以下を実施。
   - `mapReservationRowToPayload` で payload を生成。
   - `postReservationToFastApi` で再送。
   - 成功時:
     - `sync_status` を `processing`（または `complete`：FastAPI の応答に従う）に更新。
     - `error_count` を 0 にリセット。
     - `last_sync_result` に `"resend_success"` 等を記録。
   - 失敗時:
     - `sync_status` を `failed` に更新。
     - `last_sync_result` に失敗理由を格納。
     - 従来のメール通知 (`sendAlertEmail`) を実行。

### 4. 予約取り直し時の同期

- 新規予約が `complete` になった際に、過去の未完了予約も `complete` へ更新する仕組みを追加。
- 実装案:
  1. 予約確定時に「グループキー」を付与。`group_identifier = hash(email + check_in_date + num_units + room_rateなど)` を導出し、予約レコードに保存。
  2. Cron の再送成功 or FastAPI からの webhook（将来実装）で `sync_status` を `complete` に変更する際、同じ `group_identifier` かつ `created_at` が古い予約で `sync_status IN ('pending', 'failed')` を `complete` に一括更新し、`superseded_by` に完了した新しい予約 ID を入れる。
  3. これにより、ユーザーが再予約に成功したら旧レコードも完了扱いとしてクローズされる。
- フロントから再送を行うケース（Cron による再送）でも、同じレコードを更新するため `superseded_by` は利用しないが、別予約を作った場合もケアできる。

### 5. エラーハンドリング & ログ

- 成功・失敗の各分岐で `console.log` に加え構造化データを吐き、LogDrain などで後追い可能にする。
- Re-fetch/再送処理の実行結果は Cron 応答 JSON に含める（`results` 配列に `resendStatus` などを追加）。

### 6. テスト計画

1. ローカルまたは staging で `sync_status = 'pending'` のダミー予約を作成し、Cron を手動実行 (`curl -H "Authorization: Bearer <CRON_API_KEY>" /api/cron/check-pending-reservations`)。`error_count` 1 回目は更新のみ、2 回目で FastAPI へリクエストが飛ぶことを確認。
2. FastAPI 側をモックし 500 を返す → `sync_status = 'failed'`、`error_count` 変化、メール通知が走ることを確認。
3. FastAPI 成功応答で `sync_status` が `complete` になり、`error_count` が 0 へ戻るか確認。
4. 予約取り直しテスト：同じ顧客情報の新予約を `complete` にした際、旧予約が `complete` + `superseded_by` 更新されることを確認。
5. `sync_status = 'failed'` から Cron が再送を実施し成功するシナリオを確認。

## 実装ステップ

1. Supabase へのマイグレーション作成 (`pending_count` → `error_count`、新フィールド追加)。
2. `src/lib/reservationSync.ts` を追加し、 FastAPI 再送ユーティリティを実装。
3. Cron ルートを改修し、抽出条件・再送処理・メール通知の分岐を組み替える。
4. `PaymentAndPolicy.tsx` から参照している `pending_count` を `error_count` 名にリネーム（送信 payload も同様）。
5. 予約取り直し用の `group_identifier` 生成ロジックをフロント/バック共通ユーティリティとして実装し、レコード保存時にセット。Cron で `complete` 更新時に関連レコードを更新。
6. ログ整備とユニットテスト／結合テスト（必要に応じて `msw` 等で FastAPI モック）。

