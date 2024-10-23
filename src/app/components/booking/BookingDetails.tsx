'use client';
import React, { useState, useEffect, useCallback } from 'react';
import CustomCard, { CustomCardContent } from '@/app/components/ui/CustomCard';
import { Reservation, GuestCounts, MealPlan, MealPlans } from '@/app/types/supabase';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { foodPlans } from '@/app/data/foodPlans';

// 定数定義
const DATE_FORMAT = 'yyyy年MM月dd日';
const DATE_PARSE_FORMAT = 'yyyy-MM-dd';

// 日付パース用のユーティリティ関数
const parseDate = (dateString: string): Date => {
  try {
    if (!dateString) {
      console.error('Empty date string provided');
      return new Date();
    }
    
    const parsedDate = parse(dateString, DATE_PARSE_FORMAT, new Date());
    
    if (isNaN(parsedDate.getTime())) {
      console.error(`Invalid date string: ${dateString}`);
      return new Date();
    }
    
    return parsedDate;
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return new Date();
  }
};

// ゲスト数集計用の型定義
interface UnitGuestCounts {
  unitId: string;
  numMale: number;
  numFemale: number;
  numChildWithBed: number;
  numChildNoBed: number;
  total: number;
}

export default function BookingDetails() {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservation = useCallback(async () => {
    try {
      const reservationNumber = localStorage.getItem('reservationNumber');
      const email = localStorage.getItem('email');

      if (!reservationNumber || !email) {
        throw new Error('ユーザーがログインしていません');
      }

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!reservation) return <div>予約情報が見つかりません。</div>;

  return (
    <CustomCard>
      <CustomCardContent>
        <div className="space-y-5 text-[#363331]">
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
                  reservation.reservation_status,
                  reservation.payment_method
                )}
              />
              <SubSection
                title="お支払い方法"
                content={getPaymentMethodString(reservation.payment_method)}
              />
            </div>
          </Section>

          <PlanInformation reservation={reservation} />

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

function PlanInformation({ reservation }: { reservation: Reservation }) {
  const guestCountsByUnit = getGuestCountsByUnit(reservation.guest_counts);

  return (
    <Section title="プラン情報">
      <div className="space-y-4">
        <SubSection title="プラン" content="【一棟貸切】贅沢選びつくしヴィラプラン" />
        <SubSection
          title="宿泊日"
          content={new Date(reservation.check_in_date).toLocaleDateString('ja-JP')}
        />
        <SubSection title="泊数" content={`${reservation.num_nights}泊`} />
        <SubSection title="棟数" content={`${reservation.num_units}棟`} />
        
        {guestCountsByUnit.map((unitCounts, index) => (
          <div key={unitCounts.unitId} className="space-y-2">
            <div className="font-semibold text-gray-700 mt-4">棟 {index + 1}</div>
            <SubSection 
              title="宿泊人数" 
              content={`${unitCounts.total}名（${getGuestBreakdown(unitCounts)}）`} 
            />
            <SubSection 
              title="食事プラン" 
              content={getMealPlanString(reservation.meal_plans[unitCounts.unitId])} 
            />
          </div>
        ))}
      </div>
    </Section>
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

const getGuestCountsByUnit = (guestCounts: GuestCounts | null | undefined): UnitGuestCounts[] => {
  if (!guestCounts || Object.keys(guestCounts).length === 0) {
    console.warn('Guest counts is empty or invalid');
    return [{
      unitId: '0',
      numMale: 0,
      numFemale: 0,
      numChildWithBed: 0,
      numChildNoBed: 0,
      total: 0
    }];
  }

  return Object.entries(guestCounts).map(([unitId, dates]) => {
    try {
      const firstDate = Object.values(dates)[0] || {
        num_male: 0,
        num_female: 0,
        num_child_with_bed: 0,
        num_child_no_bed: 0
      };

      return {
        unitId,
        numMale: firstDate.num_male,
        numFemale: firstDate.num_female,
        numChildWithBed: firstDate.num_child_with_bed,
        numChildNoBed: firstDate.num_child_no_bed,
        total: firstDate.num_male + firstDate.num_female + 
               firstDate.num_child_with_bed + firstDate.num_child_no_bed
      };
    } catch (error) {
      console.error(`Error processing unit ${unitId}:`, error);
      return {
        unitId,
        numMale: 0,
        numFemale: 0,
        numChildWithBed: 0,
        numChildNoBed: 0,
        total: 0
      };
    }
  });
};

const getGuestBreakdown = (counts: UnitGuestCounts): string => {
  const parts: string[] = [];
  
  if (counts.numMale > 0) parts.push(`大人(男性)${counts.numMale}名`);
  if (counts.numFemale > 0) parts.push(`大人(女性)${counts.numFemale}名`);
  if (counts.numChildWithBed > 0) parts.push(`子供(ベッドあり)${counts.numChildWithBed}名`);
  if (counts.numChildNoBed > 0) parts.push(`子供(添い寝)${counts.numChildNoBed}名`);
  
  return parts.join('、');
};

function EstimateTable({ reservation }: { reservation: Reservation }) {
  const mealPlanNames = {
    'plan-a': 'Plan A 贅沢素材のディナーセット',
    'plan-b': 'Plan B お肉づくし！豪華BBQセット',
    'plan-c': '大満足！よくばりお子さまセット',
  };

  const renderMealPlanDetails = (planId: string, plan: MealPlan) => {
    if (!plan.menuSelections) {
      return null;
    }

    return Object.entries(plan.menuSelections).map(
      ([category, selections], index) => (
        <div key={index} className="ml-4 text-sm">
          <strong>{category}:</strong>
          <ul className="list-disc ml-4">
            {Object.entries(selections).map(([item, count], itemIndex) =>
              count > 0 ? (
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

  const renderUnitMealPlans = (unitId: string, mealPlans: { [date: string]: { [planId: string]: MealPlan } }) => {
    return Object.entries(mealPlans).map(([date, plans]) => {
      const formattedDate = format(parseDate(date), DATE_FORMAT, { locale: ja });
      
      return (
        <React.Fragment key={`${unitId}-${date}`}>
          <tr>
            <td colSpan={3} className="p-2 border bg-gray-200">
              棟 {parseInt(unitId, 10) + 1} - {formattedDate}
            </td>
          </tr>
          {Object.entries(plans).map(([planId, plan]) => {
            const totalPlanPrice = plan.price * plan.count;

            return (
              <tr key={`${unitId}-${date}-${planId}`}>
                <td className="p-2 border">
                  {mealPlanNames[planId as keyof typeof mealPlanNames] || planId}
                  {renderMealPlanDetails(planId, plan)}
                </td>
                <td className="p-2 border">{plan.count}</td>
                <td className="text-right p-2 border">
                  {totalPlanPrice.toLocaleString()}円
                </td>
              </tr>
            );
          })}
        </React.Fragment>
      );
    });
  };

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
          {Object.entries(reservation.meal_plans).map(([unitId, unitMealPlans]) => 
            renderUnitMealPlans(unitId, unitMealPlans)
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
    </div>
  );
}

const getMealPlanString = (unitMealPlans: { [date: string]: { [planId: string]: MealPlan } }): string => {
  if (!unitMealPlans || Object.keys(unitMealPlans).length === 0) {
    return '食事プランなし';
  }

  const mealPlanNames = {
    'plan-a': 'Plan A 贅沢素材のディナーセット',
    'plan-b': 'Plan B お肉づくし！豪華BBQセット',
    'plan-c': '大満足！よくばりお子さまセット',
  };

  const planStrings: string[] = [];

  Object.entries(unitMealPlans).forEach(([date, plans]) => {
    const dateStr = format(parseDate(date), DATE_FORMAT, { locale: ja });
    Object.entries(plans).forEach(([planId, plan]) => {
      const planName = mealPlanNames[planId as keyof typeof mealPlanNames] || planId;
      planStrings.push(`${dateStr}: ${planName} (${plan.count}名)`);
    });
  });

  return planStrings.join('、');
};

function getReservationStatusString(
  status: string | undefined,
  paymentMethod: 'onsite' | 'credit' | null
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

function getPaymentMethodString(method: 'onsite' | 'credit' | null): string {
  const methodMap: { [key: string]: string } = {
    credit: 'クレジットカード',
    onsite: '現地決済',
  };
  return method ? methodMap[method] || '不明な支払い方法' : '支払い方法未設定';
}