import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Reservation } from '@/app/types/supabase'; // Reservation型をインポート

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET!) as { reservationNumber: string };
    const supabase = createRouteHandlerClient({ cookies });

    // 予約情報を取得
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_number', decodedToken.reservationNumber)
      .single();

    if (fetchError || !reservation) {
      console.error('Error fetching reservation:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 });
    }

    // キャンセル料を計算
    const cancellationFee = calculateCancellationFee(reservation);

    // 予約ステータスを更新し、キャンセル料を保存
    const { data, error } = await supabase
      .from('reservations')
      .update({ 
        reservation_status: 'customer_cancelled',
        cancellation_fee: cancellationFee
      })
      .eq('reservation_number', decodedToken.reservationNumber)
      .select();

    if (error) {
      console.error('Error cancelling reservation:', error);
      return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Reservation cancelled successfully', data, cancellationFee });
  } catch (error) {
    console.error('Error processing cancel request:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

function calculateCancellationFee(reservation: Reservation): number {
  const checkInDate = new Date(reservation.check_in_date);
  const currentDate = new Date();
  const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));

  let cancellationFee = 0;

  if (daysUntilCheckIn <= 7) {
    // 7日前以降は100%のキャンセル料（手数料込み）
    cancellationFee = reservation.total_amount;
  } else if (daysUntilCheckIn <= 30) {
    // 30日前〜8日前は50%のキャンセル料（手数料込み）
    cancellationFee = reservation.total_amount * 0.5;
  }

  // クレジットカード決済の場合のみ、追加のStripe手数料を計算
  if (reservation.payment_method === 'credit' && daysUntilCheckIn > 30) {
    const stripeFee = reservation.total_amount * 0.036; // 3.6%のStripe手数料
    cancellationFee += stripeFee;
  }

  return Number(cancellationFee.toFixed(2)); // 小数点第2位まで丸める
}
