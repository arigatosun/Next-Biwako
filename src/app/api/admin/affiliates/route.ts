// src/app/api/admin/affiliates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  console.log('Received request for affiliates');

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
    // アフィリエイター情報を取得し、フィールド名をキャメルケースに変換
    const { data: affiliatesData, error: affiliatesError } = await supabaseAdmin
      .from('affiliates')
      .select(`
        id,
        affiliateCode:affiliate_code,
        nameKanji:name_kanji,
        nameKana:name_kana,
        email,
        phoneNumber:phone,
        bank_name,
        account_type,
        branch_name,
        account_number,
        account_holder_name,
        couponCode:coupon_code,
        promotionMediums:promotion_mediums,
        promotioninfo:promotion_info,
        registrationDate:created_at,
        updated_at
      `);

    if (affiliatesError || !affiliatesData) {
      console.error('Error fetching affiliates:', affiliatesError);
      return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
    }

    // カウントする予約ステータスのリスト
    const validStatuses = ['pending', 'confirmed', 'paid', 'processing'];

    // 各アフィリエイターの totalRewards と totalReservations を計算
    const affiliatesWithRewards = [];

    for (const affiliate of affiliatesData) {
      // 該当するクーポンコードを使用し、特定のステータスを持つ予約を取得
      const { data: reservationsData, error: reservationsError } = await supabaseAdmin
        .from('reservations')
        .select('total_amount, payment_amount')
        .eq('coupon_code', affiliate.couponCode)
        .in('reservation_status', validStatuses); // ステータスでフィルタリング

      if (reservationsError) {
        console.error('Error fetching reservations for affiliate:', affiliate.id, reservationsError);
        return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
      }

      // totalRewards を計算（例として、total_amount - payment_amount の合計を報酬額とする）
      const totalRewards = reservationsData.reduce((sum, reservation) => {
        const reward = reservation.total_amount - (reservation.payment_amount || 0);
        return sum + reward;
      }, 0);

      // totalReservations を計算
      const totalReservations = reservationsData.length;

      // bankInfo を作成
      const bankInfo = `${affiliate.bank_name} ${affiliate.account_type} ${affiliate.branch_name} ${affiliate.account_number} ${affiliate.account_holder_name}`;

      affiliatesWithRewards.push({
        ...affiliate,
        totalRewards,
        totalReservations,
        bankInfo,
      });
    }

    console.log('Affiliates with Rewards:', affiliatesWithRewards); // デバッグ用ログ

    return NextResponse.json(affiliatesWithRewards);
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
  }
}
