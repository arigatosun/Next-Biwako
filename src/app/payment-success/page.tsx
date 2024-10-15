// app/payment-success/page.tsx

'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useReservation } from '@/app/contexts/ReservationContext';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const { state } = useReservation();

  useEffect(() => {
    if (paymentIntentId) {
      // 決済成功時の予約情報をサーバーに送信して保存
      fetch('/api/save-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state,
          paymentIntentId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          // 予約完了画面へのリダイレクトやステートの更新など
        })
        .catch((error) => {
          console.error('Error saving reservation:', error);
        });
    }
  }, [paymentIntentId, state]);

  return (
    <div>
      <h1>お支払いが完了しました</h1>
      <p>ご予約ありがとうございます。予約確認のメールを送信しました。</p>
    </div>
  );
}
