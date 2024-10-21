// emails/AdminCancellationNotification.tsx

import React from 'react';

interface AdminCancellationNotificationProps {
  cancelDateTime: string;
  planName: string;
  checkInDate: string;
  nights: number;
  units: number;
  guestDetails: {
    male: number;
    female: number;
    childWithBed: number;
    childNoBed: number;
  };
  guestInfo: {
    email: string;
    phone: string;
  };
  cancellationFee: string;
}

const AdminCancellationNotification = ({
  cancelDateTime,
  planName,
  checkInDate,
  nights,
  units,
  guestDetails,
  guestInfo,
  cancellationFee,
}: AdminCancellationNotificationProps) => {
  const male = guestDetails.male || 0;
  const female = guestDetails.female || 0;
  const childWithBed = guestDetails.childWithBed || 0;
  const childNoBed = guestDetails.childNoBed || 0;

  const emailAddress = guestInfo.email || '';
  const phoneNumber = guestInfo.phone || '';

  return (
    <div>
      <p>
        下記のとおり宿泊キャンセルがありましたことをご通知申し上げます。
      </p>

      <p>
        <strong>キャンセル受付日時</strong>: {cancelDateTime}
      </p>

      <h2>予約内容（キャンセル済み）</h2>
      <p><strong>プラン</strong>: {planName}</p>

      <p>
        <strong>宿泊日</strong>: {checkInDate}から{nights}泊
      </p>
      <p>
        <strong>棟数</strong>: {units}棟
      </p>

      <h3>内訳</h3>
      <ul>
        <li>男性: {male}名</li>
        <li>女性: {female}名</li>
        <li>子供 (ベッドあり): {childWithBed}名</li>
        <li>子供 (添い寝): {childNoBed}名</li>
      </ul>

      <h2>予約者基本情報</h2>
      <p>メールアドレス: {emailAddress}</p>
      <p>電話番号: {phoneNumber}</p>

      <p>
        <strong>キャンセル料</strong>: {cancellationFee}
      </p>
    </div>
  );
};

export default AdminCancellationNotification;
