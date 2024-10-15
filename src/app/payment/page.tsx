'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/app/components/reservation/CheckoutForm'; // インポートパスを正しく修正
import { useReservation } from '@/app/contexts/ReservationContext';
import { Appearance, StripeElementsOptions } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { state } = useReservation();

  useEffect(() => {
    // サーバーからclientSecretを取得
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(state.totalPrice), // 金額を整数に変換（円単位）
        // 必要に応じて他のデータを渡す
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Error creating PaymentIntent:', error);
      });
  }, [state.totalPrice]);

  const appearance: Appearance = {
    theme: 'stripe', // 'stripe' | 'flat' | 'night' | 'none'
  };

  const options: StripeElementsOptions = {
    clientSecret: clientSecret!,
    appearance,
  };

  return (
    <div className="payment-page">
      <h1>お支払い情報の入力</h1>
      {clientSecret ? (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm />
        </Elements>
      ) : (
        <div>お支払い情報を読み込んでいます...</div>
      )}
    </div>
  );
}
