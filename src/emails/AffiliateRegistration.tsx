// emails/AffiliateRegistration.tsx
import React from 'react';

interface AffiliateRegistrationProps {
  customerName: string;
  affiliateID: string;
  couponCode: string;
}

export const AffiliateRegistration = ({ customerName, affiliateID, couponCode }: AffiliateRegistrationProps) => (
  <div>
    <p>こんにちは {customerName} さん、</p>
    <p>アフィリエイター登録が完了しました。あなたのアフィリエイトIDは 【<strong>{affiliateID}</strong>】 です。</p>
    <p>このIDを使用してログインし、アフィリエイト状況を確認してください。</p>
    
    <p>また、あなたのクーポンコードは【<strong>{couponCode}</strong>】です。このコードを使ってお客様を紹介し、報酬を獲得してください。</p>
    
    <p><strong>重要:</strong> アフィリエイト状況を確認するダッシュボードのログイン時にはこのIDが必要になります。登録時に提供されたIDとメールアドレスを使用してログインしてください。</p>
    
    <p>今後ともよろしくお願いいたします。</p>
    
    <p>NEST琵琶湖より</p>
  </div>
);
