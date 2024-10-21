// GuestReservationEmail.tsx

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

interface GuestReservationEmailProps {
  guestName: string;
  planName: string;
  checkInDate: string;
  nights: number;
  units: number;
  guestDetails: GuestDetails; // オブジェクトとして受け取る
  guestInfo: GuestInfo;       // オブジェクトとして受け取る
  paymentMethod: string;
  totalAmount: string;
  specialRequests?: string;
  reservationNumber: string;  // 予約番号を追加
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
  reservationNumber,
}: GuestReservationEmailProps) {

  const { male, female, childWithBed, childNoBed } = guestDetails;
  const { email, phone } = guestInfo;

  // ログインページのURL
  const loginUrl = `http://localhost:3000/login`; // 実際のURLに置き換えてください

  return (
    <div>
      <p>{guestName}様</p>

      <p>このたびはご予約いただき、誠にありがとうございます。</p>

      <p>以下の内容でご予約を承りました。</p>

      <h2>予約内容</h2>
      <p><strong>予約番号:</strong> {reservationNumber}</p> {/* 予約番号を表示 */}
      <p><strong>プラン:</strong> {planName}</p>
      <p><strong>宿泊日:</strong> {checkInDate}から{nights}泊</p>
      <p><strong>棟数:</strong> {units}棟</p>

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

      <p><strong>お支払方法:</strong> {paymentMethod}</p>

      {specialRequests && (
        <>
          <h2>その他ご要望など</h2>
          <p>{specialRequests}</p>
        </>
      )}

      <h2>ご宿泊料金</h2>
      <p><strong>合計:</strong> {totalAmount}</p>

      <p>以下のボタンからご予約内容の確認やキャンセルが可能です。</p>

      {/* ボタンを追加 */}
      <p>
        <a
          href={loginUrl}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#007BFF',
            textDecoration: 'none',
            borderRadius: '5px',
          }}
        >
          予約内容の確認・キャンセル
        </a>
      </p>

      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>

      <p>どうぞよろしくお願いいたします。</p>
    </div>
  );
}
