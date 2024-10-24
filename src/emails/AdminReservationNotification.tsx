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

interface AdminReservationNotificationProps {
  guestName: string; // 追加
  planName: string;
  checkInDate: string;
  nights: number;
  units: number;
  guestCounts: GuestCounts;
  guestInfo: {
    email: string;
    phone: string;
  };
  paymentMethod: string;
  totalAmount: string;
  specialRequests?: string;
}

const AdminReservationNotification = ({
  guestName, // 追加
  planName,
  checkInDate,
  nights,
  units,
  guestCounts,
  guestInfo,
  paymentMethod,
  totalAmount,
  specialRequests,
}: AdminReservationNotificationProps) => {
  const { email: emailAddress, phone: phoneNumber } = guestInfo;

  // 各棟ごとの内訳を生成
  const unitDetails = Object.entries(guestCounts || {}).map(
    ([unitKey, dates], index) => {
      // 各棟の合計人数を計算
      let totalMale = 0;
      let totalFemale = 0;
      let totalChildWithBed = 0;
      let totalChildNoBed = 0;

      Object.values(dates).forEach((dateCounts) => {
        totalMale += Number(dateCounts.num_male);
        totalFemale += Number(dateCounts.num_female);
        totalChildWithBed += Number(dateCounts.num_child_with_bed);
        totalChildNoBed += Number(dateCounts.num_child_no_bed);
      });

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

  // 支払方法のマッピング
  const paymentMethodMap: { [key: string]: string } = {
    onsite: '現地支払い',
    credit: 'クレジットカード決済',
  };

  const displayPaymentMethod = paymentMethodMap[paymentMethod] || paymentMethod;

  return (
    <div>
      <p>新しい予約がありました。</p>

      <h2>予約者情報</h2>
      <p>
        <strong>お名前</strong>: {guestName} 様
      </p>
      <p>
        <strong>メールアドレス</strong>: {emailAddress}
      </p>
      <p>
        <strong>電話番号</strong>: {phoneNumber}
      </p>

      <h2>予約内容</h2>
     
      <p>
        <strong>宿泊日</strong>: {checkInDate}から{nights}泊
      </p>
      <p>
        <strong>棟数</strong>: {units}棟
      </p>

      <h3>内訳</h3>
      {unitDetails.length > 0 ? (
        unitDetails.map((unit) => (
          <div key={unit.unitKey}>
            <h4>{unit.unitLabel}</h4>
            <ul>
              <li>男性: {unit.totalMale}名</li>
              <li>女性: {unit.totalFemale}名</li>
              <li>子供 (ベッドあり): {unit.totalChildWithBed}名</li>
              <li>子供 (添い寝): {unit.totalChildNoBed}名</li>
            </ul>
          </div>
        ))
      ) : (
        <p>内訳の情報がありません。</p>
      )}

      <p>
        <strong>お支払方法</strong>: {displayPaymentMethod}
      </p>

      {specialRequests && (
        <>
          <h2>その他ご要望など</h2>
          <p>{specialRequests}</p>
        </>
      )}

      <h2>ご宿泊料金</h2>
      <p>
        <strong>合計</strong>: {totalAmount}円
      </p>
    </div>
  );
};

export default AdminReservationNotification;
