// emails/AdminCancellationNotification.tsx
import React from 'react';

interface AdminCancellationNotificationProps {
  cancelDateTime: string;
  planName: string;
  checkInDate: string;
  nights: number;
  units: number;
  guestDetails: string;
  guestInfo: string;
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
  // guestDetails をオブジェクトに変換
  const guestDetailsObj = JSON.parse(guestDetails);

  const male = guestDetailsObj.male || 0;
  const female = guestDetailsObj.female || 0;
  const childWithBed = guestDetailsObj.childWithBed || 0;
  const childNoBed = guestDetailsObj.childNoBed || 0;

  // guestInfo をオブジェクトに変換
  const guestInfoObj = JSON.parse(guestInfo);

  const emailAddress = guestInfoObj.email || '';
  const phoneNumber = guestInfoObj.phone || '';

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
      {/* 棟: {roomName} を削除 */}

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
