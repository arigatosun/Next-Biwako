// app/api/cancel-reservation/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Reservation, Database } from '@/app/types/supabase';
import { sendCancellationEmails } from '@/utils/email';
import Stripe from 'stripe';

// FastAPI エンドポイントの定義
const FASTAPI_ENDPOINT = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINT || "https://ed3a-2400-4150-78a0-5300-73-182c-e32e-4800.ngrok-free.app/cancel_reservation";

export async function POST(request: NextRequest) {
  try {
    const { reservationNumber, email } = await request.json();

    if (!reservationNumber || !email) {
      return NextResponse.json({ error: '予約番号またはメールアドレスがありません' }, { status: 400 });
    }

    // SupabaseのURLとサービスロールキーを環境変数から取得
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase URL or service role key');
    }

    // サービスロールキーを使用してSupabaseクライアントを初期化
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Stripeクライアントの初期化
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20' as any,
    });

    // 予約情報を取得
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_number', reservationNumber)
      .eq('email', email)
      .single();

    if (fetchError || !reservation) {
      console.error('Error fetching reservation:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 });
    }

    // キャンセル料を計算
    const cancellationFee = calculateCancellationFee(reservation);

    // 予約ステータスを更新
    const { data, error } = await supabase
      .from('reservations')
      .update({
        reservation_status: 'customer_cancelled',
        cancellation_fee: cancellationFee,
      })
      .eq('id', reservation.id)
      .select();

    if (error) {
      console.error('Error cancelling reservation:', error);
      return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 });
    }

    // Stripeでの返金処理
    if (reservation.payment_method === 'credit' && reservation.stripe_payment_intent_id) {
      const paymentIntentId = reservation.stripe_payment_intent_id;

      // 支払い済みの金額を取得（payment_amountを使用）
      const paidAmount = reservation.payment_amount || reservation.total_amount;

      // 返金額を計算
      const refundAmount = paidAmount - cancellationFee;

      if (refundAmount > 0) {
        // キャンセル料が100%ではない場合、返金処理を実行
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: Math.round(refundAmount), // 100倍しない
        });

        console.log(`Payment Intent ID: ${paymentIntentId} に対して ¥${refundAmount} の返金を行いました。`);
      } else {
        // 返金額が0円以下の場合、Stripe上で何も行わない
        console.log(`返金額が¥0以下のため、Stripeでの返金処理を行いませんでした。`);
      }
    }

    // FastAPIにキャンセルデータを送信
    try {
      const fastApiResponse = await fetch(FASTAPI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: reservation.phone_number,
          check_in_date: reservation.check_in_date,
          cancellation_reason: "お客様キャンセル"
        }),
      });

      const fastApiResult = await fastApiResponse.json();

      if (fastApiResponse.ok) {
        console.log("FastAPI キャンセル処理成功:", fastApiResult);
      } else {
        console.error("FastAPI キャンセル処理エラー:", fastApiResult);
        // キャンセル処理自体は続行する
      }
    } catch (fastApiError) {
      console.error("FastAPI リクエスト送信エラー:", fastApiError);
      // キャンセル処理自体は続行する
    }

    // メール送信のためのデータ準備
   
const cancellationData = {
  guestEmail: reservation.email,
  guestName: reservation.name,
  adminEmail: 'info.nest.biwako@gmail.com',
  cancelDateTime: new Date().toISOString(),
  planName: '【一棟貸切】贅沢選びつくしヴィラプラン',
  roomName: 'ヴィラ名', // 必要に応じて適切な値に置き換えてください
  checkInDate: reservation.check_in_date, // 'YYYY-MM-DD' の形式
  nights: reservation.num_nights,
  units: reservation.num_units,
  guestDetails: reservation.guest_counts,
  guestInfo: {
    email: reservation.email,
    phone: reservation.phone_number,
    // 他の必要な情報を追加
  },
  cancellationFee: cancellationFee.toLocaleString(),
};

    // メール送信
    try {
      await sendCancellationEmails(cancellationData);
      console.log('Cancellation emails sent successfully');
    } catch (emailError) {
      console.error('Error sending cancellation emails:', emailError);
      // 必要に応じてエラーハンドリング
    }

    return NextResponse.json({ message: 'Reservation cancelled successfully', data, cancellationFee });
  } catch (error) {
    console.error('Error processing cancel request:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}

function calculateCancellationFee(reservation: Reservation): number {
  const checkInDate = new Date(reservation.check_in_date);
  const currentDate = new Date();
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)
  );

  let cancellationFee = 0;
  const baseAmount = reservation.payment_amount || reservation.total_amount;

  if (daysUntilCheckIn <= 7) {
    // 7日前以降は100%のキャンセル料
    cancellationFee = baseAmount;
  } else if (daysUntilCheckIn <= 30) {
    // 30日前〜8日前は50%のキャンセル料
    cancellationFee = baseAmount * 0.5;
  }

  // クレジットカード決済の場合、30日前よりも前のキャンセルでも3.6%の手数料を追加
  if (reservation.payment_method === 'credit' && daysUntilCheckIn > 30) {
    const stripeFee = baseAmount * 0.036; // 3.6%の手数料
    cancellationFee += stripeFee;
  }

  return Number(cancellationFee.toFixed(2)); // 小数点第2位まで丸める
}
