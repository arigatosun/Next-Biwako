import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface CumulativeData {
  totalReservations: number;
  totalSales: number;
  totalPayments: number;
  yearlyReservations: number;
  yearlySales: number;
  yearlyPayments: number;
  monthlyReservations: number;
  monthlySales: number;
  monthlyPayments: number;
}

// 累計支払いデータ取得API
export async function GET(request: NextRequest) {
  console.log('Received request for cumulative payment data');

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

  try {
    // ストアドプロシージャを呼び出して累計データを取得
    const { data: fullSummary, error: fullSummaryError } = await supabaseAdmin
      .rpc('get_full_reservations_summary');

    if (fullSummaryError || !fullSummary) {
      console.error('Error fetching full reservations summary:', fullSummaryError);
      return NextResponse.json({ error: 'Failed to fetch reservations summary' }, { status: 500 });
    }

    const {
      total_reservations: totalReservations,
      total_sales: totalSales,
      total_payments: totalPayments,
      yearly_reservations: yearlyReservations,
      yearly_sales: yearlySales,
      yearly_payments: yearlyPayments,
      monthly_reservations: monthlyReservations,
      monthly_sales: monthlySales,
      monthly_payments: monthlyPayments,
    } = fullSummary[0] || {};

    const cumulativeData: CumulativeData = {
      totalReservations: Number(totalReservations) || 0,
      totalSales: Number(totalSales) || 0,
      totalPayments: Number(totalPayments) || 0,
      yearlyReservations: Number(yearlyReservations) || 0,
      yearlySales: Number(yearlySales) || 0,
      yearlyPayments: Number(yearlyPayments) || 0,
      monthlyReservations: Number(monthlyReservations) || 0,
      monthlySales: Number(monthlySales) || 0,
      monthlyPayments: Number(monthlyPayments) || 0,
    };

    console.log('Cumulative Data:', cumulativeData); // デバッグ用ログ

    return NextResponse.json(cumulativeData);
  } catch (error) {
    console.error('Error fetching cumulative data:', error);
    return NextResponse.json({ error: 'Failed to fetch cumulative data' }, { status: 500 });
  }
}
