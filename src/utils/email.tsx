// src/utils/email.tsx

import { Resend } from 'resend';
import React from 'react';
import { AffiliateRegistration } from '@/emails/AffiliateRegistration';
import { AdminNotification } from '@/emails/AdminNotification';
import GuestReservationEmail from '@/emails/GuestReservationEmail';
import AdminReservationNotification from '@/emails/AdminReservationNotification';
import { GuestCancellationEmail } from '@/emails/GuestCancellationEmail';
import AdminCancellationNotification from '@/emails/AdminCancellationNotification';
import { AffiliateIDEmail } from '@/emails/AffiliateIDEmail';
import { ReminderEmail } from '@/emails/ReminderEmail';
import { OneDayBeforeReminderEmail } from '@/emails/OneDayBeforeReminderEmail';
import { ThankYouEmail } from '@/emails/ThankYouEmail';

// Resend クライアントの初期化
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  throw new Error('RESEND_API_KEY is not set in the environment variables');
}
const resend = new Resend(resendApiKey);

/**
 * アフィリエイターと運営者にメールを送信する関数
 */
interface AffiliateData {
  nameKanji: string;
  nameKana: string;
  email: string;
  phone: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  accountHolderName: string;
  accountType: string;
  promotionMediums: string[];
  promotionInfo: string[];
  affiliateCode: string;
  couponCode: string;
}

export async function sendAffiliateRegistrationEmails(
  affiliateData: AffiliateData
) {
  const adminEmail = 'info.nest.biwako@gmail.com';

  // アフィリエイターへのメール送信
  await resend.emails.send({
    from: 'NEST琵琶湖運営 <info.nest.biwako@gmail.com>',
    to: affiliateData.email,
    subject: 'アフィリエイター登録が完了しました',
    react: (
      <AffiliateRegistration
        customerName={affiliateData.nameKanji}
        affiliateID={affiliateData.affiliateCode}
        couponCode={affiliateData.couponCode}
      />
    ),
  });

  // 運営者への通知メール送信
  await resend.emails.send({
    from: '運営 <info.nest.biwako@gmail.com>',
    to: adminEmail,
    subject: '新しいアフィリエイターが登録されました',
    react: (
      <AdminNotification
        nameKanji={affiliateData.nameKanji}
        nameKana={affiliateData.nameKana}
        email={affiliateData.email}
        phone={affiliateData.phone}
        bankName={affiliateData.bankName}
        branchName={affiliateData.branchName}
        accountNumber={affiliateData.accountNumber}
        accountHolderName={affiliateData.accountHolderName}
        accountType={affiliateData.accountType}
        promotionMediums={affiliateData.promotionMediums}
        promotionInfo={affiliateData.promotionInfo}
        affiliateCode={affiliateData.affiliateCode}
        couponCode={affiliateData.couponCode}
      />
    ),
  });
}

/**
 * 予約時のメール送信関数
 */
interface ReservationData {
  guestEmail: string;
  guestName: string;
  adminEmail: string;
  planName: string;
  roomName?: string;
  checkInDate: string; // 日付文字列
  nights: number;
  units: number;
  guestCounts: GuestCounts | string;
  guestInfo: GuestInfo | string;
  paymentMethod: string;
  totalAmount: string;
  specialRequests?: string;
  reservationNumber: string;
}

interface GuestCounts {
  [unit: string]: {
    [date: string]: {
      num_male: number;
      num_female: number;
      num_child_no_bed: number;
      num_child_with_bed: number;
    };
  };
}

interface GuestInfo {
  email: string;
  phone: string;
  // 他の必要な情報があれば追加
}

export async function sendReservationEmails(
  reservationData: ReservationData,
  sendToAdmin: boolean = true // 追加: 管理者へのメール送信を制御する引数
) {
  // guestCounts と guestInfo をパース（必要に応じて）
  const guestCounts: GuestCounts =
    typeof reservationData.guestCounts === 'string'
      ? JSON.parse(reservationData.guestCounts)
      : reservationData.guestCounts;

  const guestInfo: GuestInfo =
    typeof reservationData.guestInfo === 'string'
      ? JSON.parse(reservationData.guestInfo)
      : reservationData.guestInfo;

  // 必要に応じて日付をフォーマット
  const formattedCheckInDate = formatDate(reservationData.checkInDate);

  // 宿泊者へのメール送信
  await resend.emails.send({
    from: 'NEST琵琶湖 <info@nest-biwako.com>',
    to: reservationData.guestEmail,
    subject: 'ご予約ありがとうございます',
    react: (
      <GuestReservationEmail
        guestName={reservationData.guestName}
        planName={reservationData.planName}
        checkInDate={formattedCheckInDate}
        nights={Number(reservationData.nights)}
        units={Number(reservationData.units)}
        guestCounts={guestCounts}
        guestInfo={guestInfo}
        paymentMethod={reservationData.paymentMethod}
        totalAmount={reservationData.totalAmount}
        specialRequests={reservationData.specialRequests}
        reservationNumber={reservationData.reservationNumber}
      />
    ),
  });

  // 管理者へのメール送信（sendToAdmin が true の場合のみ）
  if (sendToAdmin) {
    const adminEmail =
      reservationData.adminEmail ||
      process.env.ADMIN_EMAIL ||
      'info.nest.biwako@gmail.com';

    await resend.emails.send({
      from: 'NEST琵琶湖 <info@nest-biwako.com>',
      to: adminEmail,
      subject: '新しい予約がありました',
      react: (
        <AdminReservationNotification
          guestName={reservationData.guestName}
          planName={reservationData.planName}
          checkInDate={formattedCheckInDate}
          nights={Number(reservationData.nights)}
          units={Number(reservationData.units)}
          guestCounts={guestCounts}
          guestInfo={guestInfo}
          paymentMethod={reservationData.paymentMethod}
          totalAmount={reservationData.totalAmount}
          specialRequests={reservationData.specialRequests}
        />
      ),
    });
  }
}

