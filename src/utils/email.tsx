// email.tsx

import { Resend } from 'resend';
import React from 'react';
import { AffiliateRegistration } from '@/emails/AffiliateRegistration';
import { AdminNotification } from '@/emails/AdminNotification';
import GuestReservationEmail from '@/emails/GuestReservationEmail';
import AdminReservationNotification from '@/emails/AdminReservationNotification';
import GuestCancellationEmail from '@/emails/GuestCancellationEmail';
import AdminCancellationNotification from '@/emails/AdminCancellationNotification';
import { AffiliateIDEmail } from '@/emails/AffiliateIDEmail';
import { ReminderEmail } from '@/emails/ReminderEmail';
import { OneDayBeforeReminderEmail } from '@/emails/OneDayBeforeReminderEmail';
import { ThankYouEmail } from '@/emails/ThankYouEmail';
import Stripe from 'stripe';

// Resend クライアントの初期化
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  throw new Error('RESEND_API_KEY is not set in the environment variables');
}
const resend = new Resend(resendApiKey);

// Stripeクライアントの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

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
    from: 'NEST琵琶湖運営 <info@nest-biwako.com>',
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
    from: '運営 <info@nest-biwako.com>',
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

// 領収書情報のインターフェース
interface ReceiptData {
  receiptNumber: string; // PaymentIntentのIDを使用
  amount: number; // 決済金額（円）
  currency: string; // 通貨
  paymentDate: string; // 決済日時
  paymentStatus: string; // 決済ステータス
  cardLast4?: string; // カード下4桁（オプション）
  cardBrand?: string; // カードブランド（オプション）
}

// 拡張されたReservationDataインターフェース
interface ReservationDataWithReceipt extends ReservationData {
  receiptData?: ReceiptData; // 領収書データ（クレジット決済時のみ）
}

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
  mealPlans: MealPlans | string;
  purpose: string;
  pastStay?: boolean;
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

interface MealPlan {
  count: number;
  price: number;
  menuSelections: {
    [category: string]: {
      [item: string]: number;
    };
  };
}

interface MealPlans {
  [unit: string]: {
    [date: string]: {
      [planName: string]: MealPlan;
    };
  };
}

/**
 * StripeのPaymentIntentから領収書データを作成
 */
export async function createReceiptDataFromStripe(
  paymentIntentId: string
): Promise<ReceiptData | null> {
  try {
    console.log(`Creating receipt data for PaymentIntent: ${paymentIntentId}`);
    
    // PaymentIntentの詳細を取得（latest_chargeのみを展開）
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    });

    console.log(`PaymentIntent status: ${paymentIntent.status}`);
    console.log(`PaymentIntent amount: ${paymentIntent.amount}`);

    if (paymentIntent.status !== 'succeeded') {
      console.log(`PaymentIntent ${paymentIntentId} is not succeeded`);
      return null;
    }

    // 最新のChargeから支払い方法の詳細を取得
    const charge = paymentIntent.latest_charge as Stripe.Charge;
    let cardLast4: string | undefined = undefined;
    let cardBrand: string | undefined = undefined;

    console.log('Charge object:', charge ? 'exists' : 'not found');
    
    if (charge?.payment_method_details?.card) {
      cardLast4 = charge.payment_method_details.card.last4 || undefined;
      cardBrand = charge.payment_method_details.card.brand || undefined;
      console.log(`Card info: ${cardBrand} ****${cardLast4}`);
    } else {
      console.log('Payment method details not found in charge');
      // カード情報が取得できない場合でも領収書は作成する
    }

    const receiptData = {
      receiptNumber: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentDate: new Date(paymentIntent.created * 1000).toISOString(),
      paymentStatus: paymentIntent.status,
      cardLast4,
      cardBrand,
    };

    console.log('Receipt data created successfully:', receiptData.receiptNumber);
    return receiptData;
  } catch (error) {
    console.error('Error creating receipt data from Stripe:', error);
    return null;
  }
}

/**
 * 領収書機能を統合した予約確認メール送信関数
 */
