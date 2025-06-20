import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/app/types/supabase';
import Stripe from 'stripe';
import { createReceiptDataFromStripe, sendReservationEmailsWithReceipt } from '@/utils/email';

// Supabaseクライアントの初期化（サービスロールキー使用）
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase URL or service role key');
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Stripeクライアントの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

// ヘルパー関数：FastAPIにデータ送信
async function sendReservationData(reservationData: any) {
  const FASTAPI_ENDPOINT = "https://44fd-34-97-99-223.ngrok-free.app/create_reservation";
  
  try {
    const response = await fetch(FASTAPI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reservationData),
    });

    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.status}`);
    }

    const result = await response.json();
    console.log("FastAPI response:", result);
    return result;
  } catch (error) {
    console.error("FastAPI error:", error);
    throw error;
  }
}

// ヘルパー関数：メール送信
async function sendReservationEmails(reservationData: any, paymentMethodString: string) {
  try {
    // クレジットカード決済の場合は領収書付きメールを送信
    if (reservationData.payment_method === 'credit' && reservationData.stripe_payment_intent_id) {
      // Stripeから領収書データを取得
      const receiptData = await createReceiptDataFromStripe(reservationData.stripe_payment_intent_id);
      
      // メール送信用のデータを準備
      const emailData = {
        guestEmail: reservationData.email,
        guestName: reservationData.name,
        adminEmail: process.env.ADMIN_EMAIL || 'info.nest.biwako@gmail.com',
        planName: reservationData.plan_name || '【一棟貸切】贅沢選びつくしヴィラプラン',
        checkInDate: typeof reservationData.check_in_date === 'string' 
          ? reservationData.check_in_date 
          : new Date(reservationData.check_in_date).toISOString().split('T')[0],
        nights: reservationData.num_nights,
        units: reservationData.num_units,
        guestCounts: reservationData.guest_counts,
        guestInfo: {
          email: reservationData.email,
          phone: reservationData.phone_number,
        },
        paymentMethod: paymentMethodString,
        totalAmount: (reservationData.payment_amount || reservationData.total_amount || 0).toLocaleString(),
        specialRequests: reservationData.special_requests || "",
        reservationNumber: reservationData.reservation_number,
        mealPlans: reservationData.meal_plans || {},
        purpose: reservationData.purpose || '未設定',
        pastStay: reservationData.past_stay || false,
        receiptData: receiptData || undefined, // nullをundefinedに変換
      };

      // 領収書付きメール送信
      await sendReservationEmailsWithReceipt(emailData, reservationData.stripe_payment_intent_id);
      
    } else {
      // 現地決済の場合は通常のメール送信（既存機能を使用する場合）
      console.log("現地決済のため、通常のメール送信を行います");
      // 通常のsendReservationEmails関数を呼び出す場合はここに実装
    }
    
    console.log("Reservation emails sent successfully");
  } catch (error) {
    console.error("Error sending reservation emails:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { reservationNumber, email } = await request.json();

    if (!reservationNumber || !email) {
      return NextResponse.json({ error: '予約番号またはメールアドレスがありません' }, { status: 400 });
    }

    console.log('Processing payment completion for:', { reservationNumber, email });

    // 既存の予約データを取得
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_number', reservationNumber)
      .eq('email', email)
      .single();

    if (fetchError || !reservation) {
      console.error('Reservation not found:', fetchError);
      return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 });
    }

    console.log('Found reservation:', {
      id: reservation.id,
      payment_status: reservation.payment_status,
      reservation_status: reservation.reservation_status,
      stripe_payment_intent_id: reservation.stripe_payment_intent_id
    });

    // 既に決済完了済みの場合
    if (reservation.payment_status === 'succeeded') {
      console.log('Payment already completed for reservation:', reservation.id);
      return NextResponse.json({ 
        success: true, 
        reservationId: reservation.id,
        message: '決済は既に完了しています'
      });
    }

    // StripeのPaymentIntentを確認
    if (!reservation.stripe_payment_intent_id) {
      console.error('No PaymentIntent ID found for reservation:', reservation.id);
      return NextResponse.json({ error: 'PaymentIntent IDが見つかりません' }, { status: 400 });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(reservation.stripe_payment_intent_id);
      
      console.log('PaymentIntent status:', paymentIntent.status);

      if (paymentIntent.status === 'succeeded') {
        // 決済成功：予約ステータスを更新
        const { error: updateError } = await supabase
          .from('reservations')
          .update({
            payment_status: 'succeeded',
            reservation_status: 'confirmed'
          })
          .eq('id', reservation.id);

        if (updateError) {
          console.error('Error updating reservation status:', updateError);
          return NextResponse.json({ error: 'ステータス更新に失敗しました' }, { status: 500 });
        }

        console.log('Reservation status updated to confirmed for ID:', reservation.id);

        // 後続処理（FastAPI、メール送信、クーポン更新）
        try {
          // FastAPIへデータ送信
          await sendReservationData({
            ...reservation,
            payment_status: 'succeeded',
            reservation_status: 'confirmed'
          });
          console.log("FastAPI data sent successfully");
        } catch (fastApiError) {
          console.error("FastAPI error (continuing):", fastApiError);
          // FastAPIエラーは処理を停止しない
        }

        try {
          // メール送信前に既存のログをチェック
          const { data: existingEmailLogs } = await supabase
            .from('email_send_logs')
            .select('*')
            .eq('reservation_id', reservation.id)
            .eq('email_type', 'payment_success');

          if (!existingEmailLogs || existingEmailLogs.length === 0) {
            // メール送信
            await sendReservationEmails(reservation, "クレジットカード決済");
            console.log("Reservation emails sent successfully");

            // 送信履歴を記録
            const emailLogs = [
              {
                reservation_id: reservation.id,
                email_type: 'payment_success',
                recipient_type: 'guest',
                recipient_email: reservation.email
              },
              {
                reservation_id: reservation.id,
                email_type: 'payment_success',
                recipient_type: 'admin',
                recipient_email: process.env.ADMIN_EMAIL || 'info.nest.biwako@gmail.com'
              }
            ];

            const { error: logError } = await supabase
              .from('email_send_logs')
              .insert(emailLogs);

            if (logError) {
              console.error('Error logging email send:', logError);
            }
          } else {
            console.log("Payment success emails already sent for this reservation, skipping...");
          }
        } catch (emailError) {
          console.error("Email error (continuing):", emailError);
          // メールエラーは処理を停止しない
        }

        // クーポンを使用済みに設定
        if (reservation.coupon_code && reservation.coupon_code !== "LEAFKYOTO") {
          try {
            const { error: couponError } = await supabase
              .from("coupons")
              .update({ is_used: true })
              .eq("code", reservation.coupon_code);

            if (couponError) {
              console.error("Error updating coupon status:", couponError);
            } else {
              console.log("Coupon marked as used:", reservation.coupon_code);
            }
          } catch (couponError) {
            console.error("Coupon update error (continuing):", couponError);
          }
        }

        return NextResponse.json({ 
          success: true, 
          reservationId: reservation.id,
          message: '決済が完了し、予約が確定しました'
        });

      } else if (paymentIntent.status === 'requires_action' || 
                 paymentIntent.status === 'requires_confirmation' ||
                 paymentIntent.status === 'processing') {
        // まだ決済処理中
        console.log('Payment still processing, status:', paymentIntent.status);
        return NextResponse.json({ 
          success: false, 
          processing: true,
          message: '決済処理中です'
        });

      } else {
        // 決済失敗
        console.log('Payment failed, status:', paymentIntent.status);
        
        // 予約ステータスを失敗に更新
        const { error: updateError } = await supabase
          .from('reservations')
          .update({
            payment_status: 'failed',
            reservation_status: 'cancelled'
          })
          .eq('id', reservation.id);

        if (updateError) {
          console.error('Error updating failed reservation status:', updateError);
        }

        return NextResponse.json({ 
          success: false, 
          error: '決済に失敗しました'
        }, { status: 400 });
      }

    } catch (stripeError) {
      console.error('Error retrieving PaymentIntent:', stripeError);
      return NextResponse.json({ 
        error: 'Stripe決済情報の取得に失敗しました' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing payment completion:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
} 