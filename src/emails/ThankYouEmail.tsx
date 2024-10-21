// src/emails/ThankYouEmail.tsx

import React from 'react';

interface ThankYouEmailProps {
  name: string;
}

export const ThankYouEmail = ({ name }: ThankYouEmailProps) => (
  <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
    <p>{name}様</p>
    <p>この度は、ご利用いただき誠にありがとうございました。</p>
    <p>
      ご滞在中にお気づきの点やご意見などがございましたら
      是非、ご連絡をお願いいたします。
    </p>
    <p>
      これからも、お客様にご満足いただけるよう、
      サービスの向上に努めて参ります。
    </p>
    <p>
      従業員一同、{name}様の
      またのお越しを心よりお待ちしております。
    </p>
    <p style={{ fontSize: '0.9em', color: '#666' }}>
      ※このメールは自動送信されています。
    </p>
  </div>
);
