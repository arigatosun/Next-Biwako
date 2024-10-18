// src/app/api/auth/affiliate/user/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  console.log('Received request for affiliate user info');

  const authHeader = request.headers.get('authorization');
  console.log('Auth header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Unauthorized: No valid auth header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  console.log('Extracted token:', token);

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, JWT_SECRET) as {
      affiliateId: number;
      affiliateCode: string;
      email: string;
      nameKanji: string;
      nameKana: string;
    };
    console.log('Decoded token:', decodedToken);
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data, error } = await supabase
      .from('affiliates')
      .select(`
        id, 
        affiliate_code, 
        coupon_code, 
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
        promotion_info
      `) // 必要なフィールドをすべて選択
      .eq('id', decodedToken.affiliateId)
      .single();

    if (error || !data) {
      console.log('No matching affiliate found');
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    console.log('Affiliate found:', data);

    return NextResponse.json({
      id: data.id,
      affiliate_code: data.affiliate_code,
      coupon_code: data.coupon_code,
      name_kanji: data.name_kanji,
      name_kana: data.name_kana,
      email: data.email,
      phone: data.phone,
      bank_name: data.bank_name,
      branch_name: data.branch_name,
      account_number: data.account_number,
      account_holder_name: data.account_holder_name,
      account_type: data.account_type,
      promotion_mediums: data.promotion_mediums,
      promotion_info: data.promotion_info,
    });
  } catch (error) {
    console.error('Error fetching affiliate data:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliate data' }, { status: 500 });
  }
}
