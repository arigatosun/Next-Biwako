// src/emails/ReminderEmail.tsx

import React from 'react';

interface ReminderEmailProps {
  name: string;
  checkInDate: string;
  info: string;
  cancel: string;
}

export const ReminderEmail = ({
  name,
  checkInDate,
  info,
  cancel,
}: ReminderEmailProps) => (
  <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
    <p>{name}様</p>
    <p>この度はご予約いただきまして誠にありがとうございます。</p>
    <p>
      ご利用日が近づいて参りましたので、改めて、ご予約内容の確認をお願いします。
    </p>
    <p>
      <strong>ご利用日:</strong> {new Date(checkInDate).toLocaleDateString('ja-JP')}
    </p>
    <p>
      下記のキャンセル規定がございますので、あわせてご確認をお願いします。
    </p>
    <p>{cancel}</p>
    <p>{info}</p>
    <p>道中、お気をつけてお越しくださいませ。</p>
    <p>従業員一同、{name}様のお越しを心よりお待ちしております。</p>
    <p style={{ fontSize: '0.9em', color: '#666' }}>
      ※このメールはご予約された方へ自動送信しています。
      <br />
      既にキャンセルされている場合など、行き違いの失礼がございましたらお許しください。
    </p>
  </div>
);
