'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import RoomInformation from '@/app/components/reservation/RoomInformation';
import ReservationCalendar from '@/app/components/reservation/ReservationCalendar';
import { useReservation } from '@/app/contexts/ReservationContext';

export default function ReservationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const { dispatch } = useReservation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // 768px未満をモバイルとする
    };

    handleResize(); // 初期化時に一度実行
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDateSelect = (date: Date) => {
    dispatch({ type: 'SET_DATE', payload: date });
    router.push('/guest-selection');
  };

  const handleStepClick = (step: number) => {
    switch (step) {
      case 2:
        router.push('/guest-selection');
        break;
      case 3:
        router.push('/food-plan');
        break;
      case 4:
        router.push('/reservation-form');
        break;
      default:
        break;
    }
  };

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
              
              <div className="flex justify-center mb-6">
                <div className="inline-block border-2 border-[#00A2EF] px-4 sm:px-11 py-1 bg-[#00A2EF]">
                  <h2 className="text-base sm:text-xl font-black text-[#FFFFFF] whitespace-nowrap">
                    ＼　ご希望の宿泊日をお選びください　／
                  </h2>
                </div>
              </div>

              <RoomInformation isMobile={isMobile} />
              <ReservationCalendar onDateSelect={handleDateSelect} isMobile={isMobile} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}