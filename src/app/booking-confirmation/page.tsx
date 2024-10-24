// src/app/booking-confirmation/page.tsx
'use client';

import { useState } from 'react';
import BookingDetails from '@/app/components/booking/BookingDetails';
import BookingCancel from '@/app/components/booking/BookingCancel';
import CustomButton from '@/app/components/ui/CustomButton';
import { ArrowUp } from 'lucide-react';

export default function BookingConfirmationPage() {
  const [activeTab, setActiveTab] = useState('confirmation');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="relative mb-29">
        <div className="absolute top-0 left-0 right-0 -mt-6 z-10 flex justify-center space-x-4">
          <StepIndicator
            active={activeTab === 'confirmation'}
            onClick={() => handleTabChange('confirmation')}
          >
            予約内容の確認
          </StepIndicator>
          <StepIndicator
            active={activeTab === 'cancel'}
            onClick={() => handleTabChange('cancel')}
          >
            予約のキャンセル
          </StepIndicator>
        </div>

        <div className="mt-24 bg-white shadow-md rounded-xl overflow-hidden">
          <div className="p-6">
            {activeTab === 'confirmation' && <BookingDetails />}
            {activeTab === 'cancel' && <BookingCancel />}
          </div>
        </div>
      </div>

      <CustomButton
        variant="primary"
        className="fixed bottom-5 right-5 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200"
        onClick={scrollToTop}
      >
        <ArrowUp className="h-6 w-6" />
      </CustomButton>
    </>
  );
}

function StepIndicator({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out
        ${active 
          ? 'bg-white text-blue-500 shadow-lg transform -translate-y-1' 
          : 'bg-white text-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5'
        }
      `}
    >
      {children}
    </button>
  );
}
