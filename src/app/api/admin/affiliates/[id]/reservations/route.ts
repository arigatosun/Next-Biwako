// /api/admin/affiliates/[id]/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('Received request for affiliate reservations');

  const authHeader = request.headers.get('authorization');
  console.log('Auth header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Unauthorized: No valid auth header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  console.log('Extracted token:', token);

  // Supabase Admin Client を使用してユーザーを取得
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    console.error('Token verification failed:', userError);
    return NextResponse.json({ error: 'Invalid token or insufficient permissions' }, { status: 403 });
  }

  // ユーザーのロールを確認
  const role = userData.user.app_metadata?.role;
  if (role !== 'admin') {
    console.error('Insufficient permissions: user role is not admin');
    return NextResponse.json({ error: 'Invalid token or insufficient permissions' }, { status: 403 });
  }

  const affiliateId = params.id;

  try {
    // アフィリエイターのクーポンコードを取得
    const { data: affiliateData, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('coupon_code')
      .eq('id', affiliateId)
      .single();

    if (affiliateError || !affiliateData) {
      console.log('Affiliate not found or error occurred');
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const { coupon_code } = affiliateData;
    console.log('Affiliate coupon_code:', coupon_code);

    // coupon_codeを使用してreservationsを取得
    const { data: reservationsData, error: reservationsError } = await supabaseAdmin
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
