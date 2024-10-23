// src/app/components/food-plan/FoodPlanSelection.tsx

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FoodPlan } from '@/app/types/food-plan';
import FoodPlanCard from './FoodPlanCard';
import { useReservation } from '@/app/contexts/ReservationContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  FoodPlanInfo, 
  DatePlans, 
  UnitPlans, 
  SelectedFoodPlanByUnit, 
  SelectedFoodPlanByDate, 
} from '@/app/types/ReservationTypes';

interface DayTabProps {
  date: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const DayTab: React.FC<DayTabProps> = ({ date, index, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-t-lg transition-colors duration-200 ${
        isActive
          ? 'bg-white text-[#00A2EF] border-t-2 border-l border-r border-[#00A2EF]'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span className="hidden sm:inline">{index + 1}日目</span>
      <span className="sm:hidden">{index + 1}日</span>
      <span> ({format(new Date(date), "M/d", { locale: ja })})</span>
    </button>
  );
};

interface FoodPlanSelectionProps {
  foodPlans: FoodPlan[];
  initialTotalGuests: number;
  checkInDate: string;
  nights: number;
  dates: string[];
  units: number;
}

export default function FoodPlanSelection({
  foodPlans,
  initialTotalGuests,
  checkInDate,
  nights,
  dates,
  units
}: FoodPlanSelectionProps) {
  const router = useRouter();
  const { state, dispatch } = useReservation();
  const [activeUnit, setActiveUnit] = useState(0);
  const [activeDate, setActiveDate] = useState<string>(dates[0]);
  const [selectedPlansByUnit, setSelectedPlansByUnit] = useState<SelectedFoodPlanByUnit>({});
  const [hasMeal, setHasMeal] = useState<Record<number, 'yes' | 'no'>>({});
  const [mealGuestCount, setMealGuestCount] = useState<Record<number, number>>({});
  const [menuSelections, setMenuSelections] = useState<{
    [unitIndex: number]: {
      [date: string]: {
        [planId: string]: {
          [category: string]: { [item: string]: number };
        };
      };
    };
  }>({});
  const [error, setError] = useState<string | null>(null);

  // 初期化
  useEffect(() => {
    const initialHasMeal: Record<number, 'yes' | 'no'> = {};
    const initialMealGuestCount: Record<number, number> = {};
    
    for (let i = 0; i < units; i++) {
      initialHasMeal[i] = 'no';
      initialMealGuestCount[i] = Math.floor(initialTotalGuests / units);
    }
    
    setHasMeal(initialHasMeal);
    setMealGuestCount(initialMealGuestCount);
  }, [units, initialTotalGuests]);

  // 選択された食事プランの合計金額を計算
  const calculateTotalPrice = useCallback((): number => {
    return Object.values(state.selectedFoodPlansByUnit).reduce((totalSum: number, unitPlans: UnitPlans) => {
      return totalSum + Object.values(unitPlans).reduce((unitSum: number, datePlans: DatePlans) => {
        return unitSum + Object.values(datePlans).reduce((dateSum: number, plan: FoodPlanInfo) => {
          return dateSum + plan.price;
        }, 0);
      }, 0);
    }, 0);
  }, [state.selectedFoodPlansByUnit]);

  // 日付ごとの小計を計算
  const calculateSubtotalForDate = useCallback((unitIndex: number, date: string): number => {
    const plans = state.selectedFoodPlansByUnit[unitIndex.toString()]?.[date] || {};
    return Object.values(plans).reduce((sum: number, planInfo: FoodPlanInfo) => sum + planInfo.price, 0);
  }, [state.selectedFoodPlansByUnit]);

  // 食事オプションの変更を処理
  const handleMealOptionChange = useCallback((unitIndex: number, value: 'yes' | 'no') => {
    setHasMeal(prev => ({ ...prev, [unitIndex]: value }));
    if (value === 'no') {
      setMealGuestCount(prev => ({ ...prev, [unitIndex]: 0 }));
      setSelectedPlansByUnit(prev => {
        const { [unitIndex.toString()]: _, ...newPlans } = prev;
        dispatch({ type: 'SET_FOOD_PLANS_BY_UNIT', payload: newPlans });
        return newPlans;
      });
      setMenuSelections(prev => {
        const { [unitIndex]: _, ...newSelections } = prev;
        return newSelections;
      });
    } else {
      setMealGuestCount(prev => ({
        ...prev,
        [unitIndex]: Math.floor(initialTotalGuests / units)
      }));
    }
  }, [initialTotalGuests, units, dispatch]);
  

  // 食事人数の変更を処理
  const handleMealGuestCountChange = useCallback((unitIndex: number, change: number) => {
    setMealGuestCount(prev => {
      const currentCount = prev[unitIndex] || 0;
      const maxGuests = Math.floor(initialTotalGuests / units);
      const newCount = Math.max(0, Math.min(currentCount + change, maxGuests));
      
      if (newCount < currentCount) {
        // 人数が減少した場合、その棟の選択をクリア
        setSelectedPlansByUnit(prevPlans => {
          const newPlans = { ...prevPlans };
          if (newPlans[unitIndex.toString()]) {
            delete newPlans[unitIndex.toString()];
          }
          dispatch({ type: 'SET_FOOD_PLANS_BY_UNIT', payload: newPlans });
          return newPlans;
        });
        setMenuSelections(prev => {
          const newSelections = { ...prev };
          if (newSelections[unitIndex]) {
            delete newSelections[unitIndex];
          }
          return newSelections;
        });
      }
      
      return { ...prev, [unitIndex]: newCount };
    });
  }, [initialTotalGuests, units, dispatch]);

  // プランの選択数変更を処理
  const handleCountChange = useCallback((
    unitIndex: number,
    date: string,
    planId: string,
    change: number
  ) => {
    console.log(`Changing count for plan ${planId} by ${change} on ${date}, unit ${unitIndex}`);
    setSelectedPlansByUnit(prev => {
      const newPlans = { ...prev };

      // 初期化
      if (!newPlans[unitIndex.toString()]) {
        newPlans[unitIndex.toString()] = {};
      }
      if (!newPlans[unitIndex.toString()][date]) {
        newPlans[unitIndex.toString()][date] = {};
      }

      const plan = foodPlans.find(p => p.id === planId);
      if (!plan) return prev;

      const currentCount = newPlans[unitIndex.toString()][date][planId]?.count || 0;

      let newCount = currentCount + change;

      // バリデーション: 0以下にならない、最大人数を超えない
      if (newCount < 0) {
        newCount = 0;
      }

      // 現在の総選択数を計算
      const totalSelected = Object.values(newPlans[unitIndex.toString()][date]).reduce(
        (sum, planInfo: FoodPlanInfo) => sum + planInfo.count,
        0
      );

      // 残りの選択可能人数を計算
      const remaining = mealGuestCount[unitIndex] - (totalSelected - currentCount);

      if (newCount > remaining) {
        newCount = remaining;
      }

      if (newCount === 0) {
        delete newPlans[unitIndex.toString()][date][planId];
      } else {
        newPlans[unitIndex.toString()][date][planId] = {
          count: newCount,
          price: plan.price * newCount,
          menuSelections: menuSelections[unitIndex]?.[date]?.[planId] || {}
        };
      }

      dispatch({ type: 'SET_FOOD_PLANS_BY_UNIT', payload: newPlans });

      return newPlans;
    });
  }, [foodPlans, mealGuestCount, menuSelections, dispatch]);

  // メニュー選択を処理
  const handleMenuSelection = useCallback((
    unitIndex: number,
    date: string,
    planId: string,
    category: string,
    item: string,
    count: number
  ) => {
    setMenuSelections(prev => {
      const newSelections = { ...prev };
      if (!newSelections[unitIndex]) {
        newSelections[unitIndex] = {};
      }
      if (!newSelections[unitIndex][date]) {
        newSelections[unitIndex][date] = {};
      }
      if (!newSelections[unitIndex][date][planId]) {
        newSelections[unitIndex][date][planId] = {};
      }
      if (!newSelections[unitIndex][date][planId][category]) {
        newSelections[unitIndex][date][planId][category] = {};
      }

      if (count === 0) {
        delete newSelections[unitIndex][date][planId][category][item];
        if (Object.keys(newSelections[unitIndex][date][planId][category]).length === 0) {
          delete newSelections[unitIndex][date][planId][category];
        }
      } else {
        newSelections[unitIndex][date][planId][category][item] = count;
      }

      // Update selectedPlansByUnit with new menuSelections
      setSelectedPlansByUnit(prev => {
        const newPlans = { ...prev };
        if (!newPlans[unitIndex.toString()]) {
          newPlans[unitIndex.toString()] = {};
        }
        if (!newPlans[unitIndex.toString()][date]) {
          newPlans[unitIndex.toString()][date] = {};
        }
        if (!newPlans[unitIndex.toString()][date][planId]) {
          newPlans[unitIndex.toString()][date][planId] = { count: 0, price: 0 };
        }
        newPlans[unitIndex.toString()][date][planId].menuSelections = newSelections[unitIndex]?.[date]?.[planId];
        dispatch({ type: 'SET_FOOD_PLANS_BY_UNIT', payload: newPlans });
        return newPlans;
      });

      return newSelections;
    });
  }, [dispatch]);

  // Context更新 (不要になったため削除)
  /*
  useEffect(() => {
    const combinedPlans: SelectedFoodPlanByDate = {};

    Object.entries(selectedPlansByUnit).forEach(([unitIndex, unitPlans]: [string, UnitPlans]) => {
      Object.entries(unitPlans).forEach(([date, datePlans]: [string, DatePlans]) => {
        if (!combinedPlans[date]) {
          combinedPlans[date] = {};
        }
        Object.entries(datePlans).forEach(([planId, planInfo]: [string, FoodPlanInfo]) => {
          if (!combinedPlans[date][planId]) {
            combinedPlans[date][planId] = {
              count: 0,
              price: 0,
              menuSelections: menuSelections[Number(unitIndex)]?.[date]?.[planId]
            };
          }
          if (combinedPlans[date][planId]) {
            combinedPlans[date][planId].count += planInfo.count;
            combinedPlans[date][planId].price += planInfo.price;
          }
        });
      });
    });

    dispatch({ type: 'SET_FOOD_PLANS_BY_DATE', payload: combinedPlans });
  }, [selectedPlansByUnit, menuSelections, dispatch]);
  */

  const renderUnitTabs = () => (
    <div className="flex space-x-2 mb-4 overflow-x-auto">
      {Array.from({ length: units }, (_, i) => (
        <button
          key={i}
          onClick={() => setActiveUnit(i)}
          className={`px-4 py-2 rounded-t-lg whitespace-nowrap ${
            activeUnit === i
              ? 'bg-[#00A2EF] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i + 1}棟目
        </button>
      ))}
    </div>
  );

  const renderFoodPlanSection = (unitIndex: number) => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-bold mb-4">{unitIndex + 1}棟目の食事プラン</h3>
      
      <div className="flex justify-center space-x-4 mb-6">
        {['yes', 'no'].map((option) => (
          <button
            key={option}
            onClick={() => handleMealOptionChange(unitIndex, option as 'yes' | 'no')}
            className={`px-6 py-3 rounded-full text-lg font-semibold transition-colors duration-200 ${
              hasMeal[unitIndex] === option
                ? 'bg-[#00A2EF] text-white'
                : 'bg-white text-[#00A2EF] border-2 border-[#00A2EF]'
            }`}
          >
            食事{option === 'yes' ? 'あり' : 'なし'}
          </button>
        ))}
      </div>

      {hasMeal[unitIndex] === 'yes' && (
        <>
          <div className="mt-6">
            <p className="text-lg font-semibold mb-3 text-center">
              食事が必要な人数: {mealGuestCount[unitIndex]}名
            </p>
            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={() => handleMealGuestCountChange(unitIndex, -1)}
                className="w-8 h-8 rounded-full bg-[#00A2EF] text-white flex items-center justify-center text-xl font-bold"
              >
                -
              </button>
              <span className="text-2xl font-bold">{mealGuestCount[unitIndex]}</span>
              <button
                onClick={() => handleMealGuestCountChange(unitIndex, 1)}
                className="w-8 h-8 rounded-full bg-[#00A2EF] text-white flex items-center justify-center text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex overflow-x-auto border-b border-gray-200">
              {dates.map((date, index) => (
                <DayTab
                  key={date}
                  date={date}
                  index={index}
                  isActive={activeDate === date}
                  onClick={() => setActiveDate(date)}
                />
              ))}
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {foodPlans.filter(plan => plan.id !== 'no-meal').map((plan) => {
                  const currentCount = state.selectedFoodPlansByUnit[unitIndex.toString()]?.[activeDate]?.[plan.id]?.count || 0;
                  const totalSelected = Object.values(state.selectedFoodPlansByUnit[unitIndex.toString()]?.[activeDate] || {})
                    .reduce((sum, planInfo: FoodPlanInfo) => sum + planInfo.count, 0);
                  const remaining = mealGuestCount[unitIndex] - (totalSelected - currentCount);

                  return (
                    <FoodPlanCard
                      key={`${activeDate}-${plan.id}`}
                      plan={plan}
                      count={currentCount}
                      onCountChange={(change) => handleCountChange(unitIndex, activeDate, plan.id, change)}
                      menuSelections={state.selectedFoodPlansByUnit[unitIndex.toString()]?.[activeDate]?.[plan.id]?.menuSelections}
                      onMenuSelection={(category, item, count) =>
                        handleMenuSelection(unitIndex, activeDate, plan.id, category, item, count)
                      }
                      totalPrice={state.selectedFoodPlansByUnit[unitIndex.toString()]?.[activeDate]?.[plan.id]?.price || 0}
                      totalGuests={mealGuestCount[unitIndex]}
                      max={remaining}
                    />
                  );
                })}
              </div>

              <div className="mt-6 text-right">
                <span className="font-semibold">小計: </span>
                <span className="text-lg font-bold text-[#00A2EF]">
                  {calculateSubtotalForDate(unitIndex, activeDate).toLocaleString()}円
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderSummary = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <h3 className="text-xl font-bold mb-6">食事プラン選択サマリー</h3>
      
      {Array.from({ length: units }, (_, unitIndex) => (
        <div key={unitIndex} className="mb-8 last:mb-0">
          <h4 className="text-lg font-semibold mb-4">{unitIndex + 1}棟目</h4>
          
          {hasMeal[unitIndex] === 'no' ? (
            <p className="text-gray-600">食事なし</p>
          ) : (
            <div>
              {dates.map((date) => {
                const plansForDate = state.selectedFoodPlansByUnit[unitIndex.toString()]?.[date] || {};
                const hasPlans = Object.keys(plansForDate).length > 0;

                return (
                  <div key={date} className="mb-4 last:mb-0">
                    <p className="font-medium">
                      {format(new Date(date), "yyyy年MM月dd日（E）", { locale: ja })}:
                    </p>
                    
                    {hasPlans ? (
                      <div className="ml-4">
                        {Object.entries(plansForDate).map(([planId, planInfo]: [string, FoodPlanInfo]) => {
                          const plan = foodPlans.find(p => p.id === planId);
                          if (!plan) return null;

                          return (
                            <div key={planId} className="mb-2 last:mb-0">
                              <p>{plan.name}: {planInfo.count}名</p>
                              {planInfo.menuSelections && (
                                <div className="ml-4 text-sm">
                                  {Object.entries(planInfo.menuSelections).map(
                                    ([category, items]) => (
                                      <div key={category}>
                                        <p className="font-medium">{category}:</p>
                                        <ul className="list-disc list-inside ml-2">
                                          {Object.entries(items).map(([item, count]) => (
                                            <li key={item}>{item} × {count}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="ml-4 text-gray-600">選択されていません</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold">合計金額</span>
          <span className="text-2xl font-bold text-[#00A2EF]">
            {calculateTotalPrice().toLocaleString()}円
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="text-[#363331]">
      {renderUnitTabs()}
      {renderFoodPlanSection(activeUnit)}
      {renderSummary()}
    </div>
  );
}
