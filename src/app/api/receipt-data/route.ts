import { NextRequest, NextResponse } from 'next/server';
import { createReceiptDataFromStripe } from '@/utils/email';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'PaymentIntent ID is required' },
        { status: 400 }
      );
    }

    console.log('API: Creating receipt data for PaymentIntent:', paymentIntentId);

    const receiptData = await createReceiptDataFromStripe(paymentIntentId);

    if (!receiptData) {
      return NextResponse.json(
        { error: 'Failed to create receipt data' },
        { status: 404 }
      );
    }

    return NextResponse.json({ receiptData });
  } catch (error) {
    console.error('API Error creating receipt data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 