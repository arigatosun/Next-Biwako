// app/api/send-reservation-email/route.ts

import { NextResponse } from 'next/server';
import { sendReservationEmails, sendReservationEmailsWithReceipt, createReceiptDataFromStripe } from '@/utils/email';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/app/types/supabase';

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // 予約データを検証
    if (!requestData.guestEmail || !requestData.guestName) {
      return NextResponse.json({ error: 'Guest information is required' }, { status: 400 });
    }

    console.log('Payment method:', requestData.paymentMethod);
    console.log('Stripe PaymentIntent ID:', requestData.stripePaymentIntentId);

    // adminEmail を追加
    const reservationData = {
      ...requestData,
      adminEmail: process.env.ADMIN_EMAIL || 'info.nest.biwako@gmail.com'
    };

    // クレジットカード決済の場合は領収書付きメール送信
    if (reservationData.paymentMethod === 'クレジットカード決済' && requestData.stripePaymentIntentId) {
      console.log('Sending credit card payment email with receipt...');
      
      try {
        // Stripeから領収書データを取得
        const receiptData = await createReceiptDataFromStripe(requestData.stripePaymentIntentId);
        
        if (receiptData) {
          console.log('Receipt data obtained from Stripe:', receiptData.receiptNumber);
          
          // 領収書データを追加
          const emailDataWithReceipt = {
            ...reservationData,
            receiptData: receiptData
          };

          // 領収書付きメール送信
          await sendReservationEmailsWithReceipt(emailDataWithReceipt, requestData.stripePaymentIntentId);
          console.log('Credit card payment email with receipt sent successfully');
        } else {
          console.log('Could not obtain receipt data from Stripe, creating basic receipt');
          
          // Stripeから取得できない場合でも、基本的な領収書データを作成
          const basicReceiptData = {
            receiptNumber: requestData.stripePaymentIntentId,
            amount: parseInt(requestData.totalAmount.replace(/[^\d]/g, '')), // カンマを除去して数値化
            currency: 'jpy',
            paymentDate: new Date().toISOString(),
            paymentStatus: 'succeeded',
            cardLast4: undefined,
            cardBrand: undefined,
          };

          // 基本的な領収書データでメール送信
          const emailDataWithBasicReceipt = {
            ...reservationData,
            receiptData: basicReceiptData
          };

          await sendReservationEmailsWithReceipt(emailDataWithBasicReceipt, requestData.stripePaymentIntentId);
          console.log('Credit card payment email with basic receipt sent successfully');
        }
      } catch (error) {
        console.error('Error with receipt email, falling back to regular email:', error);
        // エラーの場合は通常のメール送信にフォールバック
        await sendReservationEmails(reservationData);
      }
    } else {
      console.log('Sending regular reservation email (no receipt)...');
      // 現地決済の場合は通常のメール送信
      await sendReservationEmails(reservationData);
    }

    return NextResponse.json({ message: 'Emails sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending reservation emails:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
}
