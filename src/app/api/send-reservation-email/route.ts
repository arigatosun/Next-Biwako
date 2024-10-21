// app/api/send-reservation-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendReservationEmails } from '@/utils/email';

export async function POST(request: NextRequest) {
  try {
    const reservationData = await request.json();

    // 必要な検証やエラーハンドリングをここで行います

    await sendReservationEmails(reservationData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending reservation emails:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
}
