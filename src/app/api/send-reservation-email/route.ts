// app/api/send-reservation-email/route.ts

import { NextResponse } from 'next/server';
import { sendReservationEmails } from '@/utils/email';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/app/types/supabase';

export async function POST(req: Request) {
  try {
    const reservationData = await req.json();
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // 予約IDが必須
    if (!reservationData.id) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    // 既に送信済みかチェック
    const { data: existingLogs } = await supabase
      .from('email_send_logs')
      .select('*')
      .eq('reservation_id', reservationData.id)
      .eq('email_type', 'reservation_confirmation');

    if (existingLogs && existingLogs.length > 0) {
      console.log(`Reservation confirmation emails already sent for reservation ${reservationData.id}`);
      return NextResponse.json({ message: 'Emails already sent', alreadySent: true }, { status: 200 });
    }

    // adminEmail を追加
    reservationData.adminEmail = process.env.ADMIN_EMAIL || 'info.nest.biwako@gmail.com';

    // メール送信
    await sendReservationEmails(reservationData);

    // 送信履歴を記録（ゲストと管理者の両方）
    const emailLogs = [
      {
        reservation_id: reservationData.id,
        email_type: 'reservation_confirmation',
        recipient_type: 'guest',
        recipient_email: reservationData.email
      },
      {
        reservation_id: reservationData.id,
        email_type: 'reservation_confirmation',
        recipient_type: 'admin',
        recipient_email: reservationData.adminEmail
      }
    ];

    const { error: logError } = await supabase
      .from('email_send_logs')
      .insert(emailLogs);

    if (logError) {
      console.error('Error logging email send:', logError);
    }

    return NextResponse.json({ message: 'Emails sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending reservation emails:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
}
