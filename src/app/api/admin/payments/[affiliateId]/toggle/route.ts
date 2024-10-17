// src/app/api/admin/payments/[affiliateId]/toggle/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest, { params }: { params: { affiliateId: string } }) {
  const { affiliateId } = params;
  console.log(`Received toggle request for affiliate ID: ${affiliateId}`);

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Invalid token or insufficient permissions' }, { status: 403 });
  }

  const role = userData.user.app_metadata?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Invalid token or insufficient permissions' }, { status: 403 });
  }

  try {
    // 先月の期間を計算
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(firstDayOfCurrentMonth.getFullYear(), firstDayOfCurrentMonth.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(firstDayOfCurrentMonth.getFullYear(), firstDayOfCurrentMonth.getMonth(), 0);

    const firstDayOfLastMonthStr = formatDateToYYYYMMDD(firstDayOfLastMonth);
    const lastDayOfLastMonthStr = formatDateToYYYYMMDD(lastDayOfLastMonth);

    const validStatuses = ['pending', 'confirmed', 'processing'];

    // 対象の予約を取得
    const { data: reservations, error: reservationsError } = await supabaseAdmin
      .from('reservations')
      .select(`
        id,
        total_amount,
        payment_amount,
        coupons (
          affiliates (
            id
          )
        )
      `)
      .gte('check_in_date', firstDayOfLastMonthStr)
      .lte('check_in_date', lastDayOfLastMonthStr)
      .in('reservation_status', validStatuses)
      .not('coupon_code', 'is', null);

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }

    if (!reservations || reservations.length === 0) {
      return NextResponse.json({ error: 'No reservations found' }, { status: 404 });
    }

    // 指定された affiliateId の予約をフィルタリング
    const targetReservations = reservations.filter((reservation: any) => {
      const coupon = reservation.coupons;
      if (!coupon) return false;
      const affiliate = coupon.affiliates;
      if (!affiliate) return false;
      return affiliate.id === parseInt(affiliateId, 10);
    });

    if (targetReservations.length === 0) {
      return NextResponse.json({ error: 'No reservations found for this affiliate' }, { status: 404 });
    }

    const reservationIds = targetReservations.map(reservation => reservation.id);

    // 予約のステータスを 'paid' に更新
    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ reservation_status: 'paid' })
      .in('id', reservationIds);

    if (updateError) {
      console.error('Error updating reservations:', updateError);
      return NextResponse.json({ error: 'Failed to update reservations' }, { status: 500 });
    }

    // 支払金額を計算
    const totalAmount = targetReservations.reduce((sum, reservation) => {
      const paymentAmount = reservation.payment_amount || 0;
      return sum + (reservation.total_amount - paymentAmount);
    }, 0);

    // 支払い情報を保存
    const { error: paymentError } = await supabaseAdmin
      .from('affiliate_payments')
      .insert({
        affiliate_id: parseInt(affiliateId, 10),
        amount: totalAmount,
        payment_date: formatDateToYYYYMMDD(now),
        period_start: firstDayOfLastMonthStr,
        period_end: lastDayOfLastMonthStr
      });

    if (paymentError) {
      console.error('Error inserting payment record:', paymentError);
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Payment status updated and recorded successfully' });
  } catch (error) {
    console.error('Error toggling payment status:', error);
    return NextResponse.json({ error: 'Failed to toggle payment status' }, { status: 500 });
  }
}
