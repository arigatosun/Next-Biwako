// BookingDetails.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import CustomButton from '@/app/components/ui/CustomButton';
import CustomCard, { CustomCardContent } from '@/app/components/ui/CustomCard';
import { Mail } from 'lucide-react';
import { Reservation } from '@/app/types/supabase';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// ハードコードされた食事プランの定義をインポート
import { foodPlans } from '@/app/data/foodPlans';

export default function BookingDetails() {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservation = useCallback(async () => {
    try {
      // 'reservationNumber' と 'email' を localStorage から取得
      const reservationNumber = localStorage.getItem('reservationNumber');
      const email = localStorage.getItem('email');

      if (!reservationNumber || !email) {
        throw new Error('ユーザーがログインしていません');
      }

      // 'authToken' を生成
      const token = btoa(`${reservationNumber}:${email}`);

      const response = await fetch('/api/reservations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reservation');
      }

      const data = await response.json();
      setReservation(data);
    } catch (error) {
      setError('予約情報の取得に失敗しました。');
      console.error('Error fetching reservation:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  const resendConfirmationEmail = () => {
    console.log('予約内容確認メールを再送信しました');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!reservation) return <div>予約情報が見つかりません。</div>;

  return (
    <CustomCard>
      <CustomCardContent>
        <div className="space-y-5 text-[#363331]">
          <div className="flex justify-between items-center mb-4">
            <p className="text-base font-semibold">＜予約内容の確認ができます＞</p>
            <div className="bg-[#333333] rounded-lg p-2">
              <CustomButton
                variant="primary"
                onClick={resendConfirmationEmail}
                className="text-white text-sm flex items-center"
              >
                <Mail className="mr-2 h-4 w-4" />
                予約内容確認のメールの再送信
              </CustomButton>
            </div>
          </div>

          <Section title="キャンセルポリシー">
            <ul className="list-disc pl-5 text-center">
              <li>宿泊日から30日前〜　宿泊料金（食事・オプション含む）の５０％</li>
              <li>宿泊日から7日前〜　宿泊料金（食事・オプション含む）の１００％</li>
            </ul>
          </Section>

          <Section title="予約情報">
            <div className="space-y-4">
              <SubSection title="予約番号" content={reservation.reservation_number} />
              <SubSection
                title="予約受付日時"
                content={new Date(reservation.created_at).toLocaleString('ja-JP')}
              />
              <SubSection
                title="予約状況"
                content={getReservationStatusString(
                  reservation.reservation_status ?? '',
                  reservation.payment_method ?? ''
                )}
              />
              <SubSection
                title="お支払い方法"
                content={getPaymentMethodString(reservation.payment_method ?? '')}
              />
            </div>
          </Section>

          <Section title="プラン情報">
            <div className="space-y-4">
              <SubSection title="プラン" content="【一棟貸切】贅沢選びつくしヴィラプラン" />
              <SubSection
                title="宿泊日"
                content={new Date(reservation.check_in_date).toLocaleDateString('ja-JP')}
              />
              <SubSection title="泊数" content={`${reservation.num_nights}泊`} />
              <SubSection title="棟数" content={`${reservation.num_units}棟`} />
              <SubSection title="チェックイン予定時間" content={reservation.estimated_check_in_time} />
              <SubSection title="ご利用目的" content={getPurposeString(reservation.purpose)} />
              <SubSection
                title="交通手段"
                content={getTransportationMethodString(reservation.transportation_method)}
              />
              <SubSection title="食事プラン" content={getMealPlanString(reservation.meal_plans)} />
            </div>
          </Section>

          <Section title="お見積もり内容">
            <EstimateTable reservation={reservation} />
          </Section>

          <Section title="予約者情報">
            <InfoTable
              data={[
                { label: '氏名', value: reservation.name },
                { label: '氏名（ふりがな）', value: reservation.name_kana },
                { label: 'メールアドレス', value: reservation.email },
                { label: '性別', value: reservation.gender === 'male' ? '男性' : '女性' },
                {
                  label: '生年月日',
                  value: new Date(reservation.birth_date).toLocaleDateString('ja-JP'),
                },
                { label: '電話番号', value: reservation.phone_number },
                { label: '郵便番号', value: reservation.postal_code },
                { label: '都道府県', value: reservation.prefecture },
                { label: '市区町村/番地', value: reservation.city_address },
                { label: '建物名・アパート名など', value: reservation.building_name || '(なし)' },
                { label: '過去の宿泊', value: reservation.past_stay ? 'あり' : 'なし' },
                { label: '特別なご要望', value: reservation.special_requests || '(なし)' },
              ]}
            />
          </Section>
        </div>
      </CustomCardContent>
    </CustomCard>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="bg-[#333333] text-white p-2 text-lg font-bold text-center">{title}</h3>
      <div className="bg-white p-4">{children}</div>
    </div>
  );
}

function SubSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="flex items-center">
      <div className="bg-gray-200 p-2 w-1/3 text-center rounded">{title}</div>
      <div className="ml-4 w-2/3">{content}</div>
    </div>
  );
}

