// app/reservation-complete/page.tsx

'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReservationComplete() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId');

  return (
    <div>
      <h1>ご予約が完了しました</h1>
      <p>予約ID: {reservationId}</p>
      <p>ご予約ありがとうございます。予約確認のメールを送信しました。</p>
    </div>
  );
}
