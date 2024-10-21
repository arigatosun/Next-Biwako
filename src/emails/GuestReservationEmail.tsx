import React from 'react';

interface GuestReservationEmailProps {
  guestName: string;
  planName: string;
  checkInDate: string;
  nights: number;
  units: number;
  guestDetails: string;
  guestInfo: string;
  paymentMethod: string;
  totalAmount: string;
  specialRequests?: string;
}

export default function GuestReservationEmail({
  guestName,
  planName,
  checkInDate,
  nights,
  units,
  guestDetails,
  guestInfo,
  paymentMethod,
  totalAmount,
  specialRequests,
}: GuestReservationEmailProps) {
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
      {guestName}様

      このたびはご予約いただき、誠にありがとうございます。

      以下の内容でご予約を承りました。

      予約内容
      プラン: {planName}

      宿泊日: {checkInDate}から{nights}泊

      棟数: {units}棟

      内訳
      <ul>
        <li>男性: {male}名</li>
        <li>女性: {female}名</li>
        <li>子供 (ベッドあり): {childWithBed}名</li>
        <li>子供 (添い寝): {childNoBed}名</li>
      </ul>

      予約者基本情報
      メールアドレス: {emailAddress}
      電話番号: {phoneNumber}

      お支払方法: {paymentMethod}

      ご宿泊料金
      合計: {totalAmount}

      ご不明な点がございましたら、お気軽にお問い合わせください。

      どうぞよろしくお願いいたします。
    </div>
  );
}