function InfoTable({ data }: { data: { label: string; value: string }[] }) {
  return (
    <table className="w-full">
      <tbody>
        {data.map((item, index) => (
          <tr key={index} className="border-b last:border-b-0">
            <td className="py-2 w-[30%] font-bold">{item.label}</td>
            <td className="py-2 w-[70%]">{item.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 食事プランの価格を取得する関数
function getPlanPrice(planId: string): number {
  const plan = foodPlans.find((p) => p.id === planId);
  return plan ? plan.price : 0;
}

// PlanDetails の型定義
interface PlanDetails {
  count: number;
  menuSelections?: {
    [category: string]: {
      [item: string]: number;
    };
  };
}

function EstimateTable({ reservation }: { reservation: Reservation }) {
  const mealPlanNames = {
    'plan-a': 'Plan A 贅沢素材のディナーセット',
    'plan-b': 'Plan B お肉づくし！豪華BBQセット',
    'plan-c': '大満足！よくばりお子さまセット',
  };

  const renderMealPlanDetails = (planId: string, planDetails: PlanDetails) => {
    if (!planDetails.menuSelections) {
      return null;
    }

    return Object.entries(planDetails.menuSelections).map(
      ([category, selections]: [string, { [item: string]: number }], index) => (
        <div key={index} className="ml-4 text-sm">
          <strong>{category}:</strong>
          <ul className="list-disc ml-4">
            {Object.entries(selections).map(([item, count], itemIndex) =>
              typeof count === 'number' && count > 0 ? (
                <li key={itemIndex}>
                  {item}: {count}
                </li>
              ) : null
            )}
          </ul>
        </div>
      )
    );
  };

  // クーポン割引額の計算
  const discountAmount =
    reservation.total_amount - (reservation.payment_amount || reservation.total_amount);

  return (
    <div className="space-y-4">
      {/* 宿泊料金 */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">プラン</th>
            <th className="text-left p-2 border">数量</th>
            <th className="text-right p-2 border">金額</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3} className="font-bold p-2 border bg-gray-50">
              &lt;宿泊料金&gt;
            </td>
          </tr>
          <tr>
            <td className="p-2 border">ヴィラ料金</td>
            <td className="p-2 border">{reservation.num_units}棟</td>
            <td className="text-right p-2 border">{reservation.room_rate.toLocaleString()}円</td>
          </tr>
        </tbody>
      </table>

      {/* 食事プラン */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">プラン</th>
            <th className="text-left p-2 border">数量</th>
            <th className="text-right p-2 border">金額</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3} className="font-bold p-2 border bg-gray-50">
              &lt;食事プラン&gt;
            </td>
          </tr>
          {reservation.meal_plans && Object.keys(reservation.meal_plans).length > 0 ? (
            Object.entries(reservation.meal_plans).map(([date, plans], index) => {
              // 日付の存在チェック
              if (!date) {
                console.error('Date is invalid:', date);
                return null;
              }

              // 日付のパース
              const parsedDate = new Date(date);

              // パース結果のチェック
              if (isNaN(parsedDate.getTime())) {
                console.error('Parsed date is invalid:', parsedDate);
                return null;
              }

              const formattedDate = format(parsedDate, 'yyyy年MM月dd日', { locale: ja });

              return (
                <React.Fragment key={index}>
                  <tr>
                    <td colSpan={3} className="p-2 border bg-gray-200">
                      {formattedDate}
                    </td>
                  </tr>
                  {Object.entries(plans as { [key: string]: PlanDetails }).map(
                    ([planId, planDetails], idx) => {
                      const planPrice = getPlanPrice(planId);
                      const count = Number(planDetails.count) || 0;
                      const totalPlanPrice = planPrice * count;

                      return (
                        <tr key={`${index}-${idx}`}>
                          <td className="p-2 border">
                            {mealPlanNames[planId as keyof typeof mealPlanNames] || planId}
                            {renderMealPlanDetails(planId, planDetails)}
                          </td>
                          <td className="p-2 border">{count}</td>
                          <td className="text-right p-2 border">
                            {totalPlanPrice.toLocaleString()}円
                          </td>
                        </tr>
                      );
                    }
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td colSpan={3} className="p-2 border text-center">食事プランなし</td>
            </tr>
          )}
          <tr>
            <td colSpan={2} className="p-2 border font-bold">食事プラン合計</td>
            <td className="text-right p-2 border font-bold">
              {reservation.total_meal_price.toLocaleString()}円
            </td>
          </tr>
        </tbody>
      </table>

      {/* 割引と合計金額 */}
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td colSpan={2} className="p-2 border">消費税</td>
            <td className="text-right p-2 border">込み</td>
          </tr>
          <tr>
            <td colSpan={2} className="p-2 border">サービス料</td>
            <td className="text-right p-2 border">込み</td>
          </tr>
          {reservation.coupon_code && discountAmount > 0 && (
            <tr>
              <td colSpan={2} className="p-2 border">
                クーポン割引 ({reservation.coupon_code})
              </td>
              <td className="text-right p-2 border">- {discountAmount.toLocaleString()}円</td>
            </tr>
          )}
          <tr className="font-bold text-lg bg-gray-100">
            <td colSpan={2} className="p-2 border">合計金額</td>
            <td className="text-right p-2 border">
              {reservation.payment_amount
                ? `${reservation.payment_amount.toLocaleString()}円`
                : `${reservation.total_amount.toLocaleString()}円`}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 宿泊人数の内訳 */}
      <div className="text-sm">
        <p>宿泊人数: {reservation.total_guests}名</p>
        <p>内訳:</p>
        <ul className="list-disc ml-4">
          <li>大人 (男性): {reservation.num_male}名</li>
          <li>大人 (女性): {reservation.num_female}名</li>
          <li>子供 (ベッドあり): {reservation.num_child_with_bed}名</li>
          <li>子供 (添い寝): {reservation.num_child_no_bed}名</li>
        </ul>
      </div>
    </div>
  );
}

function getMealPlanString(mealPlans: { [date: string]: any }): string {
  if (!mealPlans || Object.keys(mealPlans).length === 0) {
    return '食事プランなし';
  }
  const mealPlanNames = {
    'plan-a': 'Plan A 贅沢素材のディナーセット',
    'plan-b': 'Plan B お肉づくし！豪華BBQセット',
    'plan-c': '大満足！よくばりお子さまセット',
  };
  let planStrings: string[] = [];

  Object.entries(mealPlans).forEach(([date, plans]) => {
    Object.entries(plans as { [key: string]: PlanDetails }).forEach(([planId, planDetails]) => {
      const planName = mealPlanNames[planId as keyof typeof mealPlanNames] || planId;
      planStrings.push(`${planName} (${planDetails.count}名)`);
    });
  });

  return planStrings.join(', ');
}

function getReservationStatusString(
  status: string | undefined,
  paymentMethod: string | undefined
): string {
  if (status === 'pending' && paymentMethod === 'credit') {
    return 'クレジット決済完了';
  } else if (status === 'confirmed' && paymentMethod === 'onsite') {
    return '予約確定（現地決済）';
  } else if (status === 'cancelled') {
    return 'クレジット決済失敗';
  } else if (status === 'pending' && paymentMethod === 'onsite') {
    return '予約待ち（現地決済）';
  } else if (status === 'customer_cancelled' && paymentMethod === 'onsite') {
    return 'キャンセル済';
  } else if (status === 'customer_cancelled' && paymentMethod === 'credit') {
    return 'キャンセル済';
  } else {
    return '不明な状態';
  }
}

function getPaymentMethodString(method: string | undefined): string {
  const methodMap: { [key: string]: string } = {
    credit: 'クレジットカード',
    onsite: '現地決済',
  };
  return method ? methodMap[method] || '不明な支払い方法' : '支払い方法未設定';
}

function getPurposeString(purpose: string): string {
  const purposeMap: { [key: string]: string } = {
    travel: '旅行',
    anniversary: '記念日',
    birthday_adult: '誕生日（大人）',
    birthday_minor: '誕生日（未成年）',
    other: 'その他',
  };
  return purposeMap[purpose] || purpose;
}

function getTransportationMethodString(method: string): string {
  const methodMap: { [key: string]: string } = {
    car: '車',
    train: '電車',
    other: 'その他',
  };
  return methodMap[method] || method;
}
