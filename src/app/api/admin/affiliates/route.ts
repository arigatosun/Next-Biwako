// src/app/api/admin/affiliates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// アフィリエイター一覧取得API
export async function GET(request: NextRequest) {
  console.log('Received request for affiliates list');

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
      role: string; // 管理者の場合、roleが'admin'と仮定
    };

    if (decodedToken.role !== 'admin') {
      throw new Error('Insufficient permissions');
    }

    console.log('Decoded token:', decodedToken);
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json({ error: 'Invalid token or insufficient permissions' }, { status: 403 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data, error } = await supabase
      .from('affiliates')
      .select(`
        id,
        affiliate_code,
        name_kanji,
        name_kana,
        email,
        phone,
        bank_name,
        branch_name,
        account_number,
        account_holder_name,
        coupon_code,
        promotion_mediums,
        promotion_urls,
        created_at,
        updated_at
      `);

    if (error) {
      console.error('Error fetching affiliates:', error);
      return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
  }
}
