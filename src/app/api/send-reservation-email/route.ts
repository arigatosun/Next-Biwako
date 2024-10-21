// app/api/send-reservation-email/route.ts

import { NextResponse } from 'next/server';
import { sendReservationEmails } from '@/utils/email';

export async function POST(req: Request) {
  try {
    const reservationData = await req.json();

    // adminEmail を追加
    reservationData.adminEmail = process.env.ADMIN_EMAIL || 't.koushi@arigatosun.com';

    // 必要な検証を行う（例: 必須フィールドが存在するかなど）

    await sendReservationEmails(reservationData);

    return NextResponse.json({ message: 'Emails sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending reservation emails:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
}
