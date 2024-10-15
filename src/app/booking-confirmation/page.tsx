'use client';

import { useState } from 'react';
import Layout from '@/app/components/common/Layout';
import BookingDetails from '@/app/components/booking/BookingDetails';
import BookingCancel from '@/app/components/booking/BookingCancel';
import CustomButton from '@/app/components/ui/CustomButton';
import { ArrowUp, ChevronDown } from 'lucide-react';

export default function BookingConfirmationPage() {
  const [activeTab, setActiveTab] = useState('confirmation');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 pt-4 sm:pt-6 md:pt-8">
        <main className="container mx-auto px-4 mt-6 max-w-6xl">
          <div className="relative">
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
            
            <div className="mt-10 bg-white shadow-md rounded-xl overflow-hidden">
              {activeTab === 'confirmation' && <BookingDetails />}
              {activeTab === 'cancel' && <BookingCancel />}
            </div>
          </div>

          <div className="flex justify-center mt-5">
            <CustomButton variant="outline" className="bg-gray-200 text-black">
              前に戻る
            </CustomButton>
          </div>
        </main>

        <CustomButton
          variant="primary"
          className="fixed bottom-5 right-5 rounded-full p-2"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-6 w-6" />
        </CustomButton>
      </div>
    </Layout>
  );
}

function StepIndicator({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out
        ${active 
          ? 'bg-white text-blue-500 shadow-lg transform -translate-y-1' 
          : 'bg-white text-gray-700 shadow-sm'
        }
      `}
    >
      {children}
      <ChevronDown className={`
        absolute bottom-1 left-1/2 transform -translate-x-1/2 translate-y-1/2
        ${active ? 'text-blue-500' : 'text-gray-400'}
      `} />
    </button>
  );
}