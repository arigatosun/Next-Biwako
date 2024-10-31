// emails/AdminCancellationNotification.tsx

import React from 'react';

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

interface AdminCancellationNotificationProps {
  cancelDateTime: string;
  planName: string;
  checkInDate: string;
  nights: number;
  units: number;
  guestDetails: GuestCounts; // 型を修正
  guestInfo: {
    email: string;
    phone: string;
  };
  guestName: string; // 追加
  cancellationFee: string;
}

const AdminCancellationNotification = ({
  cancelDateTime,
  planName,
  checkInDate,
  nights,
  units,
  guestDetails,
  guestInfo,
  guestName, // 追加
  cancellationFee,
}: AdminCancellationNotificationProps) => {
  const emailAddress = guestInfo.email || '';
  const phoneNumber = guestInfo.phone || '';

  // 各棟ごとの内訳を生成
  const unitDetails = Object.entries(guestDetails || {}).map(
    ([unitKey, dates], index) => {
      // 最初の日付のデータを取得
      const firstDateCounts = Object.values(dates)[0];

      const totalMale = Number(firstDateCounts.num_male) || 0;
      const totalFemale = Number(firstDateCounts.num_female) || 0;
      const totalChildWithBed = Number(firstDateCounts.num_child_with_bed) || 0;
      const totalChildNoBed = Number(firstDateCounts.num_child_no_bed) || 0;

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
      <p>
        下記のとおり宿泊キャンセルがありましたことをご通知申し上げます。
      </p>

      <p>
        <strong>キャンセル受付日時</strong>: {cancelDateTime}
      </p>

      <h2>予約内容（キャンセル済み）</h2>
      <p>
        <strong>プラン</strong>: {planName}
      </p>

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

      <h2>予約者基本情報</h2>
      <p>お名前: {guestName} 様</p>
      <p>メールアドレス: {emailAddress}</p>
      <p>電話番号: {phoneNumber}</p>

      <p>
        <strong>キャンセル料</strong>: {cancellationFee}
      </p>
    </div>
  );
};

export default AdminCancellationNotification;
