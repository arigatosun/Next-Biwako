// app/api/cron-reservation-reminder/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendReminderEmail } from '@/utils/email';

// 認証トークン
const CRON_SECRET = process.env.CRON_SECRET_KEY!;

export async function GET(request: NextRequest) {
  // 認証チェック
  if (request.headers.get('Authorization') !== `Bearer ${CRON_SECRET}`) {
    console.error('不正なアクセス試行');
    return NextResponse.json({ error: '認証されていません' }, { status: 401 });
  }

  console.log(`[${new Date().toISOString()}] リマインドメールのCronジョブを開始します...`);

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // UTC時間で時間をクリア

    // リマインドメールのタイミングと内容の定義
    const reminders = [
      {
        daysBefore: 33,
        info: `
30日前になるとキャンセルに50％の料金がかかります。
7日前になると100％の料金が必要になります。
        `,
        cancel: `
・30日前までのキャンセル：宿泊料金の50％
・7日前までのキャンセル：宿泊料金の100％
        `,
      },
      {
        daysBefore: 10,
        info: `
7日前になるとキャンセルに100％の料金が必要になります。
        `,
        cancel: `
・7日前までのキャンセル：宿泊料金の100％
        `,
      },
    ];

    for (const reminder of reminders) {
      const targetDate = new Date(today);
      targetDate.setUTCDate(today.getUTCDate() + reminder.daysBefore);
      targetDate.setUTCHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setUTCDate(targetDate.getUTCDate() + 1);
      nextDay.setUTCHours(0, 0, 0, 0);

      // 対象日の予約を取得
      const { data: reservations, error } = await supabaseAdmin
        .from('reservations')
        .select(`
          id,
          name,
          email,
          check_in_date,
          reservation_status,
          payment_method
        `)
        .eq('reservation_status', 'confirmed')
        .gte('check_in_date', targetDate.toISOString())
        .lt('check_in_date', nextDay.toISOString());

      if (error) {
        console.error(`予約の取得中にエラーが発生しました (daysBefore: ${reminder.daysBefore}):`, error);
        continue;
      }

      console.log(`【${reminder.daysBefore}日前のリマインド】取得した予約数: ${reservations.length}`);

      for (const reservation of reservations) {
        const { id: reservationId, name, email, check_in_date, payment_method } = reservation;

        // 送信済みかどうかを確認
        const { data: sentLog, error: logError } = await supabaseAdmin
          .from('reservation_reminder_logs')
          .select('id')
          .eq('reservation_id', reservationId)
          .eq('reminder_type', reminder.daysBefore)
          .single();

        if (logError && logError.code !== 'PGRST116') { // PGRST116: No rows found
          console.error(`予約 ${reservationId} の送信ログ確認中にエラーが発生しました:`, logError);
          continue;
        }

        if (sentLog) {
          console.log(`予約 ${reservationId} に対してリマインドメール (daysBefore: ${reminder.daysBefore}) は既に送信済みです`);
          continue;
        }

        // 支払い方法に応じて手数料情報を追加
        let additionalInfo = '';
        if (payment_method === 'credit') {
          additionalInfo = `
カード決済の場合は30日以上前でも3.6%の手数料がかかります。
          `;
        }

        // メール送信
        try {
          await sendReminderEmail({
            email,
            name,
            checkInDate: check_in_date,
            info: reminder.info,
            cancel: reminder.cancel + additionalInfo,
          });

          console.log(`予約 ${reservationId} にリマインドメールを送信しました (daysBefore: ${reminder.daysBefore})`);

          // 送信ログを記録
          const { error: insertError } = await supabaseAdmin
            .from('reservation_reminder_logs')
            .insert({
              reservation_id: reservationId,
              reminder_type: reminder.daysBefore,
              sent_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error(`予約 ${reservationId} の送信ログ保存中にエラーが発生しました:`, insertError);
          }
        } catch (emailError) {
          console.error(`予約 ${reservationId} にメールを送信中にエラーが発生しました:`, emailError);
        }
      }
    }

    return NextResponse.json({ message: 'リマインドメールのCronジョブが完了しました。' }, { status: 200 });
  } catch (err) {
    console.error('リマインドメールのCronジョブ中にエラーが発生しました:', err);
    return NextResponse.json({ error: 'リマインドメールのCronジョブ中にエラーが発生しました' }, { status: 500 });
  }
}
