import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// 環境変数からSupabaseの接続情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Supabaseクライアントを作成（サーバーサイド用、service roleで十分な権限を持つ）
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Resendのインスタンスを作成
const resend = new Resend(process.env.RESEND_API_KEY || '');

// CRONジョブのAPIエンドポイント
export async function GET(request: NextRequest) {
  try {
    // Vercel Cronからの呼び出しかどうかをチェック
    const isVercelCron = request.headers.get('x-vercel-cron') === 'true';
    
    // Vercel Cronからの呼び出しでない場合はAPIキーをチェック
    if (!isVercelCron) {
      // URLパラメータからAPIキーを取得
      const apiKey = request.nextUrl.searchParams.get('apiKey');
      // 認証ヘッダーからもAPIキーを取得（どちらかが正しければOK）
      const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
      
      // どちらの方法でも正しいAPIキーがない場合はエラー
      if (apiKey !== process.env.CRON_API_KEY && authHeader !== process.env.CRON_API_KEY) {
        return NextResponse.json(
          { error: '不正なAPIキーです' },
          { status: 401 }
        );
      }
    }

    console.log('未同期予約のチェックを開始...');

    // 時間条件を設けず、sync_status が pending の全予約を対象
    const { data: pendingReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('sync_status', 'pending');

    if (fetchError) {
      console.error('Supabaseからの予約取得エラー:', fetchError);
      return NextResponse.json(
        { error: 'データ取得エラー', details: fetchError.message },
        { status: 500 }
      );
    }

    console.log(`検出された未同期予約件数: ${pendingReservations?.length || 0}`);
    if (pendingReservations && pendingReservations.length) {
      console.log('予約ID一覧:', pendingReservations.map(r => r.id).join(','));
    }

    if (!pendingReservations || pendingReservations.length === 0) {
      return NextResponse.json({ message: '処理対象の予約はありません' });
    }

    // 予約ごとに処理
    const results = await Promise.all(
      pendingReservations.map(async (reservation) => {
        // pending_countを増やす
        const newPendingCount = (reservation.pending_count || 0) + 1;
        
        // 更新処理
        const { error: updateError } = await supabase
          .from('reservations')
          .update({
            pending_count: newPendingCount,
            last_pending_checked_at: new Date().toISOString(),
          })
          .eq('id', reservation.id);

        if (updateError) {
          console.error(`予約ID ${reservation.id} の更新エラー:`, updateError);
          return {
            id: reservation.id,
            status: 'error',
            message: updateError.message,
          };
        }

        // 2回以上pendingになっている場合は通知メールを送信
        if (newPendingCount >= 2) {
          try {
            await sendAlertEmail(reservation);
            return {
              id: reservation.id,
              status: 'notified',
              message: `予約ID ${reservation.id} の通知メール送信完了`,
            };
          } catch (emailError: any) {
            console.error(`予約ID ${reservation.id} のメール送信エラー:`, emailError);
            return {
              id: reservation.id,
              status: 'email_error',
              message: emailError.message,
            };
          }
        }

        return {
          id: reservation.id,
          status: 'updated',
          message: `予約ID ${reservation.id} のpending_countを${newPendingCount}に更新`,
        };
      })
    );

    return NextResponse.json({
      message: '未同期予約チェック完了',
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('予約チェック中のエラー:', error);
    return NextResponse.json(
      { error: '処理エラー', details: error.message },
      { status: 500 }
    );
  }
}

// 管理者へのアラートメール送信関数
async function sendAlertEmail(reservation: any) {
  // 人間が読めるフォーマットの日付に変換
  const formattedDate = new Date(reservation.created_at).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // 生成から経過時間を計算
  const createdAt = new Date(reservation.created_at);
  const now = new Date();
  const hoursDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
  const minutesDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60)) % 60;

  // メール本文のHTMLを生成
  const htmlContent = `
    <h2>予約システム同期エラー通知</h2>
    <p>以下の予約がリモートシステムと同期できていない可能性があります。</p>
    
    <h3>予約詳細</h3>
    <ul>
      <li><strong>予約番号:</strong> ${reservation.reservation_number}</li>
      <li><strong>顧客名:</strong> ${reservation.name}</li>
      <li><strong>メール:</strong> ${reservation.email}</li>
      <li><strong>電話番号:</strong> ${reservation.phone_number}</li>
      <li><strong>チェックイン日:</strong> ${reservation.check_in_date}</li>
      <li><strong>予約作成日時:</strong> ${formattedDate}</li>
      <li><strong>経過時間:</strong> ${hoursDiff}時間${minutesDiff}分</li>
      <li><strong>支払い方法:</strong> ${reservation.payment_method}</li>
      <li><strong>予約金額:</strong> ${reservation.payment_amount}円</li>
    </ul>
    
    <p>リモートデスクトップの状態を確認し、必要に応じて手動で予約処理を行ってください。</p>
    <p>問題が解決したら、管理画面から予約の同期ステータスを「complete」に変更してください。</p>
    
    <p>----<br>
    このメールはシステムにより自動送信されています。</p>
  `;

  // 管理者宛メール送信
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@nest-biwako.com',
    to: [process.env.ADMIN_EMAIL || 'info.nest.biwako@gmail.com', 't.koushi@arigatosun.com'],
    subject: `【重要】予約同期エラー - ${reservation.reservation_number}`,
    html: htmlContent,
  });

  if (error) {
    console.error('メール送信エラー:', error);
    throw new Error(`メール送信に失敗しました: ${error.message}`);
  }

  return data;

  // 予約者宛メール送信 (必要に応じて)
  /*
  const { data: customerData, error: customerError } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@nest-biwako.com',
    to: reservation.email,
    subject: `【NEST琵琶湖】ご予約処理中のお知らせ`,
    html: `
      <p>${reservation.name} 様</p>
      <p>この度はNEST琵琶湖へのご予約をいただき、誠にありがとうございます。</p>
      <p>恐れ入りますが、現在ご予約の処理中に技術的な問題が発生しております。</p>
      <p>ご予約番号: ${reservation.reservation_number}</p>
      <p>弊社スタッフが早急に対応いたしますので、しばらくお待ちください。</p>
      <p>ご予約の確認が完了次第、改めてご連絡させていただきます。</p>
      <p>ご不便をおかけし、誠に申し訳ございません。</p>
      <p>何かご不明点がございましたら、お気軽にお問い合わせください。</p>
      <p>--<br>NEST琵琶湖<br>info.nest.biwako@gmail.com</p>
    `,
  });
  */
} 