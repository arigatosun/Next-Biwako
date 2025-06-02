-- メール送信履歴を管理するテーブルを作成
CREATE TABLE IF NOT EXISTS email_send_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- 'reservation_confirmation', 'payment_success', 'cancellation', etc.
  recipient_type VARCHAR(20) NOT NULL, -- 'guest', 'admin'
  recipient_email VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 同じ予約IDで同じメールタイプ、同じ受信者タイプの組み合わせは一意
  CONSTRAINT unique_email_send UNIQUE (reservation_id, email_type, recipient_type)
);

-- インデックスを作成してクエリパフォーマンスを向上
CREATE INDEX idx_email_send_logs_reservation_id ON email_send_logs(reservation_id);
CREATE INDEX idx_email_send_logs_sent_at ON email_send_logs(sent_at);