'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import PlanAndEstimateInfo from '../components/reservation-form/PlanAndEstimateInfo';
import PaymentAndPolicy from '../components/reservation-form/PaymentAndPolicy';
import PersonalInfoForm from '../components/reservation-form/PersonalInfoForm';
import { ChevronRight } from 'lucide-react';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  overflow-x: hidden;
`;

const ContentContainer = styled.div`
  width: 90.91%;
  max-width: 1100px;
  margin: 0 auto;
  transform: scale(1.1);
  transform-origin: center top;
`;

const WhiteFrame = styled.div`
  background-color: white;
  border-radius: 15px;
  padding: 30px;
  width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const InnerContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const ConfirmButton = styled.button`
  background-color: #007BFF;
  color: white;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px auto 0;
  width: 60%;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

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
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  emailConfirm: string;
  gender: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  address: string;
  buildingName?: string;
  transportation: string;
  checkInTime: string;
  pastStay: string;
  notes?: string;
  purpose: string;
  purposeDetails?: string;
}

export default function ReservationFormPage() {
  const [currentStep, setCurrentStep] = useState(5);

  const handleNextStep = () => {
    setCurrentStep(prevStep => Math.min(6, prevStep + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep(prevStep => Math.max(1, prevStep - 1));
  };

  const handlePersonalInfoSubmit = (data: PersonalInfoFormData) => {
    console.log('Personal info submitted:', data);
  };

  return (
    <PageContainer>
      <ContentContainer>
        <ReservationProcess 
          currentStep={currentStep} 
          onNextStep={handleNextStep}
          onPrevStep={handlePrevStep}
        />
        <WhiteFrame>
          <InnerContent>
            <PlanAndEstimateInfo planInfo={mockPlanInfo} estimateInfo={mockEstimateInfo} />
            <PaymentAndPolicy />
            <PersonalInfoForm onSubmit={handlePersonalInfoSubmit} />
            <ConfirmButton onClick={handleNextStep}>
              予約を確定する
              <ChevronRight className="ml-2" size={20} />
            </ConfirmButton>
          </InnerContent>
        </WhiteFrame>
      </ContentContainer>
    </PageContainer>
  );
}