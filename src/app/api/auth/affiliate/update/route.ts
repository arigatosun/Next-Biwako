// src/app/api/auth/affiliate/update/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PUT(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header is missing' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { affiliateId: number };
    const affiliateId = decoded.affiliateId;

    const {
      name_kanji,
      name_kana,
      email,
      phone,
      bank_name,
      branch_name,
      account_number,
      account_holder_name,
      account_type,
      promotion_mediums,
      promotion_urls
    } = await request.json();

    // Supabaseを使用してアフィリエイト情報を更新
    const { data, error } = await supabase
      .from('affiliates')
      .update({
        name_kanji,
        name_kana,
        email,
        phone,
        bank_name,
        branch_name,
        account_number,
        account_holder_name,
        account_type,
        promotion_mediums,
        promotion_urls,
        updated_at: new Date()
      })
      .eq('id', affiliateId)
      .select('id, affiliate_code, email, name_kanji, name_kana, phone, bank_name, branch_name, account_number, account_holder_name, account_type, coupon_code, promotion_mediums, promotion_urls');

    if (error) {
      throw error;
    }

    return NextResponse.json(data[0], { status: 200 });
  } catch (error) {
    console.error('Error updating affiliate information:', error);
    return NextResponse.json({ error: 'アフィリエイト情報の更新に失敗しました' }, { status: 500 });
  }
}
