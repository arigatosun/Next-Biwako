// src/app/api/admin/payments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 今月支払いデータ取得API
export async function GET(request: NextRequest) {
  console.log('Received request for current month payments');

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
    // 今月の開始日と終了日を取得
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        name,
        bank_info,
        amount,
        status
      `)
      .gte('created_at', firstDayOfMonth.toISOString())
      .lt('created_at', firstDayNextMonth.toISOString());

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
