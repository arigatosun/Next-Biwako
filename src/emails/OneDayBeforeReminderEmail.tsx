// src/emails/OneDayBeforeReminderEmail.tsx

import React from 'react';

interface OneDayBeforeReminderEmailProps {
  name: string;
  checkInDate: string;
  stayNights: number;
  rooms: number;
  guests: {
    male: number;
    female: number;
    childWithBed: number;
    childNoBed: number;
  };
  paymentMethod: string;
  arrivalMethod: string;
  checkInTime: string;
  specialRequests: string | null;
  totalAmount: number;
}

export const OneDayBeforeReminderEmail = ({
  name,
  checkInDate,
  stayNights,
  rooms,
  guests,
  paymentMethod,
  arrivalMethod,
  checkInTime,
  specialRequests,
  totalAmount,
}: OneDayBeforeReminderEmailProps) => (
  <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
    <p>{name}様</p>
    <p>この度はご予約いただきまして誠にありがとうございます。</p>
    <p>
      ご利用日が近づいて参りましたので、
      改めて、ご予約内容の確認をお願いします。
    </p>
    <p>
      <strong>[宿泊日]:</strong>{' '}
      {new Date(checkInDate).toLocaleDateString('ja-JP')}から{stayNights}泊
    </p>
    <p><strong>[棟数]:</strong> {rooms}棟</p>
    <p>▼内訳　=============================================</p>
    <p>　1棟目</p>
    <p>　　男性: {guests.male}名</p>
    <p>　　女性: {guests.female}名</p>
    <p>　　子供（ベッドあり）: {guests.childWithBed}名</p>
    <p>　　子供（ベッドなし）: {guests.childNoBed}名</p>
    <p>▼予約者基本情報　=========================================</p>
    <p><strong>[氏名]:</strong> {name}様</p>
    <p><strong>[お支払方法]:</strong> {paymentMethod}</p>
    <p><strong>[交通手段]:</strong> {arrivalMethod}</p>
    <p><strong>[チェックイン予定時間]:</strong> {checkInTime}</p>
    {specialRequests && (
      <p>
        <strong>[その他ご要望など]:</strong>
        <br />
        {specialRequests}
      </p>
    )}
    <p>▼ご宿泊料金　=========================================</p>
    <p>合計: {totalAmount.toLocaleString('ja-JP')}円</p>
    <p>あわせてご確認をお願いします。</p>
    <p>キャンセルポリシー</p>
    <p>
      ・30日前～50％<br />
      ・7日前～100％
    </p>
    <p>道中、お気をつけてお越しくださいませ。</p>
    <p>従業員一同、{name}様のお越しを心よりお待ちしております。</p>
    <p style={{ fontSize: '0.9em', color: '#666' }}>
      ※このメールはご予約された方へ自動送信しています。<br />
      既にキャンセルされている場合など、行き違いの失礼がございましたらお許しください。
    </p>
  </div>
);