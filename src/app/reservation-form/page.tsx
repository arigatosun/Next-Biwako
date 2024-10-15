// src/app/reservation-form/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import PlanAndEstimateInfo from '@/app/components/reservation-form/PlanAndEstimateInfo';
import PaymentAndPolicy from '@/app/components/reservation-form/PaymentAndPolicy';
import PersonalInfoForm, { PersonalInfoFormData } from '@/app/components/reservation-form/PersonalInfoForm';
import { useReservation } from '@/app/contexts/ReservationContext';
import { FoodPlan } from '@/types/food-plan';

const foodPlans: FoodPlan[] = [
  { id: 'no-meal', name: '食事なし', price: 0 },
  { id: 'plan-a', name: 'plan.A 贅沢素材のディナーセット', price: 6500 },
  { id: 'plan-b', name: 'plan.B お肉づくし！豪華BBQセット', price: 6500 },
  { id: 'plan-c', name: '大満足！よくばりお子さまセット', price: 3000 },
];

export default function ReservationFormPage() {
  const router = useRouter();
  const { state, dispatch } = useReservation();
  const [currentStep, setCurrentStep] = useState(5);
  const [totalAmount, setTotalAmount] = useState(state.totalPrice);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoFormData | null>(null);

  useEffect(() => {
    setTotalAmount(state.totalPrice);
  }, [state.totalPrice]);

  // clientSecret の取得コードを削除

  const handleStepClick = (step: number) => {
    switch (step) {
      case 1:
        router.push('/reservation');
        break;
      case 2:
        router.push('/guest-selection');
        break;
      case 3:
        router.push('/food-plan');
        break;
      case 4:
        // Handle reservation confirmation step if necessary
        break;
      case 5:
        // 予約完了ページへの遷移は、フォーム送信後に行うべきです
        break;
      default:
        break;
    }
  };

  const handleCouponApplied = (discount: number) => {
    const newTotalAmount = totalAmount - discount;
    setTotalAmount(newTotalAmount);
    dispatch({ type: 'SET_TOTAL_PRICE', payload: newTotalAmount });
  };

  const handlePersonalInfoChange = (data: PersonalInfoFormData) => {
    setPersonalInfo(data);
  };

  // 予約情報の生成
  const generateReservationInfo = () => {
    const planInfo = {
      name: "【一棟貸切！】贅沢遊びつくしヴィラプラン", // この情報はどこかから取得する必要があります
      date: state.selectedDate
        ? state.selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
        : '',
      numberOfUnits: state.units,
    };

    const estimateInfo = {
      units: state.guestCounts.map((count) => ({
        date: `${planInfo.date}〜`,
        plans: [
          { name: planInfo.name, type: '男性', count: count.male, amount: count.male * 68000 },
          { name: planInfo.name, type: '女性', count: count.female, amount: count.female * 68000 },
          { name: planInfo.name, type: '子供（ベッドあり）', count: count.childWithBed, amount: count.childWithBed * 68000 },
          { name: planInfo.name, type: '子供（ベッドなし）', count: count.childNoBed, amount: 0 },
        ].filter(plan => plan.count > 0),
      })),
      mealPlans: Object.entries(state.selectedFoodPlans).map(([planId, planInfo]) => {
        const plan = foodPlans.find(p => p.id === planId);
        return {
          name: plan ? plan.name : 'Unknown Plan',
          count: planInfo.count,
          amount: plan ? plan.price * planInfo.count : 0,
        };
      }),
      totalAmount: state.totalPrice,
    };

    return { planInfo, estimateInfo };
  };

  const { planInfo, estimateInfo } = generateReservationInfo();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <ReservationProcess currentStep={currentStep} onStepClick={handleStepClick} />
          <div className="bg-white rounded-2xl shadow-md p-8 mt-8">
            <PlanAndEstimateInfo planInfo={planInfo} estimateInfo={estimateInfo} />

            {/* PersonalInfoForm */}
            <PersonalInfoForm onDataChange={handlePersonalInfoChange} />

            {/* PaymentAndPolicy */}
            <PaymentAndPolicy
              totalAmount={totalAmount}
              onCouponApplied={handleCouponApplied}
              personalInfo={personalInfo}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
