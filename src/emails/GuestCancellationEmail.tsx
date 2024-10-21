// emails/GuestCancellationEmail.tsx

import React from 'react';

interface GuestDetails {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

interface GuestInfo {
  email: string;
  phone: string;
  // 他の必要な情報があれば追加
}

interface GuestCancellationEmailProps {
  guestName: string;
  cancelDateTime: string;
  planName: string;
  roomName: string;
  checkInDate: string;
  nights: number;
  units: number;
  guestDetails: GuestDetails; // オブジェクトとして受け取る
  guestInfo: GuestInfo;         // オブジェクトとして受け取る
  cancellationFee: string;
}

export const GuestCancellationEmail = ({
  guestName,
  cancelDateTime,
  planName,
  roomName,
  checkInDate,
  nights,
  units,
  guestDetails,
  guestInfo,
  cancellationFee,
}: GuestCancellationEmailProps) => {
  // キャンセル受付日時を日本時間でフォーマット
  const formattedCancelDateTime = new Date(cancelDateTime).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // 宿泊日を日本時間でフォーマット
  const formattedCheckInDate = new Date(checkInDate).toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { male, female, childWithBed, childNoBed } = guestDetails;
  const { email, phone } = guestInfo;

  return (
    <div>
      <p>{guestName}様</p>

      <p>以下の内容でキャンセルを承りました。</p>

      <p><strong>キャンセル受付日時</strong>: {formattedCancelDateTime}</p>

      <h2>予約内容（キャンセル済み）</h2>
      <p><strong>プラン</strong>: {planName}</p>
      <p><strong>棟</strong>: {roomName}</p>
      <p><strong>宿泊日</strong>: {formattedCheckInDate}から{nights}泊</p>
      <p><strong>棟数</strong>: {units}棟</p>

      <h3>内訳</h3>
      <ul>
        <li>男性: {male}名</li>
        <li>女性: {female}名</li>
        <li>子供 (ベッドあり): {childWithBed}名</li>
        <li>子供 (添い寝): {childNoBed}名</li>
      </ul>

      <h2>予約者基本情報</h2>
      <p>メールアドレス: {email}</p>
      <p>電話番号: {phone}</p>

      <p><strong>キャンセル料</strong>: {cancellationFee}円</p>

      <p>またのご利用を心よりお待ちしております。</p>
    </div>
  );
};

export default GuestCancellationEmail;
