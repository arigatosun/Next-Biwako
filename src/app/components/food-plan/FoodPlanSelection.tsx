// ./src/app/components/food-plan/FoodPlanSelection.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import CounterButton from './CounterButton';
import FoodPlanCard from './FoodPlanCard';
import { FoodPlan } from '@/types/food-plan';

interface FoodPlanSelectionProps {
    onPlanSelection: (plans: { [key: string]: number }, totalPrice: number) => void;
    foodPlans: FoodPlan[];
    initialTotalGuests: number;
}

export default function FoodPlanSelection({ onPlanSelection, foodPlans, initialTotalGuests }: FoodPlanSelectionProps) {
    const [hasMeal, setHasMeal] = useState(false);
    const [mealGuestCount, setMealGuestCount] = useState(0);
    const [selectedCounts, setSelectedCounts] = useState<{ [key: string]: number }>({});
    const [menuSelections, setMenuSelections] = useState<{ [planId: string]: { [category: string]: { [item: string]: number } } }>({});

    const toggleHasMeal = () => {
        setHasMeal(!hasMeal);
        if (!hasMeal) {
            setMealGuestCount(initialTotalGuests);
        } else {
            setMealGuestCount(0);
            setSelectedCounts({});
        }
    };

    const handleMealGuestCountChange = (change: number) => {
        const newCount = Math.max(0, Math.min(mealGuestCount + change, initialTotalGuests));
        setMealGuestCount(newCount);
        setSelectedCounts({});
    };

    const handleMenuSelection = (planId: string, category: string, item: string, count: number) => {
        setMenuSelections(prev => ({
            ...prev,
            [planId]: {
                ...prev[planId],
                [category]: {
                    ...prev[planId]?.[category],
                    [item]: count
                }
            }
        }));
    };

    const handleCountChange = (id: string, change: number) => {
        setSelectedCounts(prev => {
            const newCount = Math.max(0, (prev[id] || 0) + change);
            const newCounts = { ...prev, [id]: newCount };
            
            const totalSelected = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
            if (totalSelected > mealGuestCount) {
                newCounts[id] = Math.max(0, newCount - (totalSelected - mealGuestCount));
            }
            
            return newCounts;
        });
    };

    const remainingNoMealGuests = initialTotalGuests - Object.values(selectedCounts).reduce((sum, count) => sum + count, 0);

    const totalPrice = useMemo(() => {
        return Object.entries(selectedCounts).reduce((sum, [id, count]) => {
            const plan = foodPlans.find(p => p.id === id);
            return sum + (plan ? plan.price * count : 0);
        }, 0);
    }, [selectedCounts, foodPlans]);

    useEffect(() => {
        onPlanSelection(selectedCounts, totalPrice);
    }, [selectedCounts, totalPrice, onPlanSelection]);

    return (
        <div className="text-[#363331]">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
                <span className="sm:hidden">食事プラン選択</span>
                <span className="hidden sm:inline">食事プランをご選択ください</span>
            </h2>
            <div className="mb-6 sm:mb-8 p-4 bg-gray-100 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">食事の有無</span>
                    <button
                        onClick={toggleHasMeal}
                        className={`px-4 py-2 rounded-full ${
                            hasMeal ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
                        }`}
                    >
                        {hasMeal ? '食事あり' : '食事なし'}
                    </button>
                </div>
                {hasMeal && (
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">食事が必要な人数</span>
                        <CounterButton
                            count={mealGuestCount}
                            onCountChange={handleMealGuestCountChange}
                            max={initialTotalGuests}
                        />
                    </div>
                )}
                {!hasMeal && (
                    <p className="text-center text-lg font-semibold">全員食事なし（{initialTotalGuests}名）</p>
                )}
            </div>

            {hasMeal && mealGuestCount > 0 && (
                <>
                    <p className="text-sm sm:text-base text-center mb-4">
                        食事プランを選択してください（残り：{remainingNoMealGuests}名）
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {foodPlans.filter(plan => plan.id !== 'no-meal').map((plan) => (
                            <FoodPlanCard
                                key={plan.id}
                                plan={plan}
                                count={selectedCounts[plan.id] || 0}
                                onCountChange={(change) => handleCountChange(plan.id, change)}
                                menuSelections={menuSelections[plan.id]}
                                onMenuSelection={(category, item, count) => handleMenuSelection(plan.id, category, item, count)}
                                totalPrice={totalPrice}
                                totalGuests={mealGuestCount}
                            />
                        ))}
                    </div>
                </>
            )}

            <div className="text-right mt-6 sm:mt-8">
                <span className="text-base sm:text-lg font-semibold mr-2">合計</span>
                <span className="bg-gray-100 px-3 py-2 rounded-lg inline-block text-base sm:text-lg">
                    {totalPrice.toLocaleString()}円
                </span>
            </div>
            
            {remainingNoMealGuests > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                    ※ 食事なしの人数: {remainingNoMealGuests}名
                </p>
            )}
        </div>
    );
}
