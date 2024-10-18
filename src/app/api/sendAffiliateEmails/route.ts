// app/api/sendAffiliateEmails/route.ts
import { NextResponse } from 'next/server';
import { sendAffiliateRegistrationEmails } from '@/utils/email';

export async function POST(request: Request) {
  try {
    const affiliateData = await request.json();

    // 必須フィールドのチェック
    const requiredFields = [
      'nameKanji',
      'nameKana',
      'email',
      'phone',
      'bankName',
      'branchName',
      'accountNumber',
      'accountHolderName',
      'accountType',
      'promotionMediums',
      'promotionInfo',
      'affiliateCode',
      'couponCode',
    ];

    for (const field of requiredFields) {
      if (!affiliateData[field]) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // メール送信関数の呼び出し
    await sendAffiliateRegistrationEmails(affiliateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send emails' },
      { status: 500 }
    );
  }
}
