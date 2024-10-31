'use client';
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { FoodPlan } from '@/app/types/food-plan';
import { useReservation } from '@/app/contexts/ReservationContext';
import { SelectedFoodPlanByUnit } from '@/app/types/ReservationTypes';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface GuestCounts {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

interface GuestSelectionData {
  guestCounts: GuestCounts[];
  totalPrice: number;
  units: number;
  nights: number;
}

interface ReservationConfirmationProps {
  guestSelectionData?: GuestSelectionData;
  foodPlans: FoodPlan[];
  amenities: { label: string; content: string }[];
  onPersonalInfoClick: () => void;
}

// 型安全な Object.entries のヘルパー関数
function typedEntries<K extends string, V>(obj: Record<K, V>): [K, V][] {
  return Object.entries(obj) as [K, V][];
}

const ReservationConfirmation: React.FC<ReservationConfirmationProps> = ({
  guestSelectionData,
  foodPlans,
  amenities,
  onPersonalInfoClick,
}) => {
  const { state, dispatch } = useReservation();

  // エラーメッセージの状態を追加
  const [error, setError] = useState<string | null>(null);

  // バリデーション関数を追加
  const validateMenuSelections = useCallback(() => {
    for (let unitIndex in state.selectedFoodPlansByUnit) {
      const unitPlans = state.selectedFoodPlansByUnit[unitIndex];
      for (let date in unitPlans) {
        const datePlans = unitPlans[date];
        for (let planId in datePlans) {
          const planInfo = datePlans[planId];
          const plan = foodPlans.find((p) => p.id === planId);
          if (!plan) continue;
          if (plan.menuItems) {
            // メニュー選択が必要なプラン
            const menuSelections = planInfo.menuSelections || {};
            const count = planInfo.count;
  
            // 各カテゴリーごとに選択数をチェック
            for (let category in plan.menuItems) {
              const items = menuSelections[category] || {};
              const categoryTotal = Object.values(items).reduce(
                (sum, itemCount) => sum + itemCount,
                0
              );
              if (categoryTotal !== count) {
                setError(
                  `プラン「${plan.name}」の「${category}」で選択したメニューの数が人数と一致していません。${count}名分のメニューを選択してください。`
                );
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  }, [state.selectedFoodPlansByUnit, foodPlans]);

  // 「個人情報入力」ボタンのハンドラーを修正
  const handlePersonalInfoClickInternal = useCallback(() => {
    if (!validateMenuSelections()) {
      setError(
        '選択したメニューの数がプランの人数と一致していません。プランの人数に合わせてメニューを選択してください。'
      );
      return;
    }
  
    // エラーをクリア
    setError(null);
  
    // 次の画面に遷移
    onPersonalInfoClick();
  }, [validateMenuSelections, onPersonalInfoClick]);

  const totalGuests = useMemo(() => {
    return (
      guestSelectionData?.guestCounts.reduce(
        (acc, count) =>
          acc +
          count.male +
          count.female +
          count.childWithBed +
          count.childNoBed,
        0
      ) ?? 0
    );
  }, [guestSelectionData]);

  const mealGuests = useMemo(() => {
    return Object.values(state.selectedFoodPlansByUnit).reduce(
      (sum: number, unitPlans) => {
        return (
          sum +
          Object.values(unitPlans).reduce((unitSum: number, datePlans) => {
            return (
              unitSum +
              Object.values(datePlans).reduce((dateSum: number, plan) => {
                return dateSum + plan.count;
              }, 0)
            );
          }, 0)
        );
      },
      0
    );
  }, [state.selectedFoodPlansByUnit]);

  const noMealGuests = useMemo(
    () => totalGuests - mealGuests,
    [totalGuests, mealGuests]
  );

  const nights = useMemo(
    () => guestSelectionData?.nights || state.nights || 1,
    [guestSelectionData, state.nights]
  );
  const units = useMemo(
    () => guestSelectionData?.units || state.units || 1,
    [guestSelectionData, state.units]
  );

  const roomPrice = useMemo(() => {
    return state.dailyRates.reduce((sum: number, dailyRate) => {
      return sum + dailyRate.price * units;
    }, 0);
  }, [state.dailyRates, units]);

  const totalMealPrice = useMemo(() => {
    return Object.values(state.selectedFoodPlansByUnit).reduce(
      (sum: number, unitPlans) => {
        return (
          sum +
          Object.values(unitPlans).reduce((unitSum: number, datePlans) => {
            return (
              unitSum +
              Object.values(datePlans).reduce((dateSum: number, planInfo) => {
                return dateSum + planInfo.price;
              }, 0)
            );
          }, 0)
        );
      },
      0
    );
  }, [state.selectedFoodPlansByUnit]);

  const totalAmount = useMemo(
    () => roomPrice + totalMealPrice,
    [roomPrice, totalMealPrice]
  );

  useEffect(() => {
    dispatch({ type: 'SET_TOTAL_PRICE', payload: totalAmount });
    dispatch({ type: 'SET_TOTAL_MEAL_PRICE', payload: totalMealPrice });
  }, [dispatch, totalAmount, totalMealPrice]);

  const formatDate = useCallback((date: Date): string => {
    return format(date, 'yyyy年MM月dd日（E）', { locale: ja });
  }, []);

  return (
    <div className="bg-[#F7F7F7] p-4 sm:p-6 rounded-lg">
      <h2 className="bg-[#363331] text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-white p-3 rounded-lg">
        予約内容の確認
      </h2>

      <div className="bg-white rounded-lg p-4 mb-4 sm:mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <span className="text-base sm:text-lg font-semibold text-[#363331] mb-2 sm:mb-0">
            合計金額
          </span>
          <div className="text-center sm:text-right">
            <span className="text-3xl sm:text-4xl font-bold text-[#00A2EF]">
              {totalAmount.toLocaleString()}
            </span>
            <span className="text-lg sm:text-xl text-[#363331]">円</span>
            <span className="block sm:inline text-sm text-gray-500 mt-1 sm:mt-0 sm:ml-2">
              (一人あたり 約
              {totalGuests > 0
                ? Math.round(totalAmount / totalGuests).toLocaleString()
                : 0}
              円)
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#363331] text-white p-3 rounded-t-lg">
        <h3 className="text-base sm:text-lg font-semibold">宿泊料金</h3>
      </div>
      <div className="bg-white p-4 rounded-b-lg mb-4 sm:mb-6 text-[#363331]">
        {state.dailyRates.map((dailyRate, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2"
          >
            <span className="mb-1 sm:mb-0">
              {`${formatDate(dailyRate.date)}: ${units}棟`}
            </span>
            <span>
              {dailyRate.price.toLocaleString()}円 × {units}棟 ={' '}
              {(dailyRate.price * units).toLocaleString()}円
            </span>
          </div>
        ))}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 font-bold">
          <span className="mb-1 sm:mb-0">宿泊料金合計</span>
          <span>{roomPrice.toLocaleString()}円</span>
        </div>
      </div>

      <div className="bg-[#363331] text-white p-3 rounded-t-lg">
        <h3 className="text-base sm:text-lg font-semibold">選択された食事プラン</h3>
      </div>
      <div className="bg-white p-4 rounded-b-lg mb-4 sm:mb-6 text-[#363331]">
        {typedEntries(state.selectedFoodPlansByUnit).map(
          ([unitIndex, unitPlans]) => (
            <div key={unitIndex} className="mb-6">
              <h4 className="text-lg font-semibold mb-2">
                {Number(unitIndex) + 1}棟目の食事プラン
              </h4>
              {typedEntries(unitPlans).map(([date, plansForDate]) => (
                <div key={date} className="mb-4">
                  <h5 className="font-medium">
                    {formatDate(new Date(date))}
                  </h5>
                  {typedEntries(plansForDate).map(([planId, planInfo]) => {
                    const plan = foodPlans.find((p) => p.id === planId);
                    if (plan && planInfo.count > 0) {
                      return (
                        <div key={planId} className="ml-4 mb-2">
                          <div className="flex justify-between">
                            <span>{plan.name}</span>
                            <span>
                              {planInfo.count}名 ×{' '}
                              {plan.price.toLocaleString()}円 ={' '}
                              {(
                                planInfo.count * plan.price
                              ).toLocaleString()}
                              円
                            </span>
                          </div>
                          {planInfo.menuSelections &&
                            Object.keys(planInfo.menuSelections).length > 0 && (
                              <div className="ml-6 mt-1">
                                <strong>詳細:</strong>
                                <ul className="list-disc list-inside">
                                  {typedEntries(
                                    planInfo.menuSelections
                                  ).map(([category, items]) => (
                                    <li key={category}>
                                      {category}:
                                      {typedEntries(items).map(
                                        ([item, count]) => (
                                          <span key={item}>
                                            {' '}
                                            {item}({count}名)
                                          </span>
                                        )
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ))}
            </div>
          )
        )}
        {noMealGuests > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
            <span className="mb-1 sm:mb-0">食事なし</span>
            <span>{noMealGuests}名 × 0円 = 0円</span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 font-bold">
          <span className="mb-1 sm:mb-0">食事代合計</span>
          <span>{totalMealPrice.toLocaleString()}円</span>
        </div>
      </div>

      <div className="bg-[#363331] text-white p-3 rounded-t-lg">
        <h2 className="text-base sm:text-lg font-semibold">設備・備品</h2>
      </div>
      <div className="bg-white p-4 rounded-b-lg mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[
            { label: 'チェックイン', content: '15:00' },
            { label: 'チェックアウト', content: '11:00' },
            { label: '駐車場', content: '無料駐車場有り' },
          ].map((item) => (
            <div key={item.label} className="bg-[#E6E6E6] rounded-lg p-2">
              <span className="font-semibold text-[#363331]">
                {item.label}
              </span>
              <p className="text-[#363331]">{item.content}</p>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {amenities.map((item) => (
            <div key={item.label} className="bg-[#E6E6E6] rounded-lg p-3">
              <span className="font-semibold text-[#363331] block mb-2">
                {item.label}
              </span>
              <div className="flex flex-wrap gap-2">
                {item.content.split('、').map((content, index) => (
                  <span
                    key={index}
                    className="bg-white text-[#363331] px-2 py-1 rounded-full text-sm"
                  >
                    {content}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* エラーメッセージを表示 */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="text-center">
        <button
          className="bg-[#00A2EF] text-white py-2 sm:py-3 px-4 sm:px-6 rounded-full text-base sm:text-lg font-semibold hover:bg-blue-600 transition duration-300"
          onClick={handlePersonalInfoClickInternal}
        >
          個人情報入力 ＞
        </button>
      </div>
    </div>
  );
};

export default ReservationConfirmation;
