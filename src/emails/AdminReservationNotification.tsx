// emails/AdminReservationNotification.tsx
import React from 'react';

interface AdminReservationNotificationProps {
  planName: string;
  roomName: string;
  checkInDate: string;
  nights: number;
  units: number;
  guestDetails: string;
  guestInfo: string;
  paymentMethod: string;
  totalAmount: string;
  specialRequests?: string;
}

export const AdminReservationNotification = ({
  planName,
  roomName,
  checkInDate,
  nights,
  units,
  guestDetails,
  guestInfo,
  paymentMethod,
  totalAmount,
  specialRequests,
}: AdminReservationNotificationProps) => (
  <div>
    <p>新しい予約がありました。</p>

    <h2>予約内容</h2>
    <p><strong>プラン</strong>: {planName}</p>
    <p><strong>棟</strong>: {roomName}</p>
    <p><strong>宿泊日</strong>: {checkInDate}から{nights}泊</p>
    <p><strong>棟数</strong>: {units}棟</p>

    <h3>内訳</h3>
    <pre>{guestDetails}</pre>

    <h2>予約者基本情報</h2>
    <pre>{guestInfo}</pre>

    <p><strong>お支払方法</strong>: {paymentMethod}</p>

    {specialRequests && (
      <>
        <h2>その他ご要望など</h2>
        <p>{specialRequests}</p>
      </>
    )}

    <h2>ご宿泊料金</h2>
    <p><strong>合計</strong>: {totalAmount}</p>
  </div>
);
