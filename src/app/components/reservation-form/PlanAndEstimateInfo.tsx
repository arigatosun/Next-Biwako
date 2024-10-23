import React, { useState } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from "lucide-react";
import { useReservation } from '@/app/contexts/ReservationContext';
import { foodPlans } from '@/app/data/foodPlans';
import type { 
  FoodPlanInfo, 
  DatePlans, 
  UnitPlans, 
  SelectedFoodPlanByUnit 
} from '@/app/types/ReservationTypes';

// 既存のStyled Components
const SectionContainer = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h3`
  background-color: #f0f0f0;
  color: #333;
  padding: 10px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 5px 5px 0 0;
  margin-bottom: 0;
`;

const StayInfoContainer = styled.div`
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-top: none;
  padding: 15px;
  margin-bottom: 20px;
`;

const StayInfoTitle = styled.h4`
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

const StayInfoList = styled.ul`
  list-style-type: none;
  padding-left: 0;
`;

const StayInfoItem = styled.li`
  margin-bottom: 5px;
`;

// デスクトップ表示用のStyled Components
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ddd;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Th = styled.th`
  background-color: #f0f0f0;
  padding: 10px;
  text-align: left;
  font-weight: bold;
  border: 1px solid #ddd;
`;

const Td = styled.td`
  padding: 10px;
  border: 1px solid #ddd;
`;

const TotalRow = styled.tr`
  font-weight: bold;
  font-size: 1.1em;
  background-color: #f0f0f0;
`;

// モバイル表示用の新しいStyled Components
const MobileContainer = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileDateCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
`;

const MobileDateHeader = styled.button`
  width: 100%;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border: none;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
`;

const MobileContentSection = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'block' : 'none'};
  padding: 16px;
