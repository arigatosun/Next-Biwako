// app/api/create-payment-intent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Stripeのシークレットキーを環境変数から取得
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();

    // PaymentIntentを作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'jpy',
      payment_method_types: ['card'],
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
