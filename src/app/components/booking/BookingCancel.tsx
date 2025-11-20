'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CustomButton from '@/app/components/ui/CustomButton';
import CustomCard, { CustomCardContent } from '@/app/components/ui/CustomCard';
import { Reservation, MealPlans, GuestCounts } from '@/app/types/supabase';
import { useRouter } from 'next/navigation';
import { format, parse, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 定数定義
const DATE_FORMAT = 'yyyy年MM月dd日';
const DATE_PARSE_FORMAT = 'yyyy-MM-dd';

// キャンセル料計算のための定数
const CANCELLATION_PERIODS = {
  LONG_TERM: 31,  // 31日以前
  MID_TERM: 30,   // 30日前〜8日前
  SHORT_TERM: 7   // 7日前以降
} as const;

const CANCELLATION_RATES = {
  CREDIT_CARD_FEE: 0.036, // 3.6%
  MID_TERM: 0.5,         // 50%
  SHORT_TERM: 1.0        // 100%
} as const;

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

// キャンセル料計算関数
const calculateCancellationFee = (
  checkInDate: Date,
  totalAmount: number,
  paymentMethod: 'credit' | 'onsite' | null
): number => {
  const today = new Date();
  // Math.ceilを使って切り上げ計算（cancel-reservation/route.tsと同じロジック）
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
  );

  console.log('BookingCancel キャンセル料計算:', {
    checkInDate: checkInDate.toISOString(),
    today: today.toISOString(),
    'checkInDate.getTime()': checkInDate.getTime(),
    'today.getTime()': today.getTime(),
    'timeDiff': checkInDate.getTime() - today.getTime(),
    'timeDiff in days': (checkInDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
    daysUntilCheckIn: daysUntilCheckIn,
    totalAmount: totalAmount,
    paymentMethod: paymentMethod
  });

  // キャンセル料の計算
  let cancellationRate = 0;

  if (daysUntilCheckIn <= CANCELLATION_PERIODS.SHORT_TERM) {
    // 7日前以降: 100%
    cancellationRate = CANCELLATION_RATES.SHORT_TERM;
    console.log('→ 7日前以降なので100%');
  } else if (daysUntilCheckIn <= CANCELLATION_PERIODS.MID_TERM) {
    // 30日前〜8日前: 50%
    cancellationRate = CANCELLATION_RATES.MID_TERM;
    console.log('→ 30日前〜8日前なので50%');
  } else if (paymentMethod === 'credit') {
    // 31日以前でクレジットカード決済の場合: 3.6%
    console.log('→ 31日以前＋クレジット決済なので3.6%');
    return totalAmount * CANCELLATION_RATES.CREDIT_CARD_FEE;
  } else {
    console.log('→ 31日以前＋現地決済なので0%');
  }

  const fee = totalAmount * cancellationRate;
  console.log('→ 計算されたキャンセル料:', fee);
  return fee;
};

export default function BookingCancel() {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancellationFee, setCancellationFee] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

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
      if (data.reservation_status === 'customer_cancelled') {
        setIsCancelled(true);
      }

      // 新しいキャンセル料計算ロジックを使用
      const checkInDate = new Date(data.check_in_date);
      const totalAmount = data.payment_amount || data.total_amount;
      const fee = calculateCancellationFee(
        checkInDate,
        totalAmount,
        data.payment_method
      );
      setCancellationFee(Math.floor(fee)); // 小数点以下切り捨て

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

  const handleCancelReservation = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const reservationNumber = localStorage.getItem('reservationNumber');
      const email = localStorage.getItem('email');

      if (!reservationNumber || !email) {
        throw new Error('ユーザーがログインしていません');
      }

      const response = await fetch('/api/cancel-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationNumber,
          email,
          cancellationFee,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '予約のキャンセルに失敗しました');
      }

      setIsCancelled(true);
    } catch (error) {
      setError('予約のキャンセルに失敗しました。');
      console.error('Error cancelling reservation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCancellationContent = () => {
    if (isCancelled || (reservation && reservation.reservation_status === 'customer_cancelled')) {
      return (
        <div className="space-y-4">
          <div className="bg-gray-100 p-6 rounded-lg text-center">
            <p className="text-xl font-bold text-gray-800 mb-2">
              この予約はキャンセル済みです
            </p>
            <p className="text-gray-600">
              キャンセル料: {cancellationFee?.toLocaleString()}円
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        {reservation?.payment_method === 'credit' && (
          <Alert className="mb-4 border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700">
              クレジットカード決済をご利用の場合、チェックイン31日前以前のキャンセルや日程変更でも
              予約総額の3.6%のキャンセル手数料が発生します。
            </AlertDescription>
          </Alert>
        )}
        <CustomButton
          onClick={handleCancelReservation}
          disabled={isProcessing}
          className="bg-blue-500 text-white px-10 py-3 rounded-full text-lg font-bold hover:bg-blue-600 transition-colors disabled:bg-gray-400"
        >
          {isProcessing ? 'キャンセル処理中...' : '予約をキャンセルする'}
        </CustomButton>
        {error && <p className="text-red-500 mt-2 text-base">{error}</p>}
        <div className="text-sm md:text-base space-y-2">
          <p className="text-red-500">※キャンセルの取り消しはできません。</p>
        </div>
      </>
    );
  };

  const CancellationPolicySection = () => {
    const isCredit = reservation?.payment_method === 'credit';
    
    return (
      <Section title="キャンセルポリシー">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-lg">キャンセル料金について</h4>
            <ul className="list-disc pl-5 space-y-2 text-base">
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
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700">
                <span className="font-bold">クレジットカード決済をご利用の場合の注意点：</span>
                <br />
                チェックイン31日前までのキャンセルや日程変更であっても、クレジットカード決済手数料として
                予約総額の3.6%のキャンセル料が発生いたします。
              </AlertDescription>
            </Alert>
          )}

          {cancellationFee !== null && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-bold text-lg mb-2">現在のキャンセル料</h4>
              <p className="text-lg">
                キャンセル料：{cancellationFee.toLocaleString()}円
                {reservation && (
                  <span className="text-sm text-gray-600 block mt-1">
                    （予約総額：{(reservation.payment_amount || reservation.total_amount).toLocaleString()}円）
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </Section>
    );
  };

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
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">予約キャンセル</h2>
            {!isCancelled && reservation.reservation_status !== 'customer_cancelled' && (
              <p className="text-red-500 text-base">まだ予約のキャンセルは成立しておりません</p>
            )}
          </div>

          <CancellationPolicySection />

          <Section title="キャンセル料">
            <div className="space-y-4">
              <p className="text-center font-bold text-2xl">
                {cancellationFee?.toLocaleString()}円
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm md:text-base space-y-2">
                  <p className="font-semibold">予約内容の金額：</p>
                  <div className="ml-4 space-y-1">
                    <p>宿泊料金: {reservation.room_rate.toLocaleString()}円</p>
                    <p>食事プラン: {reservation.total_meal_price.toLocaleString()}円</p>
                    {reservation.coupon_code && (
                      <p className="text-red-500">
                        クーポン割引: -{(reservation.total_amount - (reservation.payment_amount || reservation.total_amount)).toLocaleString()}円
                      </p>
                    )}
                    <div className="border-t pt-1 mt-1">
                      <p className="font-bold">
                        合計: {(reservation.payment_amount || reservation.total_amount).toLocaleString()}円
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <PlanInformation reservation={reservation} />

          <div className="text-center space-y-4">
            {renderCancellationContent()}
          </div>
        </div>
      </CustomCardContent>
    </CustomCard>
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

// ゲスト数集計用の型定義
interface UnitGuestCounts {
  unitId: string;
  numMale: number;
  numFemale: number;
  numChildWithBed: number;
  numChildNoBed: number;
  total: number;
}

function PlanInformation({ reservation }: { reservation: Reservation }) {
  const guestCountsByUnit = getGuestCountsByUnit(reservation.guest_counts);

  return (
    <Section title="プラン情報">
      <div className="space-y-6 max-w-4xl mx-auto"> {/* max-w-4xl と mx-auto を追加 */}
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
            content={format(parseDate(reservation.check_in_date), DATE_FORMAT, { locale: ja })}
          />
          <SubSection title="泊数" content={`${reservation.num_nights}泊`} />
          <SubSection title="棟数" content={`${reservation.num_units}棟`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* lg:grid-cols-3 を削除 */}
          {guestCountsByUnit.map((unitCounts, index) => (
            <div 
              key={unitCounts.unitId} 
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm"
            >
              <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                棟 {index + 1}
              </h4>
              <div className="space-y-3 text-sm md:text-base">
                <div className="md:block"> {/* hidden を削除 */}
                  <div className="flex flex-col mb-4">
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
                </div>

                <div className="flex flex-col">
                  <span className="text-gray-600 font-medium">食事プラン</span> {/* md:hidden を削除 */}
                  <div className="mt-1">
                    <MealPlanContent 
                      unitId={unitCounts.unitId} 
                      mealPlans={reservation.meal_plans} 
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function MealPlanContent({ unitId, mealPlans }: { unitId: string; mealPlans: MealPlans }) {
  if (!mealPlans || !mealPlans[unitId] || Object.keys(mealPlans[unitId]).length === 0) {
    return <p className="text-gray-500">食事プランの選択なし</p>;
  }

  const unitPlans = mealPlans[unitId];
  const mealPlanNames = {
    'plan-a': 'Plan A 贅沢素材のディナーセット',
    'plan-b': 'Plan B お肉づくし！豪華BBQセット',
    'plan-c': '大満足！よくばりお子さまセット',
  };

  return (
    <div className="space-y-2">
      {Object.entries(unitPlans).map(([date, datePlans]) => (
        <div key={date} className="border-b border-gray-200 last:border-b-0 pb-2">
          <p className="text-gray-600 font-medium">
            {format(parseDate(date), DATE_FORMAT, { locale: ja })}
          </p>
          {Object.entries(datePlans).map(([planId, plan]) => (
            <div key={planId} className="ml-4 mt-1">
              <div className="text-gray-800">
                {mealPlanNames[planId as keyof typeof mealPlanNames]} ({plan.count}名)
              </div>
              {plan.menuSelections && (
                <div className="hidden md:block ml-4 text-sm text-gray-600">
                  {Object.entries(plan.menuSelections).map(([category, selections], index) => (
                    <div key={index} className="mt-1">
                      <div className="font-medium">{category}</div>
                      <ul className="list-disc ml-4">
                        {Object.entries(selections).map(([item, count]) =>
                          count > 0 ? (
                            <li key={item}>
                              {item}: {count}
                            </li>
                          ) : null
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const getGuestCountsByUnit = (guestCounts: GuestCounts | null | undefined): UnitGuestCounts[] => {
  if (!guestCounts || Object.keys(guestCounts).length === 0) {
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
  });
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

