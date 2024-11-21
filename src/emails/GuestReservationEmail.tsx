import React from 'react';

interface GuestCounts {
  [unit: string]: {
    [date: string]: {
      num_male: number | string;
      num_female: number | string;
      num_child_no_bed: number | string;
      num_child_with_bed: number | string;
    };
  };
}

interface GuestInfo {
  email: string;
  phone: string;
  // 他の必要な情報があれば追加
}

interface GuestReservationEmailProps {
  guestName: string;
  planName: string;
  checkInDate: string;
  nights: number;
  units: number;
  guestCounts: GuestCounts; // guest_counts データをそのまま受け取る
  guestInfo: GuestInfo;
  paymentMethod: string;
  totalAmount: string;
  specialRequests?: string;
  reservationNumber: string;
}

export default function GuestReservationEmail({
  guestName,
  planName,
  checkInDate,
  nights,
  units,
  guestCounts,
  guestInfo,
  paymentMethod,
  totalAmount,
  specialRequests,
  reservationNumber,
}: GuestReservationEmailProps) {
  const { email, phone } = guestInfo;

  // 支払方法のマッピング
  const paymentMethodMap: { [key: string]: string } = {
    onsite: '現地支払い',
    credit: 'クレジットカード決済',
  };

  const displayPaymentMethod = paymentMethodMap[paymentMethod] || paymentMethod;

  // ログインページのURL
  const loginUrl = `https://nestbiwako.vercel.app/login`; // 実際のURLに置き換えてください

  // 各棟ごとの内訳を生成
const unitDetails = Object.entries(guestCounts || {}).map(
  ([unitKey, dates], index) => {
    // 最初の日付のデータを取得
    const firstDateCounts = Object.values(dates)[0];

    const totalMale = Number(firstDateCounts.num_male);
    const totalFemale = Number(firstDateCounts.num_female);
    const totalChildWithBed = Number(firstDateCounts.num_child_with_bed);
    const totalChildNoBed = Number(firstDateCounts.num_child_no_bed);

    // 棟番号を取得して「〇棟目」と表示
    const unitNumber = index + 1;
    const unitLabel = `${unitNumber}棟目`;

    return {
      unitKey,
      unitLabel,
      totalMale,
      totalFemale,
      totalChildWithBed,
      totalChildNoBed,
    };
  }
);

  return (
    <div>
      <p>{guestName}様</p>

      <p>このたびはご予約いただき、誠にありがとうございます。</p>

      <p>以下の内容でご予約を承りました。</p>

      <h2>予約内容</h2>
      <p>
        <strong>予約番号:</strong> {reservationNumber}
      </p>
      <p>
        <strong>プラン:</strong> 【一棟貸切】贅沢選びつくしヴィラプラン
      </p>
      <p>
        <strong>宿泊日:</strong> {checkInDate}から{nights}泊
      </p>
      <p>
        <strong>棟数:</strong> {units}棟
      </p>

      <h3>内訳</h3>
      {unitDetails.map((unit) => (
        <div key={unit.unitKey}>
          <h4>{unit.unitLabel}</h4>
          <ul>
            <li>男性: {unit.totalMale}名</li>
            <li>女性: {unit.totalFemale}名</li>
            <li>子供 (ベッドあり): {unit.totalChildWithBed}名</li>
            <li>子供 (添い寝): {unit.totalChildNoBed}名</li>
          </ul>
        </div>
      ))}

      <h2>予約者基本情報</h2>
      <p>メールアドレス: {email}</p>
      <p>電話番号: {phone}</p>

      <p>
        <strong>お支払方法:</strong> {displayPaymentMethod}
      </p>

      {specialRequests && (
        <>
          <h2>その他ご要望など</h2>
          <p>{specialRequests}</p>
        </>
      )}

      <h2>ご宿泊料金</h2>
      <p>
        <strong>合計:</strong> {totalAmount}円
      </p>

      <p>以下のボタンからご予約内容の確認やキャンセルが可能です。</p>

      {/* ボタンを追加 */}
      <p>
        <a
          href={loginUrl}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#007BFF',
            textDecoration: 'none',
            borderRadius: '5px',
          }}
        >
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
  );
}
