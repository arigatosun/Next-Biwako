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

    // 予約可能期間の設定
    dispatch({ 
      type: 'SET_BOOKING_PERIOD', 
      payload: { 
        start: new Date(), 
        end: new Date(2025, 4, 31) // 2025年5月31日まで
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
    const newDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() - 2, 1);
    if (newDate >= state.bookingStartDate) {
      setCurrentStartDate(newDate);
    }
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 2, 1);
    if (newDate <= state.bookingEndDate) {
      setCurrentStartDate(newDate);
    }
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [year, month] = event.target.value.split('-').map(Number);
    const newDate = new Date(year, month - 1, 1);
    if (newDate >= state.bookingStartDate && newDate <= state.bookingEndDate) {
      setCurrentStartDate(newDate);
    }
  };

  const getMonthOptions = () => {
    const options = [];
    let currentDate = new Date(state.bookingStartDate);
    while (currentDate <= state.bookingEndDate) {
      options.push({
        value: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
        label: `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return options;
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

              {isMobile ? (
                <div className="flex justify-between items-center mb-4">
                  <button onClick={handlePrevMonth} className="bg-[#999999] text-white px-3 py-1.5 rounded-full flex items-center font-semibold text-sm">
                    <ChevronLeft className="w-3 h-3 mr-1" />
                    前2ヶ月
                  </button>
                  <select
                    value={`${currentStartDate.getFullYear()}-${currentStartDate.getMonth() + 1}`}
                    onChange={handleMonthChange}
                    className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    {getMonthOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={handleNextMonth} className="bg-[#363331] text-white px-3 py-1.5 rounded-full flex items-center font-semibold text-sm">
                    次2ヶ月
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-4">
                  <button onClick={handlePrevMonth} className="bg-[#999999] text-white px-7 py-2.5 rounded-full flex items-center font-semibold">
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    前2ヶ月
                  </button>
                  <div className="text-lg font-bold">
                    {currentStartDate.getFullYear()}年{currentStartDate.getMonth() + 1}月 - {new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 2, 0).getFullYear()}年{new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 2, 0).getMonth() + 1}月
                  </div>
                  <button onClick={handleNextMonth} className="bg-[#363331] text-white px-7 py-2.5 rounded-full flex items-center font-semibold">
                    次2ヶ月
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              )}

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