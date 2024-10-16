'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import PlanAndEstimateInfo from '@/app/components/reservation-form/PlanAndEstimateInfo';
import PaymentAndPolicy from '@/app/components/reservation-form/PaymentAndPolicy';
import PersonalInfoForm, { PersonalInfoFormData } from '@/app/components/reservation-form/PersonalInfoForm';
import { useReservation } from '@/app/contexts/ReservationContext';
import { FoodPlan } from '@/app/types/food-plan';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setTotalAmount(state.totalPrice);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.totalPrice]);

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
      name: "【一棟貸切！】贅沢遊びつくしヴィラプラン",
      date: state.selectedDate || new Date(),
      numberOfUnits: state.units,
      nights: state.nights,
    };
  
    const estimateInfo = {
      roomRates: Array(state.nights).fill(null).map((_, index) => ({
        date: new Date((state.selectedDate?.getTime() || Date.now()) + index * 24 * 60 * 60 * 1000),
        price: state.selectedPrice / state.nights, // 1泊あたりの料金を計算
      })),
      mealPlans: Object.entries(state.selectedFoodPlans).map(([planId, planInfo]) => {
        const plan = foodPlans.find(p => p.id === planId);
        return {
          name: plan ? plan.name : 'Unknown Plan',
          count: planInfo.count,
          price: plan ? plan.price : 0,
          menuSelections: planInfo.menuSelections,
        };
      }),
      guestCounts: state.guestCounts[0], // 最初の要素を使用
    };
  
    return { planInfo, estimateInfo };
  };

  const { planInfo, estimateInfo } = generateReservationInfo();

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="flex-grow overflow-y-auto">
          <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-8 max-w-6xl">
            <ReservationProcess currentStep={currentStep} onStepClick={handleStepClick} />
            <div className="bg-white rounded-2xl shadow-md p-4 sm:p-8 mt-6 sm:mt-8">
              <PlanAndEstimateInfo planInfo={planInfo} estimateInfo={estimateInfo} isMobile={isMobile} />
              <PersonalInfoForm onDataChange={handlePersonalInfoChange} isMobile={isMobile} />
              <PaymentAndPolicy
                totalAmount={totalAmount}
                onCouponApplied={handleCouponApplied}
                personalInfo={personalInfo}
                isMobile={isMobile}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}