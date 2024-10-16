// src/app/api/auth/affiliate/reservations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  console.log('Received request for affiliate reservations');

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
      // 他の必要なフィールドがあれば追加
    };
    console.log('Decoded token:', decodedToken);
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    // affiliateIdを使用してcoupon_codeを取得
    const { data: affiliateData, error: affiliateError } = await supabase
      .from('affiliates')
      .select('coupon_code')
      .eq('id', decodedToken.affiliateId)
      .single();

    if (affiliateError || !affiliateData) {
      console.log('Affiliate not found or error occurred');
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const { coupon_code } = affiliateData;
    console.log('Affiliate coupon_code:', coupon_code);

    // coupon_codeを使用してreservationsを取得
    const { data: reservationsData, error: reservationsError } = await supabase
      .from('reservations')
      .select('created_at, check_in_date, reservation_number, payment_amount, total_amount, reservation_status')
      .eq('coupon_code', coupon_code);

    if (reservationsError) {
      console.log('Error fetching reservations:', reservationsError);
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }

    console.log('Reservations fetched:', reservationsData);

    // 報酬額を計算してレスポンスに含める
    const reservationsWithRewards = reservationsData.map((reservation: any) => ({
      reservationDate: reservation.created_at,
      stayDate: reservation.check_in_date,
      reservationNumber: reservation.reservation_number,
      reservationAmount: Number(reservation.payment_amount),
      rewardAmount: Number(reservation.total_amount) - Number(reservation.payment_amount),
      reservationStatus: reservation.reservation_status,
    }));

    return NextResponse.json(reservationsWithRewards);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}