export async function sendReservationEmailsWithReceipt(
  reservationData: ReservationDataWithReceipt,
  paymentIntentId?: string,
  sendToAdmin: boolean = true
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

  // mealPlans をパース
  const mealPlans: MealPlans =
    typeof reservationData.mealPlans === 'string'
      ? JSON.parse(reservationData.mealPlans)
      : reservationData.mealPlans;

  // 必要に応じて日付をフォーマット
  const formattedCheckInDate = formatDate(reservationData.checkInDate);

  // 宿泊者へのメール送信（既存のテンプレートを使用し、領収書情報はカスタムHTMLで追加）
  let emailContent: React.ReactElement = (
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
  );

  // 領収書データがある場合は、カスタムHTMLメールを作成
  if (reservationData.receiptData && (reservationData.paymentMethod === 'credit' || reservationData.paymentMethod === 'クレジットカード決済')) {
    console.log('Sending HTML email with receipt...');
    const receiptData = reservationData.receiptData;
    const formatReceiptDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    };

    await resend.emails.send({
      from: 'NEST琵琶湖 <info@nest-biwako.com>',
      to: reservationData.guestEmail,
      subject: 'ご予約ありがとうございます。',
      html: `
        <div>
          <p>${reservationData.guestName}様</p>
          <p>このたびはご予約いただき、誠にありがとうございます。</p>
          <p>以下の内容でご予約を承りました。</p>

          <h2>予約内容</h2>
          <p><strong>予約番号:</strong> ${reservationData.reservationNumber}</p>
          <p><strong>プラン:</strong> 【一棟貸切】贅沢選びつくしヴィラプラン</p>
          <p><strong>宿泊日:</strong> ${formattedCheckInDate}から${reservationData.nights}泊</p>
          <p><strong>棟数:</strong> ${reservationData.units}棟</p>

          <h2>予約者基本情報</h2>
          <p>メールアドレス: ${guestInfo.email}</p>
          <p>電話番号: ${guestInfo.phone}</p>
          <p><strong>お支払方法:</strong> クレジットカード決済</p>

          ${reservationData.specialRequests ? `
            <h2>その他ご要望など</h2>
            <p>${reservationData.specialRequests}</p>
          ` : ''}

          <h2>ご宿泊料金</h2>
          <p><strong>合計:</strong> ${reservationData.totalAmount}円</p>

          <hr style="margin: 30px 0; border: 1px solid #ddd;">
          <h2>領収書</h2>
          <div style="border: 2px solid #333; padding: 20px; margin: 20px 0; background-color: #f9f9f9;">
            <h3 style="text-align: center; margin-bottom: 20px;">領収書（Receipt）</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>領収書番号:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${receiptData.receiptNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>発行日:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${formatReceiptDate(receiptData.paymentDate)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>宛名:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${reservationData.guestName} 様</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>但し書き:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">宿泊料金として</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>金額:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd; font-size: 18px; font-weight: bold;">¥${receiptData.amount.toLocaleString()}円 (内 消費税10%)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>決済方法:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">
                    クレジットカード${receiptData.cardBrand && receiptData.cardLast4 ? ` (${receiptData.cardBrand} ****${receiptData.cardLast4})` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>登録番号:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">T1130001043538</td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top: 20px; text-align: right; border-top: 1px solid #ddd; padding-top: 15px;">
              <p><strong>発行者:NEST琵琶湖</strong></p>
              <p>滋賀県高島市マキノ町新保146-1</p>
              
            </div>
          </div>
          
          <hr style="margin: 30px 0; border: 1px solid #ddd;">

          <p>以下のボタンからご予約内容の確認やキャンセルが可能です。</p>
          <p>
            <a href="https://nestbiwako.vercel.app/login" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
              予約内容の確認・キャンセル
            </a>
          </p>

          <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
          <p>こちらのメールは送信専用になっています。</p>
          <p>お問い合わせはinfo.nest.biwako@gmail.comまでお願いします。</p>
          <p>【緊急時などは下記URLからLINEよりフロントへ通話が可能となっております。】</p>
          <p>https://lin.ee/cO5WQzv</p>
          <p>どうぞよろしくお願いいたします。</p>
        </div>
      `,
    });
  } else {
    console.log('Sending regular React email (no receipt)...');
    console.log('Reason - receiptData:', !!reservationData.receiptData, 'paymentMethod:', reservationData.paymentMethod);
    // 通常のメール送信（領収書なし）
    await resend.emails.send({
      from: 'NEST琵琶湖 <info@nest-biwako.com>',
      to: reservationData.guestEmail,
      subject: 'ご予約ありがとうございます。',
      react: emailContent,
    });
  }

  // 管理者へのメール送信（sendToAdmin が true の場合のみ）
  if (sendToAdmin) {
    const adminEmail =
      reservationData.adminEmail ||
      process.env.ADMIN_EMAIL ||
      'info.nest.biwako@gmail.com';

    await resend.emails.send({
      from: 'NEST琵琶湖 <info@nest-biwako.com>',
      to: adminEmail,
      subject: `新しい予約がありました - ${reservationData.guestName}様 (${formattedCheckInDate}チェックイン)`,
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
          reservationNumber={reservationData.reservationNumber}
          mealPlans={mealPlans}
          purpose={reservationData.purpose}
          pastStay={reservationData.pastStay || false}
        />
      ),
    });
  }
}

