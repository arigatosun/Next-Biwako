// src/app/reservation-form/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import PlanAndEstimateInfo from '@/app/components/reservation-form/PlanAndEstimateInfo';
import PaymentAndPolicy from '@/app/components/reservation-form/PaymentAndPolicy';
import PersonalInfoForm, { PersonalInfoFormData } from '@/app/components/reservation-form/PersonalInfoForm';
import { useReservation } from '@/app/contexts/ReservationContext';
import { FoodPlan } from '@/app/types/food-plan';
import { format } from 'date-fns';

const foodPlans: FoodPlan[] = [
  { id: 'no-meal', name: '食事なし', price: 0 },
  { id: 'plan-a', name: 'plan.A 贅沢素材のディナーセット', price: 6500 },
  { id: 'plan-b', name: 'plan.B お肉づくし！豪華BBQセット', price: 6500 },
  { id: 'plan-c', name: '大満足！よくばりお子さまセット', price: 3000 },
];

const ReservationFormPage: React.FC = () => {
  const router = useRouter();
  const { state, dispatch } = useReservation();
  const [currentStep, setCurrentStep] = useState(4);  // 個人情報入力ステップに設定
  const [totalAmount, setTotalAmount] = useState(state.totalPrice);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoFormData | null>(state.personalInfo);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setTotalAmount(state.totalPrice);

      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } catch (err) {
      console.error('Error initializing reservation form:', err);
      setError('予約フォームの初期化中にエラーが発生しました。');
    }
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
        // 現在のページなので何もしない
        break;
      case 5:
        // 予約完了ページへの遷移は、フォーム送信後に行うべきです
        router.push('/reservation-complete');
        break;
      default:
        break;
    }
  };

  const handleCouponApplied = (discount: number) => {
    const newTotalAmount = Math.max(totalAmount - discount, 0);
    setTotalAmount(newTotalAmount);
    dispatch({ type: 'SET_TOTAL_PRICE', payload: newTotalAmount });
    dispatch({ type: 'SET_DISCOUNT_AMOUNT', payload: discount });
  };

  const handlePersonalInfoChange = (data: PersonalInfoFormData) => {
    setPersonalInfo(data);
    dispatch({ type: 'SET_PERSONAL_INFO', payload: data });
  };

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">エラー:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="flex-grow overflow-y-auto">
          <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-8 max-w-6xl">
            <ReservationProcess currentStep={currentStep} onStepClick={handleStepClick} />
            <div className="bg-white rounded-2xl shadow-md p-4 sm:p-8 mt-6 sm:mt-8">
              <PlanAndEstimateInfo />
              <PersonalInfoForm onDataChange={handlePersonalInfoChange} isMobile={isMobile} initialData={personalInfo} />
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
};

export default ReservationFormPage;