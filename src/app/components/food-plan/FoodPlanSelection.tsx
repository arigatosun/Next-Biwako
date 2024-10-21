// src/app/components/food-plan/FoodPlanSelection.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FoodPlan } from '@/app/types/food-plan';
import FoodPlanCard from './FoodPlanCard';
import { useReservation, SelectedFoodPlanByDate } from '@/app/contexts/ReservationContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

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
}

export default function FoodPlanSelection({
  foodPlans,
  initialTotalGuests,
  checkInDate,
  nights,
  dates
}: FoodPlanSelectionProps) {
  const router = useRouter();
  const { state, dispatch } = useReservation();
  const [selectedPlans, setSelectedPlans] = useState<SelectedFoodPlanByDate>({});
  const [menuSelections, setMenuSelections] = useState<{ [date: string]: { [planId: string]: { [category: string]: { [item: string]: number } } } }>({});
  const [hasMeal, setHasMeal] = useState<'yes' | 'no'>('no');
  const [mealGuestCount, setMealGuestCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string>(dates[0]);

  useEffect(() => {
    const totalMealPrice = calculateTotalPrice();

    const formattedPlans: { [planId: string]: { count: number; menuSelections?: any } } = {};
    Object.entries(selectedPlans).forEach(([date, datePlans]) => {
      Object.entries(datePlans).forEach(([planId, planInfo]) => {
        if (!formattedPlans[planId]) {
          formattedPlans[planId] = { count: 0, menuSelections: {} };
        }
        formattedPlans[planId].count += planInfo.count;
      });
    });

    dispatch({ type: 'SET_FOOD_PLANS', payload: formattedPlans });
    dispatch({ type: 'SET_FOOD_PLANS_BY_DATE', payload: selectedPlans });
    dispatch({ type: 'SET_MENU_SELECTIONS_BY_DATE', payload: menuSelections });

    const accommodationPrice = state.totalPrice - state.totalMealPrice;
    const totalPrice = accommodationPrice + totalMealPrice;
    dispatch({ type: 'SET_TOTAL_PRICE', payload: totalPrice });
  }, [selectedPlans, menuSelections, dispatch]);

  const handleDateChange = (date: string) => {
    setActiveDate(date);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MM月dd日（E）", { locale: ja });
  };

  const handleMealOptionChange = (value: 'yes' | 'no') => {
    setHasMeal(value);
    if (value === 'no') {
      setMealGuestCount(0);
      setSelectedPlans({});
      setMenuSelections({});
    } else {
      setMealGuestCount(initialTotalGuests);
    }
  };

  const handleMealGuestCountChange = (change: number) => {
    setMealGuestCount(prev => {
      const newCount = Math.max(0, Math.min(prev + change, initialTotalGuests));
      if (newCount < prev) {
        setSelectedPlans({});
        setMenuSelections({});
      }
      return newCount;
    });
  };

  const handleCountChange = useCallback((date: string, planId: string, change: number) => {
    console.log(`Changing count for plan ${planId} by ${change} on ${date}`);
    setSelectedPlans(prev => {
      const newPlans = { ...prev };
      
      if (!newPlans[date]) {
        newPlans[date] = {};
      } else {
        newPlans[date] = { ...newPlans[date] };
      }
      
      if (!newPlans[date][planId]) {
        newPlans[date][planId] = { count: 0, price: 0 };
      } else {
        newPlans[date][planId] = { ...newPlans[date][planId] };
      }
      
      const currentCount = newPlans[date][planId].count;
      const newCount = Math.max(0, currentCount + change);
      
      const plan = foodPlans.find(p => p.id === planId);
      const price = plan ? plan.price : 0;
      
      if (newCount === 0) {
        delete newPlans[date][planId];
      } else {
        newPlans[date][planId] = {
          ...newPlans[date][planId],
          count: newCount,
          price: price * newCount,
        };
      }

      const totalSelected = Object.values(newPlans[date]).reduce((sum, planInfo) => sum + planInfo.count, 0);
      console.log(`Total selected for ${date}: ${totalSelected}`);
      if (totalSelected > mealGuestCount) {
        newPlans[date][planId].count = Math.max(0, newCount - (totalSelected - mealGuestCount));
        newPlans[date][planId].price = price * newPlans[date][planId].count;
      }
      console.log('Updated selectedPlans:', newPlans);
      return newPlans;
    });
  }, [mealGuestCount, foodPlans]);

  const handleMenuSelection = (date: string, planId: string, category: string, item: string, count: number) => {
    setMenuSelections(prev => {
      const newSelections = { ...prev };

      if (!newSelections[date]) {
        newSelections[date] = {};
      } else {
        newSelections[date] = { ...newSelections[date] };
      }

      if (!newSelections[date][planId]) {
        newSelections[date][planId] = {};
      } else {
        newSelections[date][planId] = { ...newSelections[date][planId] };
      }

      if (!newSelections[date][planId][category]) {
        newSelections[date][planId][category] = {};
      } else {
        newSelections[date][planId][category] = { ...newSelections[date][planId][category] };
      }

      if (count === 0) {
        delete newSelections[date][planId][category][item];
        if (Object.keys(newSelections[date][planId][category]).length === 0) {
          delete newSelections[date][planId][category];
        }
      } else {
        newSelections[date][planId][category][item] = count;
      }

      return newSelections;
    });
  };

  const calculateTotalPrice = () => {
    return Object.entries(selectedPlans).reduce((sum, [date, plans]) => {
      return sum + Object.values(plans).reduce((dateSum, planInfo) => {
        return dateSum + planInfo.price;
      }, 0);
    }, 0);
  };
  
  const calculateSubtotalForDate = (date: string) => {
    const plans = selectedPlans[date] || {};
    return Object.values(plans).reduce((sum, planInfo) => sum + planInfo.price, 0);
  };

  const remainingNoMealGuests = mealGuestCount - Object.values(selectedPlans[activeDate] || {}).reduce((sum, planInfo) => sum + planInfo.count, 0);

  return (
    <div className="text-[#363331]">
      <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
        <div className="flex justify-center space-x-4 mb-6">
          {['yes', 'no'].map((option) => (
            <button
              key={option}
              onClick={() => handleMealOptionChange(option as 'yes' | 'no')}
              className={`px-6 py-3 rounded-full text-lg font-semibold transition-colors duration-200 ${
                hasMeal === option
                  ? 'bg-[#00A2EF] text-white'
                  : 'bg-white text-[#00A2EF] border-2 border-[#00A2EF]'
              }`}
            >
              食事{option === 'yes' ? 'あり' : 'なし'}
            </button>
          ))}
        </div>

        {hasMeal === 'yes' && (
          <>
            <div className="mt-6">
              <p className="text-lg font-semibold mb-3 text-center">食事が必要な人数: {mealGuestCount}名</p>
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={() => handleMealGuestCountChange(-1)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#00A2EF] text-white flex items-center justify-center text-xl sm:text-2xl font-bold"
>
                  -
                </button>
                <span className="text-2xl font-bold">{mealGuestCount}</span>
                <button
                  onClick={() => handleMealGuestCountChange(1)}
                  className="w-10 h-10 rounded-full bg-[#00A2EF] text-white flex items-center justify-center text-2xl font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-100 rounded-lg">
              <h2 className="text-xl font-bold mb-2 text-center">食事プランをご選択ください</h2>
              <p className="text-center mb-2">1名様ずつお好きなプランをご注文いただけます。</p>
              <p className="text-center">
                例）{mealGuestCount}名様でご利用の場合、plan.Aを2名・plan.Bを1名にし、残りを食事なしにすることも可能です。
              </p>
            </div>
          </>
        )}
      </div>

      {hasMeal === 'yes' && mealGuestCount > 0 && (
        <>
         <div className="mt-8 bg-white rounded-lg shadow-md">
  <div className="flex overflow-x-auto border-b border-gray-200">
    {dates.map((date, index) => (
      <DayTab
        key={date}
        date={date}
        index={index}
        isActive={activeDate === date}
        onClick={() => handleDateChange(date)}
      />
    ))}
  </div>
            <div className="p-6">
  <h3 className="text-lg font-semibold mb-4">
    {format(new Date(activeDate), "yyyy年MM月dd日（E）", { locale: ja })}の食事プラン
  </h3>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {foodPlans.filter(plan => plan.id !== 'no-meal').map((plan) => {
      const currentCount = selectedPlans[activeDate]?.[plan.id]?.count || 0;
      const totalSelected = Object.values(selectedPlans[activeDate] || {}).reduce((sum, planInfo) => sum + planInfo.count, 0);
      const remaining = mealGuestCount - (totalSelected - currentCount);

      return (
        <FoodPlanCard
          key={`${activeDate}-${plan.id}`}
          plan={plan}
          count={selectedPlans[activeDate]?.[plan.id]?.count || 0}
          onCountChange={(change) => handleCountChange(activeDate, plan.id, change)}
          menuSelections={menuSelections[activeDate]?.[plan.id]}
          onMenuSelection={(category, item, count) => handleMenuSelection(activeDate, plan.id, category, item, count)}
          totalPrice={selectedPlans[activeDate]?.[plan.id]?.price || 0}
          totalGuests={mealGuestCount}
          max={remaining}
        />
      );
    })}
  </div>
              <div className="mt-6 text-right">
                <span className="font-semibold">小計: </span>
                <span className="text-lg font-bold text-[#00A2EF]">
                  {calculateSubtotalForDate(activeDate).toLocaleString()}円
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <span className="text-xl font-semibold text-[#363331] mb-2 sm:mb-0">食事プラン合計金額</span>
              <span className="text-2xl font-bold text-[#00A2EF]">
                {calculateTotalPrice().toLocaleString()}円
              </span>
            </div>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}
        </>
      )}

      <FoodPlanSummary
        selectedPlans={selectedPlans}
        foodPlans={foodPlans}
        dates={dates}
      />
    </div>
  );
}

interface FoodPlanSummaryProps {
  selectedPlans: SelectedFoodPlanByDate;
  foodPlans: FoodPlan[];
  dates: string[];
}

const FoodPlanSummary: React.FC<FoodPlanSummaryProps> = ({ selectedPlans, foodPlans, dates }) => {
  const { state } = useReservation();
  const { menuSelectionsByDate } = state;

  return (
    <div className="mt-8 bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">食事プランの詳細</h3>
      {dates.map((date, index) => {
        const planForDate = selectedPlans[date] || {};
        const menuForDate = menuSelectionsByDate[date] || {};

        return (
          <div key={date} className="mb-6 last:mb-0">
            <p className="font-medium text-lg mb-2">{index + 1}日目 ({format(new Date(date), "yyyy年MM月dd日（E）", { locale: ja })}):</p>
            {Object.entries(planForDate).map(([planId, planInfo]) => {
              const plan = foodPlans.find(p => p.id === planId);
              const menuSelection = menuForDate[planId] || {};

              return plan && planInfo.count > 0 ? (
                <div key={planId} className="ml-4 mb-4 last:mb-0 bg-white p-3 rounded-lg shadow-sm">
                  <p className="font-semibold">{plan.name}: {planInfo.count}名</p>
                  {Object.keys(menuSelection).length > 0 && (
                    <div className="mt-2">
                      {Object.entries(menuSelection).map(([category, items]) => (
                        <div key={category} className="ml-4">
                          <p className="font-medium">{category}:</p>
                          <ul className="list-disc list-inside ml-4">
                            {Object.entries(items).map(([itemName, itemCount]) => (
                              <li key={itemName}>
                                {itemName} × {itemCount}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null;
            })}
            {Object.keys(planForDate).length === 0 && (
              <p className="ml-4 text-gray-500">選択されていません</p>
            )}
          </div>
        );
      })}
    </div>
  );
};
