// app/api/cron-update-reservation-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { toZonedTime } from 'date-fns-tz';

export async function GET(request: NextRequest) {
  // リクエストの認証
  const userAgent = request.headers.get('user-agent');
  if (userAgent !== 'vercel-cron/1.0') {
    console.error('不正なアクセス試行');
    return NextResponse.json({ error: '認証されていません' }, { status: 401 });
  }

  console.log(
    `[${new Date().toISOString()}] 予約ステータス更新のCronジョブを開始します...`
  );

  try {
    // 日本時間のタイムゾーン
    const timeZone = 'Asia/Tokyo';

    // 現在の日本時間の日付を取得
    const now = toZonedTime(new Date(), timeZone);
    now.setHours(0, 0, 0, 0); // 時刻を0時に設定

    // 3日前の日付を計算
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);

    // 3日前の終わりの時刻を設定
    const endOfThreeDaysAgo = new Date(threeDaysAgo);
    endOfThreeDaysAgo.setHours(23, 59, 59, 999); // 3日前の23:59:59に設定

    console.log(
      `現在日時（日本時間）: ${now.toISOString()}, 3日前の終了時刻: ${endOfThreeDaysAgo.toISOString()}`
    );

    // 対象の予約を取得
    const { data: reservations, error } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .in('reservation_status', ['pending', 'confirmed'])
      .lte('check_in_date', endOfThreeDaysAgo.toISOString());

    if (error) {
      console.error('予約の取得中にエラーが発生しました:', error);
      return NextResponse.json(
        { error: '予約の取得中にエラーが発生しました' },
        { status: 500 }
      );
    }

    console.log(`更新対象の予約数: ${reservations.length} 件`);

    if (reservations.length > 0) {
      // 更新する予約のIDを取得
      const reservationIds = reservations.map((reservation) => reservation.id);

      // 予約ステータスを 'processing' に更新
      const { data, error: updateError } = await supabaseAdmin
        .from('reservations')
        .update({ reservation_status: 'processing' })
        .in('id', reservationIds);

      if (updateError) {
        console.error('予約の更新中にエラーが発生しました:', updateError);
        return NextResponse.json(
          { error: '予約の更新中にエラーが発生しました' },
          { status: 500 }
        );
      }

      console.log(
        `${reservationIds.length} 件の予約ステータスを 'processing' に更新しました。`
      );
    } else {
      console.log('更新対象の予約はありません。');
    }

    return NextResponse.json(
      { message: '予約ステータス更新のCronジョブが完了しました。' },
      { status: 200 }
    );
  } catch (err) {
    console.error('予約ステータス更新のCronジョブ中にエラーが発生しました:', err);
    return NextResponse.json(
      { error: '予約ステータス更新のCronジョブ中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