/**
 * 予約時のメール送信関数（既存）
 */
export async function sendReservationEmails(
  reservationData: ReservationData,
  sendToAdmin: boolean = true
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

  // mealPlans をパース
  const mealPlans: MealPlans =
    typeof reservationData.mealPlans === 'string'
      ? JSON.parse(reservationData.mealPlans)
      : reservationData.mealPlans;

  // 必要に応じて日付をフォーマット
  const formattedCheckInDate = formatDate(reservationData.checkInDate);

  // 宿泊者へのメール送信
  await resend.emails.send({
    from: 'NEST琵琶湖 <info@nest-biwako.com>',
    to: reservationData.guestEmail,
    subject: 'ご予約ありがとうございます。',
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
      subject: `新しい予約がありました - ${reservationData.guestName}様 (${formattedCheckInDate}チェックイン)`,
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
          reservationNumber={reservationData.reservationNumber}
          mealPlans={mealPlans}
          purpose={reservationData.purpose}
          pastStay={reservationData.pastStay || false}
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
  guestDetails: GuestCounts | string;
  guestInfo: GuestInfo | string;
  cancellationFee: string;
}

// GuestDetails を定義
interface GuestDetails {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

export async function sendCancellationEmails(
  cancellationData: CancellationData
) {
  // guestDetails と guestInfo をパース（必要に応じて）
  const guestDetails: GuestCounts =
    typeof cancellationData.guestDetails === 'string'
      ? JSON.parse(cancellationData.guestDetails)
      : cancellationData.guestDetails;

  const guestInfo: GuestInfo =
    typeof cancellationData.guestInfo === 'string'
      ? JSON.parse(cancellationData.guestInfo)
      : cancellationData.guestInfo;

  // 合計人数を計算
  const totalGuestDetails = calculateTotalGuestDetails(guestDetails);

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
        guestDetails={totalGuestDetails} // 合計人数を渡す
        guestInfo={guestInfo}
        cancellationFee={cancellationData.cancellationFee}
      />
    ),
  });

  // 管理者へのメール送信
  await resend.emails.send({
    from: 'NEST琵琶湖 <info@nest-biwako.com>',
    to: cancellationData.adminEmail,
    subject: `宿泊キャンセルの通知 - ${cancellationData.guestName}様 (${formattedCheckInDate}チェックイン)`,
    react: (
      <AdminCancellationNotification
        cancelDateTime={cancellationData.cancelDateTime}
        planName={cancellationData.planName}
        checkInDate={formattedCheckInDate}
        nights={Number(cancellationData.nights)}
        units={Number(cancellationData.units)}
        guestDetails={guestDetails}
        guestInfo={guestInfo}
        guestName={cancellationData.guestName}
        cancellationFee={cancellationData.cancellationFee}
      />
    ),
  });
}

// 合計人数を計算する関数
function calculateTotalGuestDetails(guestCounts: GuestCounts): GuestDetails {
  let male = 0;
  let female = 0;
  let childWithBed = 0;
  let childNoBed = 0;

  for (const unit of Object.values(guestCounts)) {
    for (const date of Object.values(unit)) {
      male += date.num_male || 0;
      female += date.num_female || 0;
      childWithBed += date.num_child_with_bed || 0;
      childNoBed += date.num_child_no_bed || 0;
    }
  }

  return {
    male,
    female,
    childWithBed,
    childNoBed,
  };
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
  stayNights: number;
  rooms: number;
  guests: {
    male: number;
    female: number;
    childWithBed: number;
    childNoBed: number;
  };
  paymentMethod: string;
  arrivalMethod: string;
  checkInTime: string;
  specialRequests?: string | null;
  totalAmount: number;
}

export async function sendReminderEmail(data: ReminderEmailData) {
  // 日付をフォーマットせずにそのまま使用
  // const formattedCheckInDate = formatDate(data.checkInDate);

  // メールコンテンツを作成
  const emailContent = (
    <ReminderEmail
      name={data.name}
      checkInDate={data.checkInDate} // 生の ISO 日付文字列を渡す
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

  // メールを送信
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
