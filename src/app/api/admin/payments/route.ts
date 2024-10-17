// src/app/api/admin/payments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface Reservation {
  id: number;
  total_amount: number;
  payment_amount: number;
  coupon_code: string;
  check_in_date: string;
  reservation_status: string;
  coupons: Coupon;
}

interface Coupon {
  affiliate_code: string;
  affiliates: Affiliate | null;
}

interface Affiliate {
  id: number;
  name_kanji: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  account_holder_name: string;
  account_type: string;
}

interface Payment {
  id: number;
  name: string;
  bankInfo: string;
  amount: number;
  status: 'unpaid' | 'paid';
  paymentDate?: string;
}

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

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

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    console.error('Token verification failed:', userError);
    return NextResponse.json({ error: 'Invalid token or insufficient permissions' }, { status: 403 });
  }

  const role = userData.user.app_metadata?.role;
  if (role !== 'admin') {
    console.error('Insufficient permissions: user role is not admin');
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

    // 未払いの予約を取得
    const { data: reservations, error: reservationsError } = await supabaseAdmin
      .from('reservations')
      .select(`
        id,
        total_amount,
        payment_amount,
        coupon_code,
        check_in_date,
        reservation_status,
        coupons (
          affiliate_code,
          affiliates (
            id,
            name_kanji,
            bank_name,
            branch_name,
            account_number,
            account_holder_name,
            account_type
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

    console.log('Fetched reservations:', reservations);

    // アフィリエイターごとに未払いの支払いをグループ化
    const unpaidPaymentsMap = new Map<number, Payment>();

    for (const reservation of reservations as unknown as Reservation[]) {
      const coupon = reservation.coupons;
      if (!coupon) continue;

      const affiliate = coupon.affiliates;
      if (!affiliate) continue;

      const affiliateId = affiliate.id;
      const amount = reservation.total_amount - (reservation.payment_amount || 0);

      if (unpaidPaymentsMap.has(affiliateId)) {
        const existingPayment = unpaidPaymentsMap.get(affiliateId)!;
        existingPayment.amount += amount;
      } else {
        unpaidPaymentsMap.set(affiliateId, {
          id: affiliateId,
          name: affiliate.name_kanji || '不明なアフィリエイター',
          bankInfo: `${affiliate.bank_name} ${affiliate.account_type} ${affiliate.branch_name} ${affiliate.account_number} ${affiliate.account_holder_name}`,
          amount: amount,
          status: 'unpaid',
        });
      }
    }

    // 支払済みの支払いを取得
    const { data: paidPaymentsData, error: paidPaymentsError } = await supabaseAdmin
      .from('affiliate_payments')
      .select(`
        id,
        affiliate_id,
        amount,
        payment_date,
        affiliates (
          name_kanji,
          bank_name,
          branch_name,
          account_number,
          account_holder_name,
          account_type
        )
      `)
      .eq('period_start', firstDayOfLastMonthStr)
      .eq('period_end', lastDayOfLastMonthStr);

    if (paidPaymentsError) {
      console.error('Error fetching paid payments:', paidPaymentsError);
      return NextResponse.json({ error: 'Failed to fetch paid payments' }, { status: 500 });
    }

    console.log('Fetched paid payments:', paidPaymentsData);

    const paidPayments: Payment[] = (paidPaymentsData || []).map((payment: any) => ({
      id: payment.affiliate_id,
      name: payment.affiliates?.name_kanji || '不明なアフィリエイター',
      bankInfo: `${payment.affiliates?.bank_name} ${payment.affiliates?.account_type} ${payment.affiliates?.branch_name} ${payment.affiliates?.account_number} ${payment.affiliates?.account_holder_name}`,
      amount: payment.amount,
      status: 'paid',
      paymentDate: payment.payment_date,
    }));

    // 支払いデータを統合
    const payments: Payment[] = [...Array.from(unpaidPaymentsMap.values()), ...paidPayments];

    console.log('Compiled payments:', payments);

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
