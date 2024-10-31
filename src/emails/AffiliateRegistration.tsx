// emails/AffiliateRegistration.tsx
import React from 'react';

interface AffiliateRegistrationProps {
  customerName: string;
  affiliateID: string;
  couponCode: string;
}

export const AffiliateRegistration = ({ customerName, affiliateID, couponCode }: AffiliateRegistrationProps) => {
  // ダッシュボードのURLを定義
  const dashboardUrl = 'https://nestbiwako.vercel.app/affiliate/login';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <p>こんにちは {customerName} さん、</p>
      <p>NEST琵琶湖のアフィリエイター登録が完了しました。あなたのアフィリエイトIDは <strong>【{affiliateID}】</strong> です。</p>
      <p>このIDを使用してログインし、アフィリエイト状況を確認してください。</p>

      {/* ダッシュボードへのボタンを追加 */}
      <p>
        <a
          href={dashboardUrl}
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
          ダッシュボード
        </a>
      </p>

      <p>また、あなたのクーポンコードは<strong>【{couponCode}】</strong>です。このコードを使ってお客様を紹介し、報酬を獲得してください。</p>

      <p><strong>重要:</strong> アフィリエイト状況を確認するダッシュボードのログイン時にはアフィリエイトIDが必要になります。登録時に提供されたIDとメールアドレスを使用してログインしてください。</p>

      <p>ご不明点などのお問い合わせは、こちらのLINEでも対応いたします。お気軽にご連絡ください。</p>

      {/* LINEボタンの画像をリンクとして挿入 */}
      <p>
        <a href="https://line.me/R/ti/p/@627pvjqv" target="_blank" rel="noopener noreferrer">
          <img 
            src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" 
            alt="LINEでお問い合わせ" 
            style={{ width: '200px', height: 'auto', border: 'none' }}
          />
        </a>
      </p>

      <p>今後ともよろしくお願いいたします。</p>

      <p>こちらのメールは送信専用になっています。</p>
   　 <p>お問い合わせはinfo.nest.biwako@gmail.comまでお願いします。</p>

      <p>NEST琵琶湖より</p>
    </div>
  );
};
