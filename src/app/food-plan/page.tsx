'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import { useReservation } from '@/app/contexts/ReservationContext';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import FoodPlanSelection from '@/app/components/food-plan/FoodPlanSelection';
import ReservationConfirmation from '@/app/components/reservation/ReservationConfirmation';
import { foodPlans } from '@/app/data/foodPlans';
import { addDays, format } from 'date-fns';

const amenities = [
  { label: '設備', content: 'エアコン、コンセント、無料Wi-Fi、IHコンロ1口' },
  { label: '備品', content: 'BBQコンロ、冷蔵庫（冷凍庫有り）、電気ケトル、電子レンジ、炊飯器5.5合、ウォーターサーバー' },
  { label: '調理器具', content: '包丁、まな板、栓抜き、鍋、フライパン、ざる、ボウル、フライ返し、おたま、菜箸など' },
  { label: '食器', content: 'お皿やコップ、フォーク、スプーン、お箸など' },
  { label: 'アメニティ', content: 'ドライヤー、シャンプー、ボディーソープ、歯ブラシ、タオル' },
  { label: 'お支払い方法', content: '現地決済、クレジット事前決済' },
  { label: 'キャンセルポリシー', content: '30日前から50%、7日前から100%' },
];

export default function FoodPlanPage() {
  const router = useRouter();
  const { state, dispatch } = useReservation();
  const [currentStep, setCurrentStep] = useState(3);
  const [guestSelectionData, setGuestSelectionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [checkInDateFormatted, setCheckInDateFormatted] = useState('');

  useEffect(() => {
    const fetchGuestSelectionData = () => {
      setIsLoading(true);
      setError(null);
      const storedData = localStorage.getItem('guestSelectionData');

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setGuestSelectionData(parsedData);

          const checkInDate = new Date(parsedData.selectedDate);
          if (isNaN(checkInDate.getTime())) {
            throw new Error('Invalid date');
          }

          const newDates = Array.from(
            { length: parsedData.nights },
            (_, i) => format(addDays(checkInDate, i), 'yyyy-MM-dd')
          );
          setDates(newDates);

          setCheckInDateFormatted(format(checkInDate, 'yyyy-MM-dd'));
          setIsLoading(false);
        } catch (error) {
          console.error('Error parsing guestSelectionData:', error);
          setError('データの読み込みに失敗しました。再度お試しください。');
          setIsLoading(false);
        }
      } else {
        console.log('No guestSelectionData found, redirecting to guest-selection');
        router.push('/guest-selection');
      }
    };

    fetchGuestSelectionData();
  }, [router]);

  const handleStepClick = (step: number) => {
    switch (step) {
      case 1:
        router.push('/reservation');
        break;
      case 2:
        router.push('/guest-selection');
        break;
      case 4:
        router.push('/reservation-form');
        break;
      default:
        break;
    }
  };

  const handlePersonalInfoClick = useCallback(() => {
    router.push('/reservation-form');
  }, [router]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-2xl font-bold">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-2xl font-bold text-red-500">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      {/* 不要な<Layout>コンポーネントと外側の<div>を削除 */}
      <ReservationProcess 
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />
      
      <div className="flex justify-center mb-6">
        <div className="inline-block border-2 border-[#00A2EF] px-4 sm:px-11 py-1 bg-[#00A2EF]">
          <h2 className="text-base sm:text-xl font-black text-[#FFFFFF] whitespace-nowrap">
            ＼　食事プランをお選びください　／
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <FoodPlanSelection
          foodPlans={foodPlans}
          initialTotalGuests={guestSelectionData?.totalGuests || 0}
          checkInDate={checkInDateFormatted}
          nights={guestSelectionData?.nights || 0}
          dates={dates}
          units={guestSelectionData?.units || 0}
        />

        <ReservationConfirmation
          guestSelectionData={guestSelectionData}
          foodPlans={foodPlans}
          amenities={amenities}
          onPersonalInfoClick={handlePersonalInfoClick}
        />
      </div>
    </>
  );
}