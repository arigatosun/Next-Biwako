// app/api/create-payment-intent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Stripeのシークレットキーを環境変数から取得
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(request: NextRequest) {
  try {
    const { amount, paymentIntentId } = await request.json();

    let paymentIntent;

    if (paymentIntentId) {
      // 既存の PaymentIntent を更新
      paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
        amount,
      });
    } else {
      // 新しい PaymentIntent を作成
      paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'jpy',
        payment_method_types: ['card'],
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating or updating payment intent:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
