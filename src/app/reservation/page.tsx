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
        end: new Date(2025, 4, 31)
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

              <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="bg-[#999999] text-white px-3 py-1.5 sm:px-7 sm:py-2.5 rounded-full flex items-center font-semibold text-sm sm:text-base">
                  <ChevronLeft className="w-3 h-3 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  {isMobile ? '前月' : '前2ヶ月'}
                </button>
                <div className="text-base sm:text-lg font-bold">
                  {isMobile
                    ? `${currentStartDate.getFullYear()}年${currentStartDate.getMonth() + 1}月`
                    : `${currentStartDate.getFullYear()}年${currentStartDate.getMonth() + 1}月 - ${new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 1, 0).getFullYear()}年${new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 1, 0).getMonth() + 2}月`
                  }
                </div>
                <button onClick={handleNextMonth} className="bg-[#363331] text-white px-3 py-1.5 sm:px-7 sm:py-2.5 rounded-full flex items-center font-semibold text-sm sm:text-base">
                  {isMobile ? '次月' : '次2ヶ月'}
                  <ChevronRight className="w-3 h-3 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
                </button>
              </div>

              <ReservationCalendar 
                onDateSelect={handleDateSelect} 
                isMobile={isMobile}
                currentStartDate={currentStartDate}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}