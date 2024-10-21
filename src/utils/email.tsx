// src/utils/email.tsx

import { Resend } from 'resend';
import React from 'react';
import { AffiliateRegistration } from '@/emails/AffiliateRegistration';
import { AdminNotification } from '@/emails/AdminNotification';
import GuestReservationEmail from '@/emails/GuestReservationEmail';
import AdminReservationNotification from '@/emails/AdminReservationNotification'; // デフォルトエクスポートなのでそのまま
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
 * @param affiliateData アフィリエイターの登録データ
 */
export async function sendAffiliateRegistrationEmails(
  affiliateData: {
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
) {
  const adminEmail = "t.koushi@arigatosun.com";

  // アフィリエイターへのメール送信
  await resend.emails.send({
    from: "運営 <t.koushi@arigatosun.com>",
    to: affiliateData.email,
    subject: "アフィリエイター登録が完了しました",
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
    from: "運営 <t.koushi@arigatosun.com>",
    to: adminEmail,
    subject: "新しいアフィリエイターが登録されました",
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
export async function sendReservationEmails(
  reservationData: {
    guestEmail: string;
    guestName: string;
    adminEmail: string;
    planName: string;
    roomName: string;
    checkInDate: string;
    nights: number;
    units: number;
    guestDetails: string;
    guestInfo: string;
    paymentMethod: string;
    totalAmount: string;
    specialRequests?: string;
    reservationNumber: string; // 予約番号を追加
  }
) {
  // 宿泊者へのメール送信
  await resend.emails.send({
    from: 'NEST琵琶湖 <info@nest-biwako.com>',
    to: reservationData.guestEmail,
    subject: 'ご予約ありがとうございます',
    react: (
      <GuestReservationEmail
        guestName={reservationData.guestName}
        planName={reservationData.planName}
        checkInDate={reservationData.checkInDate}
        nights={reservationData.nights}
        units={reservationData.units}
        guestDetails={reservationData.guestDetails}
        guestInfo={reservationData.guestInfo}
        paymentMethod={reservationData.paymentMethod}
        totalAmount={reservationData.totalAmount}
        specialRequests={reservationData.specialRequests}
        reservationNumber={reservationData.reservationNumber} // 追加
      />
    ),
  });

  // 管理者へのメール送信
  await resend.emails.send({
    from: 'NEST琵琶湖 <info@nest-biwako.com>',
    to: reservationData.adminEmail,
    subject: '新しい予約がありました',
    react: (
      <AdminReservationNotification
        planName={reservationData.planName}
        
        checkInDate={reservationData.checkInDate}
        nights={reservationData.nights}
        units={reservationData.units}
        guestDetails={reservationData.guestDetails}
        guestInfo={reservationData.guestInfo}
        paymentMethod={reservationData.paymentMethod}
        totalAmount={reservationData.totalAmount}
        specialRequests={reservationData.specialRequests}
      />
    ),
  });
}

/**
 * キャンセル時のメール送信関数
 */
export async function sendCancellationEmails(
  cancellationData: {
    guestEmail: string;
    guestName: string;
    adminEmail: string;
    cancelDateTime: string;
    planName: string;
    roomName: string;
    checkInDate: string;
    nights: number;
    units: number;
    guestDetails: string;
    guestInfo: string;
    cancellationFee: string;
  }
) {
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
        checkInDate={cancellationData.checkInDate}
        nights={cancellationData.nights}
        units={cancellationData.units}
        guestDetails={cancellationData.guestDetails}
        guestInfo={cancellationData.guestInfo}
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
        
        checkInDate={cancellationData.checkInDate}
        nights={cancellationData.nights}
        units={cancellationData.units}
        guestDetails={cancellationData.guestDetails}
        guestInfo={cancellationData.guestInfo}
        cancellationFee={cancellationData.cancellationFee}
      />
    ),
  });
}

/**
 * アフィリエイトIDを送信する関数
 */
export async function sendAffiliateIDEmail(data: {
  email: string;
  nameKanji: string;
  affiliateCode: string;
}) {
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
export async function sendReminderEmail(data: {
  email: string;
  name: string;
  checkInDate: string;
  info: string;
  cancel: string;
  template?: string;
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
}) {
  let emailContent;

  if (data.template === 'OneDayBeforeReminderEmail') {
    emailContent = (
      <OneDayBeforeReminderEmail
        name={data.name}
        checkInDate={data.checkInDate}
        stayNights={data.stayNights!}
        rooms={data.rooms!}
        guests={data.guests!}
        paymentMethod={data.paymentMethod!}
        arrivalMethod={data.arrivalMethod!}
        checkInTime={data.checkInTime!}
        specialRequests={data.specialRequests || ''}
        totalAmount={data.totalAmount!}
      />
    );
  } else {
    emailContent = (
      <ReminderEmail
        name={data.name}
        checkInDate={data.checkInDate}
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
export async function sendThankYouEmail(data: {
  email: string;
  name: string;
}) {
  const emailContent = (
    <ThankYouEmail
      name={data.name}
    />
  );

  await resend.emails.send({
    from: 'NEST琵琶湖 <info@nest-biwako.com>',
    to: data.email,
    subject: '【NEST琵琶湖】ご利用ありがとうございました',
    react: emailContent,
  });
}
