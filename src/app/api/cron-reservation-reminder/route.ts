// app/api/cron-reservation-reminder/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendReminderEmail, sendThankYouEmail } from '@/utils/email';
import { toZonedTime } from 'date-fns-tz'; // インポートを修正

export async function GET(request: NextRequest) {
  // リクエストヘッダーをログ出力（デバッグ用）
  console.log(
    'リクエストヘダー:',
    JSON.stringify(Object.fromEntries(request.headers.entries()))
  );

  // User-Agent ヘッダーを確認して認証
  const userAgent = request.headers.get('user-agent');
  if (userAgent !== 'vercel-cron/1.0') {
    console.error('不正なアクセス試行');
    return NextResponse.json({ error: '認証されていません' }, { status: 401 });
  }

  console.log(
    `[${new Date().toISOString()}] リマインドメールとお礼メールのCronジョブを開始します...`
  );

  try {
    // 日本時間のタイムゾーン
    const timeZone = 'Asia/Tokyo';

    // 現在の日本時間の日付を取得
    const now = toZonedTime(new Date(), timeZone); // 関数名を修正
    now.setHours(0, 0, 0, 0); // 時間をクリア

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
      // 1日前のリマインダーを追加
      {
        daysBefore: 1,
        info: `
ご利用日が近づいて参りましたので、ご予約内容の確認をお願いします。
        `,
        cancel: `
キャンセルポリシー:
・30日前～50％
・7日前～100％
        `,
        emailTemplate: 'OneDayBeforeReminderEmail', // 新しいメールテンプレートを指定
      },
    ];

    // リマインドメールの処理
    for (const reminder of reminders) {
      // 対象日の計算（日本時間）
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + reminder.daysBefore);

      // 対象日の開始と終了
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // 対象日の予約を取得
      const { data: reservations, error } = await supabaseAdmin
        .from('reservations')
        .select(`
          id,
          reservation_number,
          name,
          email,
          check_in_date,
          reservation_status,
          payment_method,
          num_nights,
          num_units,
          num_male,
          num_female,
          num_child_with_bed,
          num_child_no_bed,
          transportation_method,
          estimated_check_in_time,
          special_requests,
          payment_amount
        `)
        .in('reservation_status', ['confirmed', 'pending']) // ステータスが 'confirmed' または 'pending' の予約を取得
        .like('reservation_number', 'RES%') // reservation_number が 'RES' で始まる
        .gte('check_in_date', startOfDay.toISOString())
        .lte('check_in_date', endOfDay.toISOString());

      if (error) {
        console.error(
          `予約の取得中にエラーが発生しました (daysBefore: ${reminder.daysBefore}):`,
          error
        );
        continue;
      }

      console.log(
        `【${reminder.daysBefore}日前のリマインド】取得した予約数: ${reservations.length}`
      );

      for (const reservation of reservations) {
        const {
          id: reservationId,
          name,
          email,
          check_in_date,
          payment_method,
          num_nights,
          num_units,
          num_male,
          num_female,
          num_child_with_bed,
          num_child_no_bed,
          transportation_method,
          estimated_check_in_time,
          special_requests,
          payment_amount,
        } = reservation;

        // 送信済みかどうかを確認
        const { data: sentLog, error: logError } = await supabaseAdmin
          .from('reservation_reminder_logs')
          .select('id')
          .eq('reservation_id', reservationId)
          .eq('reminder_type', reminder.daysBefore)
          .single();

        if (logError && logError.code !== 'PGRST116') {
          console.error(
            `予約 ${reservationId} の送信ログ確認中にエラーが発生しました:`,
            logError
          );
          continue;
        }

        if (sentLog) {
          console.log(
            `予約 ${reservationId} に対してリマインドメール (daysBefore: ${reminder.daysBefore}) は既に送信済みです`
          );
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
          if (reminder.daysBefore === 1) {
            // 1日前のリマインドメールの場合
            await sendReminderEmail({
              email,
              name,
              checkInDate: check_in_date,
              info: reminder.info,
              cancel: reminder.cancel + additionalInfo,
              template: 'OneDayBeforeReminderEmail',
              stayNights: num_nights,
              rooms: num_units,
              guests: {
                male: num_male,
                female: num_female,
                childWithBed: num_child_with_bed,
                childNoBed: num_child_no_bed,
              },
              paymentMethod:
                payment_method === 'onsite' ? '現地決済' : 'クレジットカード決済',
              arrivalMethod: transportation_method,
              checkInTime: estimated_check_in_time,
              specialRequests: special_requests,
              totalAmount: payment_amount,
            });
          } else {
            // 他のリマインドメールの場合
            await sendReminderEmail({
              email,
              name,
              checkInDate: check_in_date,
              info: reminder.info,
              cancel: reminder.cancel + additionalInfo,
            });
          }

          console.log(
            `予約 ${reservationId} にリマインドメールを送信しました (daysBefore: ${reminder.daysBefore})`
          );

          // 送信ログを記録
          const { error: insertError } = await supabaseAdmin
            .from('reservation_reminder_logs')
            .insert({
              reservation_id: reservationId,
              reminder_type: reminder.daysBefore,
              sent_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error(
              `予約 ${reservationId} の送信ログ保存中にエラーが発生しました:`,
              insertError
            );
          }
        } catch (emailError) {
          console.error(
            `予約 ${reservationId} にメールを送信中にエラーが発生しました:`,
            emailError
          );
        }
      }
    }

    // お礼メールの処理
    // 宿泊終了日の翌日に送信
    {
      // 対象日の計算（日本時間）
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - 1); // 前日

      // 対象日の開始と終了
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // 対象の予約を取得
      const { data: reservations, error } = await supabaseAdmin
        .from('reservations')
        .select(`
          id,
          reservation_number,
          name,
          email,
          check_in_date,
          num_nights,
          reservation_status
        `)
        .in('reservation_status', ['confirmed', 'pending'])
        .like('reservation_number', 'RES%')
        .lte('check_in_date', startOfDay.toISOString())
        .order('check_in_date', { ascending: true });

      if (error) {
        console.error(`お礼メール用の予約の取得中にエラーが発生しました:`, error);
      } else {
        for (const reservation of reservations) {
          const {
            id: reservationId,
            name,
            email,
            check_in_date,
            num_nights,
          } = reservation;

          // 宿泊終了日を計算
          const checkOutDate = new Date(check_in_date);
          checkOutDate.setDate(checkOutDate.getDate() + num_nights);

          // 宿泊終了日の翌日が現在の日付と一致するか確認
          const thankYouDate = new Date(checkOutDate);
          thankYouDate.setDate(thankYouDate.getDate());

          // 日本時間で比較
          const thankYouDateJST = toZonedTime(thankYouDate, timeZone); // 関数名を修正
          const nowJST = toZonedTime(now, timeZone); // 関数名を修正

          if (
            thankYouDateJST.getFullYear() === nowJST.getFullYear() &&
            thankYouDateJST.getMonth() === nowJST.getMonth() &&
            thankYouDateJST.getDate() === nowJST.getDate()
          ) {
            // 送信済みかどうかを確認
            const { data: sentLog, error: logError } = await supabaseAdmin
              .from('reservation_reminder_logs')
              .select('id')
              .eq('reservation_id', reservationId)
              .eq('reminder_type', 'thank_you')
              .single();

            if (logError && logError.code !== 'PGRST116') {
              console.error(
                `予約 ${reservationId} のお礼メール送信ログ確認中にエラーが発生しました:`,
                logError
              );
              continue;
            }

            if (sentLog) {
              console.log(
                `予約 ${reservationId} に対してお礼メールは既に送信済みです`
              );
              continue;
            }

            // お礼メールの送信
            try {
              await sendThankYouEmail({
                email,
                name,
              });

              console.log(`予約 ${reservationId} にお礼メールを送信しました`);

              // 送信ログを記録
              const { error: insertError } = await supabaseAdmin
                .from('reservation_reminder_logs')
                .insert({
                  reservation_id: reservationId,
                  reminder_type: 'thank_you',
                  sent_at: new Date().toISOString(),
                });

              if (insertError) {
                console.error(
                  `予約 ${reservationId} のお礼メール送信ログ保存中にエラーが発生しました:`,
                  insertError
                );
              }
            } catch (emailError) {
              console.error(
                `予約 ${reservationId} にお礼メールを送信中にエラーが発生しました:`,
                emailError
              );
            }
          }
        }
      }
    }

    return NextResponse.json(
      { message: 'リマインドメールとお礼メールのCronジョブが完了しました。' },
      { status: 200 }
    );
  } catch (err) {
    console.error(
      'リマインドメールとお礼メールのCronジョブ中にエラーが発生しました:',
      err
    );
    return NextResponse.json(
      { error: 'リマインドメールとお礼メールのCronジョブ中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
