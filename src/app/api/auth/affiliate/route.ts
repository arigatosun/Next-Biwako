// src/app/api/auth/affiliate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { affiliateCode, email } = await request.json();

  if (!affiliateCode || !email) {
    return NextResponse.json({ error: 'affiliateCode and email are required' }, { status: 400 });
  }

  try {
    console.log(`Attempting affiliate login with code: ${affiliateCode} and email: ${email}`);

    // Supabaseからアフィリエイト情報を取得
    const { data, error } = await supabase
      .from('affiliates')
      .select('id, affiliate_code, email, name_kanji, name_kana')
      .eq('affiliate_code', affiliateCode)
      .eq('email', email)
      .single();

    if (error || !data) {
      console.log('No matching affiliate found');
      return NextResponse.json({ error: 'Invalid affiliate code or email' }, { status: 401 });
    }

    console.log('Affiliate found:', data);

    // JWTトークンの生成
    const token = jwt.sign(
      {
        affiliateId: data.id,
        affiliateCode: data.affiliate_code,
        email: data.email,
        nameKanji: data.name_kanji,
        nameKana: data.name_kana,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return NextResponse.json({ token, affiliateCode: data.affiliate_code });
  } catch (error) {
    console.error('Affiliate login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