// 日付フォーマット関数の例
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  // フォーマットを指定（例: YYYY年M月D日）
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}


/**
 * キャンセル時のメール送信関数
 */
interface CancellationData {
  guestEmail: string;
  guestName: string;
  adminEmail: string;
  cancelDateTime: string;
  planName: string;
  roomName: string;
  checkInDate: string;
  nights: number;
  units: number;
  guestDetails: GuestDetails; // 修正ポイント
  guestInfo: GuestInfo;
  cancellationFee: string;
}

// GuestDetails インターフェースを定義
interface GuestDetails {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

export async function sendCancellationEmails(
  cancellationData: CancellationData
) {
  const { guestDetails, guestInfo } = cancellationData;

  // 必要に応じて日付をフォーマット
  const formattedCheckInDate = formatDate(cancellationData.checkInDate);

  // 宿泊者へのメール送信
  await resend.emails.send({
    from: 'NEST琵琶湖 <info@nest-biwako.com>',
    to: cancellationData.guestEmail,
    subject: 'ご予約のキャンセルを承りました',
    react: (
      <GuestCancellationEmail
        guestName={cancellationData.guestName}
        cancelDateTime={cancellationData.cancelDateTime}
        planName={cancellationData.planName}
        roomName={cancellationData.roomName}
        checkInDate={formattedCheckInDate}
        nights={Number(cancellationData.nights)}
        units={Number(cancellationData.units)}
        guestDetails={guestDetails}
        guestInfo={guestInfo}
        cancellationFee={cancellationData.cancellationFee}
      />
    ),
  });

  // 管理者へのメール送信
  await resend.emails.send({
    from: 'NEST琵琶湖 <info@nest-biwako.com>',
    to: cancellationData.adminEmail,
    subject: '宿泊キャンセルの通知',
    react: (
      <AdminCancellationNotification
        cancelDateTime={cancellationData.cancelDateTime}
        planName={cancellationData.planName}
        checkInDate={formattedCheckInDate}
        nights={Number(cancellationData.nights)}
        units={Number(cancellationData.units)}
        guestDetails={guestDetails}
        guestInfo={guestInfo}
        cancellationFee={cancellationData.cancellationFee}
      />
    ),
  });
}

/**
 * アフィリエイトIDを送信する関数
 */
interface AffiliateIDData {
  email: string;
  nameKanji: string;
  affiliateCode: string;
}

export async function sendAffiliateIDEmail(data: AffiliateIDData) {
  await resend.emails.send({
    from: 'NEST琵琶湖 <info@nest-biwako.com>',
    to: data.email,
    subject: 'アフィリエイトIDのご案内',
    react: (
      <AffiliateIDEmail
        nameKanji={data.nameKanji}
        affiliateCode={data.affiliateCode}
      />
    ),
  });
}

/**
 * リマインドメールを送信する関数
 */
interface ReminderEmailData {
  email: string;
  name: string;
  checkInDate: string;
  info: string;
  cancel: string;
  template?: 'OneDayBeforeReminderEmail';
  stayNights?: number;
  rooms?: number;
  guests?: {
    male: number;
    female: number;
    childWithBed: number;
    childNoBed: number;
  };
  paymentMethod?: string;
  arrivalMethod?: string;
  checkInTime?: string;
  specialRequests?: string | null;
  totalAmount?: number;
}

export async function sendReminderEmail(data: ReminderEmailData) {
  let emailContent;

  // 必要に応じて日付をフォーマット
  const formattedCheckInDate = formatDate(data.checkInDate);

  if (data.template === 'OneDayBeforeReminderEmail') {
    if (
      data.stayNights === undefined ||
      data.rooms === undefined ||
      data.guests === undefined ||
      data.paymentMethod === undefined ||
      data.arrivalMethod === undefined ||
      data.checkInTime === undefined ||
      data.totalAmount === undefined
    ) {
      throw new Error('必要なフィールドが不足しています');
    }

    emailContent = (
      <OneDayBeforeReminderEmail
        name={data.name}
        checkInDate={formattedCheckInDate}
        stayNights={data.stayNights}
        rooms={data.rooms}
        guests={data.guests}
        paymentMethod={data.paymentMethod}
        arrivalMethod={data.arrivalMethod}
        checkInTime={data.checkInTime}
        specialRequests={data.specialRequests || ''}
        totalAmount={data.totalAmount}
      />
    );
  } else {
    emailContent = (
      <ReminderEmail
        name={data.name}
        checkInDate={formattedCheckInDate}
        info={data.info}
        cancel={data.cancel}
      />
    );
  }

  await resend.emails.send({
    from: 'NEST琵琶湖 <info@nest-biwako.com>',
    to: data.email,
    subject: '【NEST琵琶湖】ご予約のリマインド',
    react: emailContent,
  });
}

/**
 * お礼メールを送信する関数
 */
interface ThankYouEmailData {
  email: string;
  name: string;
}

export async function sendThankYouEmail(data: ThankYouEmailData) {
  const emailContent = <ThankYouEmail name={data.name} />;

  await resend.emails.send({
    from: 'NEST琵琶湖 <info@nest-biwako.com>',
    to: data.email,
    subject: '【NEST琵琶湖】ご利用ありがとうございました',
    react: emailContent,
  });
}
