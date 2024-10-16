'use client';
import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    color: #363331;
  }
`;

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
  border-radius: 5px;
  margin-bottom: 15px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
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

const SubTable = styled.table`
  width: 100%;
  margin-top: 5px;
`;

const SubTd = styled.td`
  padding: 2px 5px;
  font-size: 0.9em;
`;

interface PlanAndEstimateInfoProps {
  planInfo: {
    name: string;
    date: Date;
    numberOfUnits: number;
    nights: number;
  };
  estimateInfo: {
    roomRates: Array<{
      date: Date;
      price: number;
    }>;
    mealPlans: Array<{
      name: string;
      count: number;
      price: number;
      menuSelections?: {
        [category: string]: {
          [item: string]: number;
        };
      };
    }>;
    guestCounts: {
      male: number;
      female: number;
      childWithBed: number;
      childNoBed: number;
    };
  };
  isMobile: boolean;
}

export default function PlanAndEstimateInfo({ planInfo, estimateInfo, isMobile }: PlanAndEstimateInfoProps) {
  const totalRoomRate = estimateInfo.roomRates.reduce((sum, rate) => sum + rate.price, 0);
  const totalMealPlanPrice = estimateInfo.mealPlans.reduce((sum, plan) => sum + plan.price * plan.count, 0);
  const totalAmount = totalRoomRate + totalMealPlanPrice;

  return (
    <>
      <GlobalStyle />
    <SectionContainer className={isMobile ? 'px-4' : ''}>
      <SectionTitle>お見積り内容</SectionTitle>
      <Table>
        <thead>
          <tr>
            <Th>項目</Th>
            <Th>内容</Th>
            <Th style={{ textAlign: 'right' }}>金額</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td colSpan={3} style={{ fontWeight: 'bold' }}>&lt;宿泊料金&gt;</Td>
          </tr>
          {estimateInfo.roomRates.map((rate, index) => (
            <tr key={index}>
              <Td>{`${index + 1}泊目`}</Td>
              <Td>{`${rate.date.toLocaleDateString('ja-JP')} (${planInfo.name})`}</Td>
              <Td style={{ textAlign: 'right' }}>{rate.price.toLocaleString()}円</Td>
            </tr>
          ))}
          <tr>
            <Td colSpan={2} style={{ textAlign: 'right' }}>宿泊料金小計：</Td>
            <Td style={{ textAlign: 'right' }}>{totalRoomRate.toLocaleString()}円</Td>
          </tr>

          <tr>
            <Td colSpan={3} style={{ fontWeight: 'bold' }}>&lt;食事プラン&gt;</Td>
          </tr>
          {estimateInfo.mealPlans.map((plan, index) => (
            <React.Fragment key={index}>
              <tr>
                <Td>{plan.name}</Td>
                <Td>{`${plan.count}名`}</Td>
                <Td style={{ textAlign: 'right' }}>{(plan.price * plan.count).toLocaleString()}円</Td>
              </tr>
              {plan.menuSelections && (
                <tr>
                  <Td colSpan={3}>
                    <SubTable>
                      <tbody>
                        {Object.entries(plan.menuSelections).map(([category, items], idx) => (
                          <tr key={idx}>
                            <SubTd style={{ fontWeight: 'bold' }}>{category}:</SubTd>
                            <SubTd>
                              {Object.entries(items)
                                .filter(([_, count]) => count > 0)
                                .map(([item, count]) => `${item} (${count})`).join(', ')}
                            </SubTd>
                          </tr>
                        ))}
                      </tbody>
                    </SubTable>
                  </Td>
                </tr>
              )}
            </React.Fragment>
          ))}
          <tr>
            <Td colSpan={2} style={{ textAlign: 'right' }}>食事プラン小計：</Td>
            <Td style={{ textAlign: 'right' }}>{totalMealPlanPrice.toLocaleString()}円</Td>
          </tr>

          <TotalRow>
            <Td colSpan={2} style={{ textAlign: 'right' }}>合計金額：</Td>
            <Td style={{ textAlign: 'right' }}>{totalAmount.toLocaleString()}円</Td>
          </TotalRow>
        </tbody>
      </Table>

      <div style={{ marginTop: '20px', fontSize: '0.9em' }}>
        <p>宿泊人数: {Object.values(estimateInfo.guestCounts).reduce((sum, count) => sum + count, 0)}名</p>
        <p>内訳:</p>
        <ul style={{ listStyleType: 'disc', marginLeft: '20px' }}>
          <li>大人 (男性): {estimateInfo.guestCounts.male}名</li>
          <li>大人 (女性): {estimateInfo.guestCounts.female}名</li>
          <li>子供 (ベッドあり): {estimateInfo.guestCounts.childWithBed}名</li>
          <li>子供 (添い寝): {estimateInfo.guestCounts.childNoBed}名</li>
        </ul>
      </div>
      </SectionContainer>
    </>
  );
}