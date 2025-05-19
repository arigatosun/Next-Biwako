import React from 'react';

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
  guestName: string;
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
  reservationNumber: string;
  mealPlans: MealPlans;
  purpose: string;
  pastStay: boolean;
}

const AdminReservationNotification = ({
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
  mealPlans,
  purpose,
  pastStay,
}: AdminReservationNotificationProps) => {
  const { email: emailAddress, phone: phoneNumber } = guestInfo;

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

  // 支払方法のマッピング
  const paymentMethodMap: { [key: string]: string } = {
    onsite: '現地支払い',
    credit: 'クレジットカード決済',
  };

  const displayPaymentMethod = paymentMethodMap[paymentMethod] || paymentMethod;

  // ご利用目的のマッピング
  const purposeMap: { [key: string]: string } = {
    travel: 'ご旅行',
    anniversary: '記念日',
    birthday_adult: 'お誕生日(20歳以上)',
    birthday_minor: 'お誕生日(19歳以下)',
    other: 'その他',
  };
  const displayPurpose = purposeMap[purpose] || purpose;

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
      <p>
        <strong>過去の宿泊履歴</strong>: {pastStay ? 'あり' : 'なし'}
      </p>

      <h2>予約内容</h2>

      <p>
        <strong>予約番号</strong>: {reservationNumber}
      </p>
      <p>
        <strong>ご利用目的</strong>: {displayPurpose}
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

      {/* 食事内容の表示 */}
      <h3>食事内容</h3>
      {mealPlans ? (
        Object.entries(mealPlans).map(([unitKey, dates], index) => {
          const unitNumber = index + 1;
          const unitLabel = `${unitNumber}棟目`;

          return (
            <div key={unitKey}>
              <h4>{unitLabel}</h4>
              {Object.entries(dates).map(([date, plans]) => (
                <div key={date}>
                  <p>
                    <strong>{date}</strong>
                  </p>
                  <ul>
                    {Object.entries(plans).map(([planName, plan], idx) => (
                      <li key={idx}>
                        {planName}: {plan.count}名
                        {/* メニュー選択の表示 */}
                        {plan.menuSelections &&
                          Object.keys(plan.menuSelections).length > 0 && (
                            <ul>
                              {Object.entries(plan.menuSelections).map(
                                ([category, items]) => (
                                  <li key={category}>
                                    {category}:
                                    <ul>
                                      {Object.entries(items).map(
                                        ([itemName, quantity], itemIdx) => (
                                          <li key={itemIdx}>
                                            {itemName}: {quantity}名
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        })
      ) : (
        <p>食事の情報がありません。</p>
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
