// src/emails/ReminderEmail.tsx

import React from 'react';
import { parseISO } from 'date-fns';

interface ReminderEmailProps {
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
  specialRequests?: string | null;
  totalAmount: number;
}

export const ReminderEmail = ({
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
}: ReminderEmailProps) => {
  // 日付を正しくパースしてフォーマット
  const parsedCheckInDate = parseISO(checkInDate);
  const formattedCheckInDate = parsedCheckInDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.6',
        color: '#333',
      }}
    >
      <p>{name}様</p>
      <p>この度はご予約いただきまして誠にありがとうございます。</p>
      <p>
        ご利用日が近づいて参りましたので、
        改めて、ご予約内容の確認をお願いします。
      </p>
      <p>
        <strong>[宿泊日]:</strong> {formattedCheckInDate}から{stayNights}泊
      </p>
      <p>
        <strong>[棟数]:</strong> {rooms}棟
      </p>
      <p>▼内訳　=============================================</p>
      <p>　1棟目</p>
      <p>　　男性: {guests.male}名</p>
      <p>　　女性: {guests.female}名</p>
      <p>　　子供（ベッドあり）: {guests.childWithBed}名</p>
      <p>　　子供（ベッドなし）: {guests.childNoBed}名</p>
      <p>
        ▼予約者基本情報　=========================================
      </p>
      <p>
        <strong>[氏名]:</strong> {name}様
      </p>
      <p>
        <strong>[お支払方法]:</strong> {paymentMethod}
      </p>
      <p>
        <strong>[チェックイン予定時間]:</strong> {checkInTime}
      </p>
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
        ・30日前～50％
        <br />
        ・7日前～100％
      </p>
      <p style={{ fontSize: '0.9em', color: '#666' }}>
        ※カード決済の場合は30日以上前でも3.6%の手数料がかかります。
      </p>
      <p>道中、お気をつけてお越しくださいませ。</p>
      <p>
        従業員一同、{name}様のお越しを心よりお待ちしております。
      </p>
      <p style={{ fontSize: '0.9em', color: '#666' }}>
        ※このメールはご予約された方へ自動送信しています。
        <br />
        既にキャンセルされている場合など、行き違いの失礼がございましたらお許しください。
      </p>
      <p>こちらのメールは送信専用になっています。</p>
      <p>
        お問い合わせはinfo.nest.biwako@gmail.comまでお願いします。
      </p>
      <p>【緊急時などは下記URLからLINEよりフロントへ通話が可能となっております。】</p>
    <p>https://lin.ee/cO5WQzv</p>
    </div>
  );
};
