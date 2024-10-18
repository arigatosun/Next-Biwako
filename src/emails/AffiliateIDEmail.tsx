// emails/AffiliateIDEmail.tsx
import React from 'react';

interface AffiliateIDEmailProps {
  nameKanji: string;
  affiliateCode: string;
}

export const AffiliateIDEmail = ({
  nameKanji,
  affiliateCode,
}: AffiliateIDEmailProps) => (
  <div>
    <p>{nameKanji} 様</p>
    <p>平素よりお世話になっております。</p>
    <p>ご登録いただいたアフィリエイトIDをご案内いたします。</p>
    <p><strong>アフィリエイトID：</strong> {affiliateCode}</p>
    <p>今後ともよろしくお願いいたします。</p>
    <p>NEST琵琶湖</p>
  </div>
);
