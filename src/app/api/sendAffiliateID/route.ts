// app/api/sendAffiliateID/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendAffiliateIDEmail } from '@/utils/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'メールアドレスを入力してください。' },
        { status: 400 }
      );
    }

    // メールアドレスでアフィリエイト情報を取得
    const { data, error } = await supabase
      .from('affiliates')
      .select('affiliate_code, name_kanji')
      .eq('email', email)
      .single();

    if (error || !data) {
      // セキュリティ上、メールアドレスの存在有無に関わらず成功レスポンスを返す
      return NextResponse.json({ success: true });
    }

    // メール送信関数の呼び出し
    await sendAffiliateIDEmail({
      email,
      nameKanji: data.name_kanji,
      affiliateCode: data.affiliate_code,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending affiliate ID:', error);
    return NextResponse.json(
      { success: true }, // セキュリティ上、エラーでも成功レスポンスを返す
      { status: 200 }
    );
  }
}