`;

const MobilePriceFooter = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const PlanAndEstimateInfo: React.FC = () => {
  const { state } = useReservation();
  const [openDates, setOpenDates] = useState<{ [key: string]: boolean }>({});

  const guestCounts = state.guestCounts?.[0] || {
    male: 0,
    female: 0,
    childWithBed: 0,
    childNoBed: 0,
  };

  // 宿泊料金の総計
  const roomTotal = state.dailyRates.reduce((total, day) => 
    total + (day.price * state.units), 0);

  // 食事料金の総計
  const mealTotal = Object.entries(state.selectedFoodPlansByUnit).reduce(
    (total, [_, unitPlans]) => 
      total + Object.values(unitPlans).reduce(
        (unitSum, datePlans) => 
          unitSum + Object.values(datePlans).reduce(
            (sum, planInfo) => sum + planInfo.price, 
            0
          ),
        0
      ),
    0
  );

  const totalAmount = roomTotal + mealTotal;
  const discountAmount = state.discountAmount || 0;
  const totalAmountAfterDiscount = totalAmount - discountAmount;

  const toggleDate = (dateStr: string) => {
    setOpenDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  // 日付ごとの食事プラン合計を計算
  const calculateDailyMealTotal = (dateString: string, unitIndex: number) => {
    const unitPlans = state.selectedFoodPlansByUnit[unitIndex.toString()]?.[dateString] || {};
    return Object.values(unitPlans).reduce((total, planInfo) => total + planInfo.price, 0);
  };

  // 食事プラン表示ロジック
  const renderMealPlans = (dateString: string, unitIndex: number) => {
    const unitPlans = state.selectedFoodPlansByUnit[unitIndex.toString()]?.[dateString] || {};
    
    if (Object.keys(unitPlans).length === 0) return null;
  
    return Object.entries(unitPlans).map(([planId, planInfo], planIndex) => {
      const planDetails = foodPlans.find(p => p.id === planId);

      return (
        <tr key={`plan-${planIndex}`}>
          <Td>食事プラン</Td>
          <Td colSpan={2}>
            <div>
              {planDetails?.name} ({planInfo.count}名)
              {planInfo.menuSelections && (
                <div className="text-sm text-gray-600 mt-1">
                  {Object.entries(planInfo.menuSelections).map(([category, items]) => (
                    <div key={category}>
                      {category}:
                      {Object.entries(items).map(([item, count]) => (
                        <span key={item} className="ml-2">{item}({count}名)</span>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Td>
          <Td style={{ textAlign: 'right' }}>
            {planInfo.price.toLocaleString()}円
          </Td>
        </tr>
      );
    });
  };

  // モバイル用の食事プラン表示ロジック
  const renderMobileMealPlans = (dateString: string, unitIndex: number) => {
    const unitPlans = state.selectedFoodPlansByUnit[unitIndex.toString()]?.[dateString] || {};
    
    if (Object.keys(unitPlans).length === 0) return null;

    return (
      <div className="space-y-4">
        {Object.entries(unitPlans).map(([planId, planInfo], planIndex) => {
          const planDetails = foodPlans.find(p => p.id === planId);
          return (
            <div key={`mobile-plan-${planIndex}`} className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span>{planDetails?.name}</span>
                <span>{planInfo.count}名</span>
              </div>
              {planInfo.menuSelections && (
                <div className="text-sm text-gray-600 mt-2">
                  {Object.entries(planInfo.menuSelections).map(([category, items]) => (
                    <div key={category}>
                      {category}:
                      {Object.entries(items).map(([item, count]) => (
                        <span key={item} className="ml-2">{item}({count}名)</span>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <span>金額</span>
                <span>{planInfo.price.toLocaleString()}円</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // デスクトップ表示のレンダリング
  const renderDesktopView = () => (
    <Table>
      <thead>
        <tr>
          <Th>日付</Th>
          <Th>棟</Th>
          <Th>項目</Th>
          <Th>内容</Th>
          <Th>金額</Th>
        </tr>
      </thead>
      <tbody>
        {state.dailyRates.map((day, dayIndex) => (
          <React.Fragment key={`day-${dayIndex}`}>
            {Array.from({ length: state.units }, (_, unitIndex) => {
              const dateString = format(day.date, 'yyyy-MM-dd');
              const unitPlans = state.selectedFoodPlansByUnit[unitIndex.toString()]?.[dateString] || {};
              const rowSpan = Object.keys(unitPlans).length + 1;
              
              return (
                <React.Fragment key={`unit-${unitIndex}-day-${dayIndex}`}>
                  <tr>
                    <Td rowSpan={rowSpan}>
                      {format(day.date, 'yyyy/MM/dd')}
                    </Td>
                    <Td rowSpan={rowSpan}>
                      棟 {unitIndex + 1}
                    </Td>
                    <Td>宿泊料金</Td>
                    <Td></Td>
                    <Td style={{ textAlign: 'right' }}>
                      {day.price.toLocaleString()}円
                    </Td>
                  </tr>
                  {renderMealPlans(dateString, unitIndex)}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
        {discountAmount > 0 && (
          <tr>
            <Td colSpan={4} style={{ textAlign: 'right' }}>割引:</Td>
            <Td style={{ textAlign: 'right' }}>
              -{discountAmount.toLocaleString()}円
            </Td>
          </tr>
        )}
        <TotalRow>
          <Td colSpan={4} style={{ textAlign: 'right' }}>
            合計金額（税・サービス料込み）：
          </Td>
          <Td style={{ textAlign: 'right' }}>
            {totalAmountAfterDiscount.toLocaleString()}円
          </Td>
        </TotalRow>
      </tbody>
    </Table>
  );

  // モバイル表示のレンダリング
  const renderMobileView = () => (
    <MobileContainer>
      {state.dailyRates.map((day, dayIndex) => {
        const dateString = format(day.date, 'yyyy-MM-dd');
        const isOpen = openDates[dateString];
        
        return (
          <MobileDateCard key={`mobile-day-${dayIndex}`}>
            <MobileDateHeader onClick={() => toggleDate(dateString)}>
              <span>{format(day.date, 'yyyy/MM/dd')}</span>
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </MobileDateHeader>
            
            <MobileContentSection isOpen={isOpen}>
              {Array.from({ length: state.units }, (_, unitIndex) => (
                <div key={`mobile-unit-${unitIndex}`} className="mb-4 p-4 border rounded">
                  <div className="font-medium mb-2">棟 {unitIndex + 1}</div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>宿泊料金</span>
                      <span>{day.price.toLocaleString()}円</span>
                    </div>
                    {renderMobileMealPlans(dateString, unitIndex)}
                  </div>
                </div>
              ))}
            </MobileContentSection>
          </MobileDateCard>
        );
      })}
      
      <MobilePriceFooter>
        <div className="flex justify-between items-center">
          <span className="font-bold">合計金額（税込）</span>
          <span className="font-bold text-lg">
            {totalAmountAfterDiscount.toLocaleString()}円
          </span>
        </div>
      </MobilePriceFooter>
    </MobileContainer>
  );

  return (
    <SectionContainer>
      <SectionTitle>お見積り内容</SectionTitle>
      <StayInfoContainer>
        <StayInfoTitle>宿泊情報</StayInfoTitle>
        <StayInfoList>
          <StayInfoItem>
            プラン名: 【一棟貸切！】贅沢遊びつくしヴィラプラン
          </StayInfoItem>
          <StayInfoItem>
            宿泊期間: {state.selectedDate ? format(state.selectedDate, 'yyyy年MM月dd日') : ''} から {state.nights}泊
          </StayInfoItem>
          
          <StayInfoItem>棟数: {state.units}棟</StayInfoItem>
          <StayInfoItem>
            宿泊人数: {state.totalGuests}名 (大人男性: {guestCounts.male}名, 
            大人女性: {guestCounts.female}名,
            子供(ベッドあり): {guestCounts.childWithBed}名, 
            子供(添い寝): {guestCounts.childNoBed}名)
          </StayInfoItem>
        </StayInfoList>
      </StayInfoContainer>

      {renderDesktopView()}
      {renderMobileView()}
      
      <div className="mb-20 md:mb-0" /> {/* モバイル表示時の固定フッターの余白 */}
    </SectionContainer>
  );
};

export default PlanAndEstimateInfo;