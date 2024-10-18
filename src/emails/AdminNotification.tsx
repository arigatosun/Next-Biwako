// emails/AdminNotification.tsx
import React from 'react';

interface AdminNotificationProps {
  nameKanji: string;
  nameKana: string;
  email: string;
  phone: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  accountHolderName: string;
  accountType: string;
  promotionMediums: string[];
  promotionInfo: string[];
  affiliateCode: string;
  couponCode: string;
}

export const AdminNotification = ({
  nameKanji,
  nameKana,
  email,
  phone,
  bankName,
  branchName,
  accountNumber,
  accountHolderName,
  accountType,
  promotionMediums,
  promotionInfo,
  affiliateCode,
  couponCode,
}: AdminNotificationProps) => (
  <div>
    <h2>新しいアフィリエイターが登録されました。</h2>
    <p><strong>氏名（漢字）:</strong> {nameKanji}</p>
    <p><strong>氏名（カナ）:</strong> {nameKana}</p>
    <p><strong>メールアドレス:</strong> {email}</p>
    <p><strong>電話番号:</strong> {phone}</p>
    <h3>報酬支払情報</h3>
    <p><strong>銀行名:</strong> {bankName}</p>
    <p><strong>支店名:</strong> {branchName}</p>
    <p><strong>口座番号:</strong> {accountNumber}</p>
    <p><strong>名義人:</strong> {accountHolderName}</p>
    <p><strong>口座タイプ:</strong> {accountType}</p>
    <h3>宣伝媒体情報</h3>
    {promotionMediums.map((medium, index) => (
      <div key={medium}>
        <p><strong>{medium}:</strong> {promotionInfo[index]}</p>
      </div>
    ))}
    <p><strong>アフィリエイトコード:</strong> {affiliateCode}</p>
    <p><strong>クーポンコード:</strong> {couponCode}</p>
  </div>
);
