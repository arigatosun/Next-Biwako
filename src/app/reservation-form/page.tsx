'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import PlanAndEstimateInfo from '../components/reservation-form/PlanAndEstimateInfo';
import PaymentAndPolicy from '../components/reservation-form/PaymentAndPolicy';
import PersonalInfoForm from '../components/reservation-form/PersonalInfoForm';
import { ChevronRight } from 'lucide-react';

const mockPlanInfo = {
  name: "【一棟貸切！】贅沢遊びつくしヴィラプラン",
  date: "2024年10月21日(月)",
  numberOfUnits: 2
};

const mockEstimateInfo = {
  units: [
    {
      date: "2024年10月21日(月)〜",
      plans: [
        { name: "【一棟貸切！】贅沢遊びつくしヴィラプラン", type: "男性", count: 3, amount: 68000 }
      ]
    },
    {
      date: "2024年10月21日(月)〜",
      plans: [
        { name: "【一棟貸切！】贅沢遊びつくしヴィラプラン", type: "女性", count: 3, amount: 68000 },
        { name: "【一棟貸切！】贅沢遊びつくしヴィラプラン", type: "小学生以下(添い寝)", count: 2, amount: 0 }
      ]
    }
  ],
  mealPlans: [
    { name: "Plan.A 贅沢素材のディナーセット", count: 2, amount: 13000 },
    { name: "Plan.B お肉づくし！豪華BBQセット", count: 3, amount: 19500 },
    { name: "大満足！よくばりお子さまセット", count: 2, amount: 6000 },
    { name: "食事なし", count: 1, amount: 0 }
  ],
  totalAmount: 174500
};

interface PersonalInfoFormData {
  // フォームデータの型定義
}

export default function ReservationFormPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(5);
  const [totalAmount, setTotalAmount] = useState(mockEstimateInfo.totalAmount);

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
        // Handle reservation confirmation step
        break;
      // Add other cases as needed
      default:
        // Optional: Handle invalid step
        break;
    }
  };

  const handlePersonalInfoSubmit = (data: PersonalInfoFormData) => {
    console.log('Personal info submitted:', data);
    // Handle form submission
  };

  const handleCouponApplied = (discount: number) => {
    setTotalAmount(prevTotal => prevTotal - discount);
  };

  const handleReservationConfirm = () => {
    // Handle reservation confirmation
    router.push('/reservation-complete');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <ReservationProcess 
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
          <div className="bg-white rounded-2xl shadow-md p-8 mt-8">
            <PlanAndEstimateInfo planInfo={mockPlanInfo} estimateInfo={mockEstimateInfo} />
            <PaymentAndPolicy 
              totalAmount={totalAmount} 
              onCouponApplied={handleCouponApplied} 
            />
            <PersonalInfoForm onSubmit={handlePersonalInfoSubmit} />
            <button
              onClick={handleReservationConfirm}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full flex items-center justify-center mx-auto mt-8 w-full sm:w-3/5 transition duration-300"
            >
              予約を確定する
              <ChevronRight className="ml-2" size={20} />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}