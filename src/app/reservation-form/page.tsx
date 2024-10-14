'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import PlanAndEstimateInfo from '../components/reservation-form/PlanAndEstimateInfo';
import PaymentAndPolicy from '../components/reservation-form/PaymentAndPolicy';
import PersonalInfoForm, { PersonalInfoFormData } from '../components/reservation-form/PersonalInfoForm';
import { ChevronRight } from 'lucide-react';
import { useReservation } from '@/app/contexts/ReservationContext';
import { FoodPlan } from '@/types/food-plan';

const foodPlans: FoodPlan[] = [
  { id: 'no-meal', name: '食事なし', price: 0 },
  { id: 'plan-a', name: 'plan.A 贅沢素材のディナーセット', price: 6500 },
  { id: 'plan-b', name: 'plan.B お肉づくし！豪華BBQセット', price: 6500 },
  { id: 'plan-c', name: '大満足！よくばりお子さまセット', price: 3000 },
];

const amenities = [
  { label: '設備', content: 'エアコン、コンセント、無料Wi-Fi、IHコンロ1口' },
  { label: '備品', content: 'BBQコンロ、冷蔵庫（冷凍庫有り）、電気ケトル、電子レンジ、炊飯器5.5合、ウォーターサーバー' },
  { label: '調理器具', content: '包丁、まな板、栓抜き、鍋、フライパン、ざる、ボウル、フライ返し、おたま、菜箸など' },
  { label: '食器', content: 'お皿やコップ、フォーク、スプーン、お箸など' },
  { label: 'アメニティ', content: 'ドライヤー、シャンプー、ボディーソープ、歯ブラシ、タオル' },
  { label: 'お支払い方法', content: '現地決済またはクレジット事前決済（タイムデザイン手配旅行）' },
  { label: 'キャンセルポリシー', content: '30日前から50%、7日前から100%' },
];

export default function ReservationFormPage() {
  const router = useRouter();
  const { state, dispatch } = useReservation();
  const [currentStep, setCurrentStep] = useState(4);
  const [totalAmount, setTotalAmount] = useState(state.totalPrice);
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
        // Handle reservation confirmation step
        break;
      case 5:
        // 予約完了ページへの遷移は、フォーム送信後に行うべきです
        break;
      default:
        break;
    }
  };

  const handlePersonalInfoSubmit = (data: PersonalInfoFormData) => {
    console.log('Personal info submitted:', data);
    // 個人情報をContextに保存するなどの処理を追加
  };

  const handleCouponApplied = (discount: number) => {
    const newTotalAmount = totalAmount - discount;
    setTotalAmount(newTotalAmount);
    dispatch({ type: 'SET_TOTAL_PRICE', payload: newTotalAmount });
  };

  const handleReservationConfirm = () => {
    // 予約確定の処理
    // 例: 全ての予約情報をAPIに送信など
    router.push('/reservation-complete');
  };

  // 予約情報の生成
  const generateReservationInfo = () => {
    const planInfo = {
      name: "【一棟貸切！】贅沢遊びつくしヴィラプラン",
      date: state.selectedDate ? state.selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) : '',
      numberOfUnits: state.units
    };

    const estimateInfo = {
      units: state.guestCounts.map((count, index) => ({
        date: `${planInfo.date}〜`,
        plans: [
          { name: planInfo.name, type: '男性', count: count.male, amount: count.male * 68000 },
          { name: planInfo.name, type: '女性', count: count.female, amount: count.female * 68000 },
          { name: planInfo.name, type: '子供（ベッドあり）', count: count.childWithBed, amount: count.childWithBed * 68000 },
          { name: planInfo.name, type: '子供（ベッドなし）', count: count.childNoBed, amount: 0 }
        ].filter(plan => plan.count > 0)
      })),
      mealPlans: Object.entries(state.selectedFoodPlans).map(([planId, planInfo]) => {
        const plan = foodPlans.find(p => p.id === planId);
        return {
          name: plan ? plan.name : 'Unknown Plan',
          count: planInfo.count,
          amount: plan ? plan.price * planInfo.count : 0
        };
      }),
      totalAmount: state.totalPrice
    };

    return { planInfo, estimateInfo };
  };

  const { planInfo, estimateInfo } = generateReservationInfo();

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="flex-grow overflow-y-auto">
          <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-8 max-w-6xl">
            <div className="space-y-6">
              <ReservationProcess 
                currentStep={currentStep}
                onStepClick={handleStepClick}
              />
              <div className="bg-white rounded-2xl shadow-md p-4 sm:p-8">
                <PlanAndEstimateInfo planInfo={planInfo} estimateInfo={estimateInfo} />
                <PaymentAndPolicy 
                  totalAmount={totalAmount} 
                  onCouponApplied={handleCouponApplied} 
                />
                <PersonalInfoForm onSubmit={handlePersonalInfoSubmit} isMobile={isMobile} />
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
        </div>
      </div>
    </Layout>
  );
}