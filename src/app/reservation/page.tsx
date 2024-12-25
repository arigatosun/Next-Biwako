'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import RoomInformation from '@/app/components/reservation/RoomInformation';
import ReservationCalendar from '@/app/components/reservation/ReservationCalendar';
import { useReservation } from '@/app/contexts/ReservationContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ReservationPage() {
  const router = useRouter();
  const [currentStep] = useState(1);
  const { state, dispatch } = useReservation();
  const [isMobile, setIsMobile] = useState(false);
  const [currentStartDate, setCurrentStartDate] = useState(new Date());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    dispatch({ 
      type: 'SET_BOOKING_PERIOD', 
      payload: { 
        start: new Date(), 
        end: new Date(2025, 12, 31)
      } 
    });

    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

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

  const formatMonthDisplay = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };

  const getNextMonthDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  };

  const handlePrevMonth = () => {
    const monthsToMove = isMobile ? 1 : 2;
    const newDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() - monthsToMove, 1);
    
    const minDate = new Date(state.bookingStartDate.getFullYear(), state.bookingStartDate.getMonth(), 1);
    
    if (newDate.getTime() < minDate.getTime()) {
      setCurrentStartDate(minDate);
    } else {
      setCurrentStartDate(newDate);
    }
  };

  const handleNextMonth = () => {
    const monthsToMove = isMobile ? 1 : 2;
    const newDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + monthsToMove, 1);
    
    const maxDate = new Date(state.bookingEndDate.getFullYear(), state.bookingEndDate.getMonth(), 1);
    
    if (newDate.getTime() > maxDate.getTime()) {
      setCurrentStartDate(maxDate);
    } else {
      setCurrentStartDate(newDate);
    }
  };

  return (
    <>
      {/* 不要な<Layout>コンポーネントを削除 */}
      {/* 不要な外側の<div>を削除 */}
      {/* コンテンツを直接レンダリング */}
      <ReservationProcess 
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />
      
      {/* 以下、ページ固有のコンテンツ */}
      {/* タイトルセクション */}
      <div className="mt-4 sm:mt-6 mb-4 sm:mb-6">
        <div className="flex justify-center w-full">
          <div className={`border-2 border-[#00A2EF] bg-[#00A2EF] px-3 sm:px-11 py-1 
            ${isMobile ? 'w-full' : 'inline-block'}`}>
            <h2 className="text-base sm:text-xl font-black text-white text-center whitespace-nowrap">
              ＼　ご希望の宿泊日をお選びください　／
            </h2>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="space-y-4 sm:space-y-6">
        {/* RoomInformation */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <RoomInformation isMobile={isMobile} />
        </div>

        {/* カレンダーセクション */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-3 sm:p-6">
            {/* カレンダーナビゲーション */}
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={handlePrevMonth} 
                className="bg-[#999999] text-white px-2 py-1.5 sm:px-7 sm:py-2.5 rounded-full flex items-center font-semibold text-sm sm:text-base"
              >
                <ChevronLeft className="w-3 h-3 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                {isMobile ? '前月' : '前2ヶ月'}
              </button>
              <div className="text-base sm:text-lg font-bold">
                {isMobile
                  ? formatMonthDisplay(currentStartDate)
                  : `${formatMonthDisplay(currentStartDate)} - ${formatMonthDisplay(getNextMonthDate(currentStartDate))}`
                }
              </div>
              <button 
                onClick={handleNextMonth} 
                className="bg-[#363331] text-white px-2 py-1.5 sm:px-7 sm:py-2.5 rounded-full flex items-center font-semibold text-sm sm:text-base"
              >
                {isMobile ? '次月' : '次2ヶ月'}
                <ChevronRight className="w-3 h-3 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
              </button>
            </div>

            {/* カレンダー本体 */}
            <ReservationCalendar 
              onDateSelect={handleDateSelect} 
              isMobile={isMobile}
              currentStartDate={currentStartDate}
            />
          </div>
        </div>
      </div>
    </>
  );
}