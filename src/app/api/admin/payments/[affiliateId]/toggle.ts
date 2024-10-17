// src/app/api/admin/payments/[affiliateId]/toggle.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
    // 支払い情報を取得
    const { data: payments, error: fetchError } = await supabaseAdmin
      .from('payments') // 支払い情報を管理するテーブル名に変更してください
      .select('id, status')
      .eq('affiliate_id', affiliateId)

    if (fetchError) {
      console.error('Error fetching payment status:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json({ error: 'No payments found for this affiliate' }, { status: 404 });
    }

    // 現在のステータスを取得（ここでは最初のレコードのステータスを使用）
    const currentStatus = payments[0].status;
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';

    // ステータスを更新
    const { error: updateError } = await supabaseAdmin
      .from('payments') // 支払い情報を管理するテーブル名に変更してください
      .update({ status: newStatus })
      .eq('affiliate_id', affiliateId)

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Payment status updated successfully', status: newStatus });
  } catch (error) {
    console.error('Error toggling payment status:', error);
    return NextResponse.json({ error: 'Failed to toggle payment status' }, { status: 500 });
  }
}
