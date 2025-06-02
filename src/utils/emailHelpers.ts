import { supabase } from '@/lib/supabaseClient';

interface EmailLog {
  reservation_id: number;
  email_type: string;
  recipient_type: 'guest' | 'admin';
  recipient_email: string;
}

export async function checkEmailAlreadySent(
  reservationId: number, 
  emailType: string
): Promise<boolean> {
  const { data: existingLogs } = await supabase
    .from('email_send_logs')
    .select('*')
    .eq('reservation_id', reservationId)
    .eq('email_type', emailType);

  return existingLogs ? existingLogs.length > 0 : false;
}

export async function logEmailSend(logs: EmailLog[]): Promise<void> {
  const { error } = await supabase
    .from('email_send_logs')
    .insert(logs);

  if (error) {
    console.error('Error logging email send:', error);
  }
}

export async function sendReservationEmailWithCheck(
  reservationData: any,
  emailType: 'reservation_confirmation' | 'payment_success'
): Promise<{ success: boolean; alreadySent?: boolean; error?: string }> {
  try {
    // 既に送信済みかチェック
    const alreadySent = await checkEmailAlreadySent(reservationData.id, emailType);
    
    if (alreadySent) {
      console.log(`${emailType} emails already sent for reservation ${reservationData.id}`);
      return { success: true, alreadySent: true };
    }

    // メール送信処理（実際の送信ロジックはここに実装）
    // await sendEmail(reservationData);

    // 送信履歴を記録
    const emailLogs: EmailLog[] = [
      {
        reservation_id: reservationData.id,
        email_type: emailType,
        recipient_type: 'guest',
        recipient_email: reservationData.email || reservationData.guestEmail
      },
      {
        reservation_id: reservationData.id,
        email_type: emailType,
        recipient_type: 'admin',
        recipient_email: reservationData.adminEmail || process.env.ADMIN_EMAIL || 'info.nest.biwako@gmail.com'
      }
    ];

    await logEmailSend(emailLogs);

    return { success: true };
  } catch (error) {
    console.error(`Error in sendReservationEmailWithCheck:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}