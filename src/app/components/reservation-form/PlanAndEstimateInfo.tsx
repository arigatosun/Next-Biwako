'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useReservation } from '@/app/contexts/ReservationContext';
import { format } from 'date-fns';
import { foodPlans, FoodPlan } from '@/app/data/foodPlans';
import { useSwipeable } from 'react-swipeable';

// スタイルコンポーネントの定義
const SectionContainer = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h3`
  background-color: #333;
  color: white;
  padding: 10px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 5px 5px 0 0;
  margin-bottom: 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ddd;
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

const StayInfoContainer = styled.div`
  background-color: #f9f9f9;
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

// モバイル向けの新しいスタイルドコンポーネント
const MobileCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
`;

const MobileCardHeader = styled.div`
  background-color: #f0f0f0;
  padding: 10px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MobileCardContent = styled.div<{ isOpen: boolean }>`
  padding: 15px;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const MobileCardItem = styled.div`
  margin-bottom: 10px;
`;

const MobileTotalFixed = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #f0f0f0;
  padding: 15px;
  text-align: right;
  font-weight: bold;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
`;

const MobileViewContainer = styled.div`
  overflow: hidden;
`;

export default function PlanAndEstimateInfo() {
  const { state } = useReservation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [openCards, setOpenCards] = useState<{ [key: string]: boolean }>({});

  // デバッグ用ログ
  console.log('Selected Food Plans By Date:', state.selectedFoodPlansByDate);
  console.log('Menu Selections By Date:', state.menuSelectionsByDate);

  const roomTotal = state.dailyRates.reduce((total, day) => {
    const dayRoomPrice = day.price * state.units;
    return total + dayRoomPrice;
  }, 0);

  const mealTotal = Object.entries(state.selectedFoodPlansByDate).reduce((total, [date, plans]) => {
    const dayMealTotal = Object.values(plans).reduce((sum, plan) => {
      return sum + plan.price;
    }, 0);
    return total + dayMealTotal;
  }, 0);

  const totalAmount = roomTotal + mealTotal;
  const discountAmount = state.discountAmount || 0;
  const totalAmountAfterDiscount = totalAmount - discountAmount;
  const guestCounts =
    state.guestCounts && state.guestCounts[0]
      ? state.guestCounts[0]
      : {
          male: 0,
          female: 0,
          childWithBed: 0,
          childNoBed: 0,
        };

  const toggleCard = (date: string) => {
    setOpenCards(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => setActiveIndex(prevIndex => Math.min(prevIndex + 1, state.dailyRates.length - 1)),
    onSwipedRight: () => setActiveIndex(prevIndex => Math.max(prevIndex - 1, 0)),
  });

  const renderDesktopView = () => (
    <Table>
      <thead>
        <tr>
          <Th>日付</Th>
          <Th>項目</Th>
          <Th>内容</Th>
          <Th>数量</Th>
          <Th style={{ textAlign: 'right' }}>金額</Th>
        </tr>
      </thead>
      <tbody>
        {state.dailyRates.map((day, index) => {
          const dateString = format(day.date, 'yyyy-MM-dd');
          const mealsForDay = state.selectedFoodPlansByDate[dateString] || {};
          const menuSelectionsForDay = state.menuSelectionsByDate[dateString] || {};
          const mealPlans = Object.entries(mealsForDay).map(([planId, plan]) => {
            const planDetails: FoodPlan | undefined = foodPlans.find((p) => p.id === planId);
            const menuSelections = menuSelectionsForDay[planId];
            return {
              name: planDetails ? planDetails.name : planId,
              count: plan.count,
              price: plan.price,
              menuSelections,
            };
          });

          return (
            <React.Fragment key={index}>
              <tr>
                <Td rowSpan={mealPlans.length + 1}>{format(day.date, 'yyyy/MM/dd')}</Td>
                <Td>宿泊料金</Td>
                <Td>
                  {state.units}棟 × {day.price.toLocaleString()}円
                </Td>
                <Td>{state.units}棟</Td>
                <Td style={{ textAlign: 'right' }}>{(day.price * state.units).toLocaleString()}円</Td>
              </tr>
              {mealPlans.map((plan, planIndex) => (
                <tr key={planIndex}>
                  <Td>食事プラン</Td>
                  <Td>
                    {plan.name}
                    {plan.menuSelections && Object.keys(plan.menuSelections).length > 0 && (
                      <div style={{ marginTop: '5px' }}>
                        <strong>詳細:</strong>
                        <ul style={{ marginTop: '5px' }}>
                          {Object.entries(plan.menuSelections).map(([category, items]) => (
                            <li key={category}>
                              {category}:
                              {Object.entries(items).map(([item, count]) => (
                                <span key={item}> {item}({count}名)</span>
                              ))}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Td>
                  <Td>{plan.count}名</Td>
                  <Td style={{ textAlign: 'right' }}>{plan.price.toLocaleString()}円</Td>
                </tr>
              ))}
            </React.Fragment>
          );
        })}
        {discountAmount > 0 && (
          <tr>
            <Td style={{ textAlign: 'right' }} colSpan={4}>
              割引:
            </Td>
            <Td style={{ textAlign: 'right' }}>-{discountAmount.toLocaleString()}円</Td>
          </tr>
        )}
        <tr>
        <Td colSpan={4} style={{ textAlign: 'right' }}>
          消費税（10%）：
        </Td>
        <Td style={{ textAlign: 'right' }}>込み</Td>
      </tr>
      <tr>
        <Td colSpan={4} style={{ textAlign: 'right' }}>
          サービス料：
        </Td>
        <Td style={{ textAlign: 'right' }}>込み</Td>
      </tr>
      <TotalRow>
        <Td colSpan={4} style={{ textAlign: 'right' }}>
          合計金額（税・サービス料込み）：
        </Td>
        <Td style={{ textAlign: 'right' }}>{totalAmountAfterDiscount.toLocaleString()}円</Td>
      </TotalRow>
    </tbody>
  </Table>
);

  const renderMobileView = () => (
    <MobileViewContainer {...handlers}>
      {state.dailyRates.map((day, index) => {
        const dateString = format(day.date, 'yyyy-MM-dd');
        const mealsForDay = state.selectedFoodPlansByDate[dateString] || {};
        const menuSelectionsForDay = state.menuSelectionsByDate[dateString] || {};

        return (
          <MobileCard key={index} style={{ display: index === activeIndex ? 'block' : 'none' }}>
            <MobileCardHeader onClick={() => toggleCard(dateString)}>
              <span>{format(day.date, 'yyyy/MM/dd')}</span>
              <span>{openCards[dateString] ? '▲' : '▼'}</span>
            </MobileCardHeader>
            <MobileCardContent isOpen={openCards[dateString]}>
              <MobileCardItem>
                <strong>宿泊料金:</strong> {state.units}棟 × {day.price.toLocaleString()}円
                = {(day.price * state.units).toLocaleString()}円
              </MobileCardItem>
              {Object.entries(mealsForDay).map(([planId, plan]) => {
                const planDetails = foodPlans.find(p => p.id === planId);
                return (
                  <MobileCardItem key={planId}>
                    <strong>{planDetails?.name}:</strong> {plan.count}名
                    = {plan.price.toLocaleString()}円
                    {menuSelectionsForDay[planId] && (
                      <div>
                        <strong>詳細:</strong>
                        <ul>
                          {Object.entries(menuSelectionsForDay[planId]).map(([category, items]) => (
                            <li key={category}>
                              {category}:
                              {Object.entries(items).map(([item, count]) => (
                                <span key={item}> {item}({count}名)</span>
                              ))}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </MobileCardItem>
                );
              })}
            </MobileCardContent>
          </MobileCard>
        );
      })}
    </MobileViewContainer>
  );

  return (
    <SectionContainer>
      <SectionTitle>お見積り内容</SectionTitle>
      <StayInfoContainer>
        <StayInfoTitle>宿泊情報</StayInfoTitle>
        <StayInfoList>
          <StayInfoItem>プラン名: 【一棟貸切！】贅沢遊びつくしヴィラプラン</StayInfoItem>
          <StayInfoItem>
            宿泊期間: {state.selectedDate ? format(state.selectedDate, 'yyyy年MM月dd日') : ''} から {state.nights}泊
          </StayInfoItem>
          <StayInfoItem>棟数: {state.units}棟</StayInfoItem>
          <StayInfoItem>
            宿泊人数: {state.totalGuests}名 (大人男性: {guestCounts.male}名, 大人女性: {guestCounts.female}名, 子供(ベッドあり): {guestCounts.childWithBed}名, 子供(添い寝): {guestCounts.childNoBed}名)
          </StayInfoItem>
        </StayInfoList>
      </StayInfoContainer>
      <div className="desktop-view">
        {renderDesktopView()}
      </div>
      <div className="mobile-view">
        {renderMobileView()}
        <MobileTotalFixed>
  合計金額（税・サービス料込み）: {totalAmountAfterDiscount.toLocaleString()}円
</MobileTotalFixed>
      </div>
    </SectionContainer>
  );
}