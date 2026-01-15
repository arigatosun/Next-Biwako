'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CustomCard, { CustomCardContent } from '@/app/components/ui/CustomCard';
import { Reservation, GuestCounts, MealPlan } from '@/app/types/supabase';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

// キャンセルポリシーコンポーネント
const CancellationPolicySection = ({ paymentMethod }: { paymentMethod: 'credit' | 'onsite' | null }) => {
  const isCredit = paymentMethod === 'credit';
  
  return (
    <Section title="キャンセルポリシー">
      <div className="space-y-4">
        <div className="space-y-2">
          <ul className="list-disc pl-5 text-sm md:text-base">
            <li>
              チェックイン31日前まで：
              {isCredit ? (
                <span className="font-medium">予約総額の3.6%（クレジットカード決済手数料）</span>
              ) : (
                <span>無料</span>
              )}
            </li>
            <li>チェックイン30日前〜8日前まで：宿泊料金（食事・オプション含む）の50％</li>
            <li>チェックイン7日前以降：宿泊料金（食事・オプション含む）の100％</li>
          </ul>
        </div>

        {isCredit && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-bold text-yellow-800 mb-2">
              クレジットカード決済をご利用のお客様への重要なご案内
            </h4>
            <p className="text-yellow-700 text-sm">
              チェックイン31日前までのキャンセルや日程変更であっても、クレジットカード決済手数料として
              予約総額の3.6%のキャンセル料が発生いたします。
            </p>
          </div>
        )}
      </div>
    </Section>
  );
};

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold mb-2">エラーが発生しました</p>
          <p className="text-base">{error}</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-base">予約情報が見つかりません。</p>
      </div>
    );
  }

  return (
    <CustomCard>
      <CustomCardContent>
        <div className="space-y-5 text-[#363331]">
          <CancellationPolicySection paymentMethod={reservation.payment_method} />

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
                { label: 'メールアドレス', value: reservation.email },
                { label: '性別', value: reservation.gender === 'male' ? '男性' : '女性' },
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
      <div className="space-y-6">
        <div className="space-y-4 text-sm md:text-base">
          <SubSection 
            title="プラン" 
            content={
              <div>
                <div>【一棟貸切】</div>
                <div>贅沢選びつくしヴィラプラン</div>
              </div>
            } 
          />
          <SubSection
            title="宿泊日"
            content={new Date(reservation.check_in_date).toLocaleDateString('ja-JP')}
          />
          <SubSection title="泊数" content={`${reservation.num_nights}泊`} />
          <SubSection title="棟数" content={`${reservation.num_units}棟`} />
        </div>

        <div className="space-y-4 md:space-y-0 md:flex md:space-x-4">
          {guestCountsByUnit.map((unitCounts, index) => (
            <div 
              key={unitCounts.unitId} 
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm md:flex-1"
            >
              <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                棟 {index + 1}
              </h4>
              <div className="space-y-3 text-sm md:text-base">
                <div className="flex flex-col">
                  <span className="text-gray-600 font-medium">宿泊人数</span>
                  <span className="mt-1">
                    {unitCounts.total}名
                  </span>
                  <div className="ml-4">
                    <div>大人(男性){unitCounts.numMale}名</div>
                    <div>大人(女性){unitCounts.numFemale}名</div>
                    {unitCounts.numChildWithBed > 0 && <div>子供(ベッドあり){unitCounts.numChildWithBed}名</div>}
                    {unitCounts.numChildNoBed > 0 && <div>子供(添い寝){unitCounts.numChildNoBed}名</div>}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-600 font-medium">食事プラン</span>
                  <span className="mt-1 whitespace-pre-line">
                    {getMealPlanString(reservation.meal_plans[unitCounts.unitId])}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-2">
      <h3 
        className="bg-[#333333] text-white p-2 text-lg font-bold text-center flex justify-between items-center cursor-pointer md:cursor-default"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <span className="md:hidden">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </h3>
      <div className={`bg-white p-4 ${isOpen ? 'block' : 'hidden md:block'}`}>{children}</div>
    </div>
  );
}

function SubSection({ title, content }: { title: string; content: string | React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center">
      <div className="bg-gray-200 p-2 md:w-1/3 text-center rounded">{title}</div>
      <div className="mt-2 md:mt-0 md:ml-4 md:w-2/3 text-center md:text-left">{content}</div>
    </div>
  );
}

function InfoTable({ data }: { data: { label: string; value: string }[] }) {
  return (
    <div className="space-y-4 md:space-y-0 text-sm md:text-base">
      {data.map((item, index) => (
        <div key={index} className="border-b last:border-b-0 pb-2 md:pb-0 md:flex md:items-center">
          <div className="font-bold mb-1 md:mb-0 md:w-[30%]">{item.label}</div>
          <div className="md:w-[70%] text-center md:text-left">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

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

  const renderDailyRates = () => {
    const dates: string[] = [];
    // チェックイン日から泊数分の日付を生成
    for (let i = 0; i < reservation.num_nights; i++) {
      const date = new Date(reservation.check_in_date);
      date.setDate(date.getDate() + i);
      dates.push(format(date, DATE_PARSE_FORMAT));
    }

    return dates.map(date => {
      const formattedDate = format(parseDate(date), DATE_FORMAT, { locale: ja });
      // room_ratesに日別料金がある場合はそれを使用、なければ均等割り
      const dailyRate = reservation.room_rates?.[date] ?? (reservation.room_rate / reservation.num_nights);

      return (
        <div key={date} className="mb-4">
          <div className="font-medium bg-gray-100 p-2">{formattedDate}</div>
          {Array.from({ length: reservation.num_units }).map((_, index) => (
            <div key={`${date}-unit-${index}`} className="flex justify-between p-2 border-b">
              <span>棟 {index + 1}</span>
              <span>{dailyRate.toLocaleString()}円</span>
            </div>
          ))}
        </div>
      );
    });
  };

  const renderMealPlans = () => {
    const guestCountsByUnit = getGuestCountsByUnit(reservation.guest_counts);
    const unitIdMap = Object.fromEntries(
      guestCountsByUnit.map((unit, index) => [unit.unitId, index + 1])
    );
  
    const mealPlansByDate: { [date: string]: { [unitId: string]: any[] } } = {};
  
    // 食事プランを日付ごとに整理
    Object.entries(reservation.meal_plans).forEach(([unitId, plans]) => {
      Object.entries(plans).forEach(([date, datePlans]) => {
        if (!mealPlansByDate[date]) {
          mealPlansByDate[date] = {};
        }
        if (!mealPlansByDate[date][unitId]) {
          mealPlansByDate[date][unitId] = [];
        }
        Object.entries(datePlans).forEach(([planId, plan]) => {
          mealPlansByDate[date][unitId].push({
            planId,
            ...plan,
          });
        });
      });
    });
  
    return Object.entries(mealPlansByDate).map(([date, unitPlans]) => {
      const formattedDate = format(parseDate(date), DATE_FORMAT, { locale: ja });
  
      return (
        <div key={date} className="mb-4">
          <div className="font-medium bg-gray-100 p-2">{formattedDate}</div>
          {Object.entries(unitPlans).map(([unitId, plans]) =>
            plans.map((plan, planIndex) => {
              const unitNumber = unitIdMap[unitId];
              const basePricePerPerson = plan.planId === 'plan-a' ? 6500 : 
                                       plan.planId === 'plan-b' ? 6500 : 
                                       plan.planId === 'plan-c' ? 3000 : 0;
              const totalPrice = basePricePerPerson * plan.count;  // 人数分の金額を計算
  
              return (
                <div key={`${date}-${unitId}-${planIndex}`} className="p-2 border-b">
                  <div className="font-medium">
                    {`棟 ${unitNumber} - ${mealPlanNames[plan.planId as keyof typeof mealPlanNames] || plan.planId}`}
                  </div>
                  {renderMealPlanDetails(plan.planId, plan)}
                  <div className="text-right mt-2 font-bold">
                    {totalPrice.toLocaleString()}円
                  </div>
                </div>
              );
            })
          )}
        </div>
      );
    });
  };

  const discountAmount =
    reservation.total_amount - (reservation.payment_amount || reservation.total_amount);

  return (
    <div className="space-y-4 text-sm md:text-base">
      <div className="font-bold p-2 bg-gray-50">&lt;宿泊料金&gt;</div>
      {renderDailyRates()}
      <div className="flex justify-between font-semibold p-2 border-t">
        <span>宿泊料金合計</span>
        <span>{reservation.room_rate.toLocaleString()}円</span>
      </div>

      <div className="font-bold p-2 bg-gray-50 mt-6">&lt;食事プラン&gt;</div>
      {renderMealPlans()}
      <div className="flex justify-between font-semibold p-2 border-t">
        <span>食事プラン合計</span>
        <span>{reservation.total_meal_price.toLocaleString()}円</span>
      </div>

      <div className="space-y-2 mt-6">
        <div className="flex justify-between p-2 border-b">
          <span>消費税</span>
          <span>込み</span>
        </div>
        <div className="flex justify-between p-2 border-b">
          <span>サービス料</span>
          <span>込み</span>
        </div>
        {reservation.coupon_code && discountAmount > 0 && (
          <div className="flex justify-between p-2 border-b">
            <span>クーポン割引 ({reservation.coupon_code})</span>
            <span>- {discountAmount.toLocaleString()}円</span>
          </div>
        )}
        <div className="flex justify-between p-2 bg-gray-100 font-bold text-lg">
          <span>合計金額</span>
          <span>{(reservation.payment_amount || reservation.total_amount).toLocaleString()}円</span>
        </div>
      </div>
    </div>
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
      planStrings.push(`${dateStr}：${planName}（${plan.count}名）`);
    });
  });

  return planStrings.join('\n');
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

