import { NextResponse } from 'next/server';
import { sendReservationEmails } from '@/utils/email';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/app/types/supabase';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { reservation_number, email } = await req.json();

    // データベースから予約情報を取得
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_number', reservation_number)
      .single();

    if (error || !reservation) {
      return NextResponse.json(
        { error: '予約が見つかりませんでした' },
        { status: 404 }
      );
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

    // guestCounts が存在しない場合の処理
    if (!guestCounts || Object.keys(guestCounts).length === 0) {
      console.error('guestCounts が存在しません');
    }

    const reservationData = {
      guestEmail: email,
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
      paymentMethod: reservation.payment_method,
      totalAmount: reservation.payment_amount.toString(),
      specialRequests: reservation.special_requests,
      reservationNumber: reservation.reservation_number,
    };

    // 予約確認メールを再送信（管理者へのメール送信は行わない）
    await sendReservationEmails(reservationData, false);

    return NextResponse.json(
      { message: '予約確認メールを再送信しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resending confirmation email:', error);
    return NextResponse.json(
      { error: 'メールの再送信に失敗しました' },
      { status: 500 }
    );
  }
}
