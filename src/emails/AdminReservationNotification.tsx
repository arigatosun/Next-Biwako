// emails/AdminReservationNotification.tsx

import React from 'react';

interface AdminReservationNotificationProps {
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
  paymentMethod: string;
  totalAmount: string;
  specialRequests?: string;
}

const AdminReservationNotification = ({
  planName,
  checkInDate,
  nights,
  units,
  guestDetails,
  guestInfo,
  paymentMethod,
  totalAmount,
  specialRequests,
}: AdminReservationNotificationProps) => {
  // guestDetails と guestInfo を直接使用
  const male = guestDetails.male || 0;
  const female = guestDetails.female || 0;
  const childWithBed = guestDetails.childWithBed || 0;
  const childNoBed = guestDetails.childNoBed || 0;

  const emailAddress = guestInfo.email || '';
  const phoneNumber = guestInfo.phone || '';

  return (
    <div>
      <p>新しい予約がありました。</p>

      <h2>予約内容</h2>
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

      <p><strong>お支払方法</strong>: {paymentMethod}</p>

      {specialRequests && (
        <>
          <h2>その他ご要望など</h2>
          <p>{specialRequests}</p>
        </>
      )}

      <h2>ご宿泊料金</h2>
      <p>
        <strong>合計</strong>: {totalAmount}
      </p>
    </div>
  );
};

export default AdminReservationNotification;
