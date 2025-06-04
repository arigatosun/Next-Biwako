import { NextResponse } from 'next/server';
import { sendReservationEmails } from '@/utils/email';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/app/types/supabase';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { reservationId } = await req.json();

    if (!reservationId) {
      return NextResponse.json(
        { error: '予約IDが指定されていません' },
        { status: 400 }
      );
    }

    // データベースから予約情報を取得
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (error || !reservation) {
      console.error('Error fetching reservation:', error);
      return NextResponse.json(
        { error: '予約が見つかりませんでした' },
        { status: 404 }
      );
    }

    // 既に送信済みかチェック
    const { data: existingLogs } = await supabase
      .from('email_send_logs')
      .select('*')
      .eq('reservation_id', reservationId)
      .eq('email_type', 'payment_success');

    if (existingLogs && existingLogs.length > 0) {
      console.log(`Payment success emails already sent for reservation ${reservationId}`);
      return NextResponse.json(
        { message: 'メールは既に送信済みです', alreadySent: true },
        { status: 200 }
      );
    }

    // 支払い状態を確認（クレジットカード決済の場合）
    if (reservation.payment_method === 'credit') {
      // 決済状態のログ出力
      console.log(`Payment status check for reservation ${reservationId}:`, {
        current_payment_status: reservation.payment_status,
        current_reservation_status: reservation.reservation_status,
        payment_method: reservation.payment_method
      });

      // 既に決済完了済みの場合は更新不要
      if (reservation.payment_status !== 'succeeded') {
        console.log(`Payment status is not 'succeeded', current status: ${reservation.payment_status}`);
        
        // 注意：決済が実際に完了していない可能性があるため、ステータス更新は行わない
        // 決済完了は実際のStripe決済確認処理でのみ行うべき
        console.warn(`Warning: Reservation ${reservationId} has payment_method='credit' but payment_status='${reservation.payment_status}'. This may indicate a payment processing issue.`);
      } else {
        console.log(`Payment already confirmed for reservation ${reservationId}`);
      }
    }

    // check_in_date の処理
    let checkInDate: string;
    if (typeof reservation.check_in_date === 'string') {
      checkInDate = reservation.check_in_date;
    } else if (
      typeof reservation.check_in_date === 'object' &&
      reservation.check_in_date !== null
    ) {
      const { year, month, day } = reservation.check_in_date;
      checkInDate = `${year}-${String(month).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
    } else {
      throw new Error('Invalid check_in_date format');
    }

    // guest_counts のパース
    const guestCounts =
      typeof reservation.guest_counts === 'string'
        ? JSON.parse(reservation.guest_counts)
        : reservation.guest_counts;

    // meal_plans のパース
    const mealPlans =
      typeof reservation.meal_plans === 'string'
        ? JSON.parse(reservation.meal_plans)
        : reservation.meal_plans;

    // totalAmount の処理（null チェック）
    const totalAmount = reservation.payment_amount
      ? reservation.payment_amount.toString()
      : '0';

    // 支払い方法の表示用テキスト
    const paymentMethodDisplay = reservation.payment_method === 'credit' 
      ? 'クレジットカード決済' 
      : '現地決済';

    // reservationData オブジェクトを作成
    const reservationData = {
      guestEmail: reservation.email,
      guestName: reservation.name,
      adminEmail: process.env.ADMIN_EMAIL || 'info.nest.biwako@gmail.com',
      planName: reservation.plan_name || 'プラン名未設定',
      checkInDate: checkInDate,
      nights: Number(reservation.num_nights),
      units: Number(reservation.num_units),
      guestCounts: guestCounts,
      guestInfo: {
        email: reservation.email,
        phone: reservation.phone_number,
      },
      paymentMethod: paymentMethodDisplay,
      totalAmount: totalAmount,
      specialRequests: reservation.special_requests,
      reservationNumber: reservation.reservation_number,
      mealPlans: mealPlans,
      purpose: reservation.purpose || '未設定',
      pastStay: reservation.past_stay,
    };

    // 予約確認メールを送信
    await sendReservationEmails(reservationData);

    // 送信履歴を記録（ゲストと管理者の両方）
    const emailLogs = [
      {
        reservation_id: reservationId,
        email_type: 'payment_success',
        recipient_type: 'guest',
        recipient_email: reservation.email
      },
      {
        reservation_id: reservationId,
        email_type: 'payment_success',
        recipient_type: 'admin',
        recipient_email: reservationData.adminEmail
      }
    ];

    const { error: logError } = await supabase
      .from('email_send_logs')
      .insert(emailLogs);

    if (logError) {
      console.error('Error logging email send:', logError);
    }

    return NextResponse.json(
      { message: '予約確認メールを送信しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return NextResponse.json(
      { error: 'メールの送信に失敗しました' },
      { status: 500 }
    );
  }
} 