// src/app/api/admin/cumulative/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// インターフェースの定義
interface ReservationsSummary {
  total_reservations: number;
  total_sales: number;
  total_payments: number;
}

interface YearlySummary {
  yearly_reservations: number;
  yearly_sales: number;
  yearly_payments: number;
}

interface MonthlySummary {
  monthly_reservations: number;
  monthly_sales: number;
  monthly_payments: number;
}

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
    // 累計データの集計
    const { data: reservationsSummary, error: reservationsSummaryError } = await supabase
      .from('reservations')
      .select('count(*) as total_reservations, sum(total_amount) as total_sales, sum(payment_amount) as total_payments')
      .single<ReservationsSummary>();

    if (reservationsSummaryError || !reservationsSummary) {
      console.error('Error fetching reservations summary:', reservationsSummaryError);
      return NextResponse.json({ error: 'Failed to fetch reservations summary' }, { status: 500 });
    }

    // 年間データ
    const currentYear = new Date().getFullYear();
    const firstDayOfYear = new Date(currentYear, 0, 1);
    const firstDayNextYear = new Date(currentYear + 1, 0, 1);

    const { data: yearlySummary, error: yearlyError } = await supabase
      .from('reservations')
      .select('count(*) as yearly_reservations, sum(total_amount) as yearly_sales, sum(payment_amount) as yearly_payments')
      .gte('created_at', firstDayOfYear.toISOString())
      .lt('created_at', firstDayNextYear.toISOString())
      .single<YearlySummary>();

    if (yearlyError || !yearlySummary) {
      console.error('Error fetching yearly summary:', yearlyError);
      return NextResponse.json({ error: 'Failed to fetch yearly summary' }, { status: 500 });
    }

    // 月間データ
    const currentMonth = new Date().getMonth(); // 0-11
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const firstDayNextMonth = new Date(currentYear, currentMonth + 1, 1);

    const { data: monthlySummary, error: monthlyError } = await supabase
      .from('reservations')
      .select('count(*) as monthly_reservations, sum(total_amount) as monthly_sales, sum(payment_amount) as monthly_payments')
      .gte('created_at', firstDayOfMonth.toISOString())
      .lt('created_at', firstDayNextMonth.toISOString())
      .single<MonthlySummary>();

    if (monthlyError || !monthlySummary) {
      console.error('Error fetching monthly summary:', monthlyError);
      return NextResponse.json({ error: 'Failed to fetch monthly summary' }, { status: 500 });
    }

    const cumulativeData: CumulativeData = {
      totalReservations: reservationsSummary.total_reservations || 0,
      totalSales: reservationsSummary.total_sales || 0,
      totalPayments: reservationsSummary.total_payments || 0,
      yearlyReservations: yearlySummary.yearly_reservations || 0,
      yearlySales: yearlySummary.yearly_sales || 0,
      yearlyPayments: yearlySummary.yearly_payments || 0,
      monthlyReservations: monthlySummary.monthly_reservations || 0,
      monthlySales: monthlySummary.monthly_sales || 0,
      monthlyPayments: monthlySummary.monthly_payments || 0,
    };

    return NextResponse.json(cumulativeData);
  } catch (error) {
    console.error('Error fetching cumulative data:', error);
    return NextResponse.json({ error: 'Failed to fetch cumulative data' }, { status: 500 });
  }
}
