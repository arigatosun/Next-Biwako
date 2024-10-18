// emails/AdminCancellationNotification.tsx
import React from 'react';

interface AdminCancellationNotificationProps {
  cancelDateTime: string;
  planName: string;
  roomName: string;
  checkInDate: string;
  nights: number;
  units: number;
  guestDetails: string;
  guestInfo: string;
  cancellationFee: string;
}

export const AdminCancellationNotification = ({
  cancelDateTime,
  planName,
  roomName,
  checkInDate,
  nights,
  units,
  guestDetails,
  guestInfo,
  cancellationFee,
}: AdminCancellationNotificationProps) => (
  <div>
    <p>下記のとおり宿泊キャンセルがありましたことをご通知申し上げます。</p>

    <p><strong>キャンセル受付日時</strong>: {cancelDateTime}</p>

    <h2>予約内容（キャンセル済み）</h2>
    <p><strong>プラン</strong>: {planName}</p>
    <p><strong>棟</strong>: {roomName}</p>
    <p><strong>宿泊日</strong>: {checkInDate}から{nights}泊</p>
    <p><strong>棟数</strong>: {units}棟</p>

    <h3>内訳</h3>
    <pre>{guestDetails}</pre>

    <h2>予約者基本情報</h2>
    <pre>{guestInfo}</pre>

    <p><strong>キャンセル料</strong>: {cancellationFee}</p>
  </div>
);
