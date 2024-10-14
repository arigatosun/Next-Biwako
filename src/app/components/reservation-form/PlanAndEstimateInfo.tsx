'use client';
import React from 'react';
import styled from 'styled-components';

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

const InfoTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
`;

const InfoRow = styled.tr`
  background-color: #f0f0f0;
`;

const InfoLabel = styled.td`
  padding: 10px;
  font-weight: bold;
  color: #363331;
  width: 30%;
`;

const InfoValue = styled.td`
  padding: 10px;
  color: #363331;
`;

const EstimateTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const EstimateHeader = styled.th`
  background-color: #f0f0f0;
  padding: 10px;
  text-align: left;
  color: #363331;
  font-weight: bold;
`;

const EstimateCell = styled.td<{ align?: string }>`
  padding: 10px;
  text-align: ${props => props.align || 'left'};
  color: #363331;
  border-bottom: 1px solid #ddd;
`;

const TotalRow = styled.tr`
  font-weight: bold;
  font-size: 1.2em;
`;

interface PlanAndEstimateInfoProps {
  planInfo: {
    name: string;
    date: string;
    numberOfUnits: number;
  };
  estimateInfo: {
    units: Array<{
      date: string;
      plans: Array<{
        name: string;
        type: string;
        count: number;
        amount: number;
      }>;
    }>;
    mealPlans: Array<{
      name: string;
      count: number;
      amount: number;
    }>;
    totalAmount: number;
  };
}

export default function PlanAndEstimateInfo({ planInfo, estimateInfo }: PlanAndEstimateInfoProps) {
  return (
    <>
      <SectionContainer>
        <SectionTitle>プラン情報</SectionTitle>
        <InfoTable>
          <tbody>
            <InfoRow>
              <InfoLabel>プラン:</InfoLabel>
              <InfoValue>{planInfo.name}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>宿泊日:</InfoLabel>
              <InfoValue>{planInfo.date}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>棟数:</InfoLabel>
              <InfoValue>{planInfo.numberOfUnits}棟</InfoValue>
            </InfoRow>
          </tbody>
        </InfoTable>
      </SectionContainer>

      <SectionContainer>
        <SectionTitle>お見積り内容</SectionTitle>
        <EstimateTable>
          <thead>
            <tr>
              <EstimateHeader>プラン</EstimateHeader>
              <EstimateHeader>タイプ</EstimateHeader>
              <EstimateHeader>人数</EstimateHeader>
              <EstimateHeader align="right">金額</EstimateHeader>
            </tr>
          </thead>
          <tbody>
            {estimateInfo.units.map((unit, unitIndex) => (
              <React.Fragment key={unitIndex}>
                <tr>
                  <EstimateCell colSpan={4}>
                    <strong>&lt;{unitIndex + 1}棟目&gt; {unit.date}</strong>
                  </EstimateCell>
                </tr>
                {unit.plans.map((plan, planIndex) => (
                  <tr key={planIndex}>
                    <EstimateCell>{plan.name}</EstimateCell>
                    <EstimateCell>{plan.type}</EstimateCell>
                    <EstimateCell>{plan.count}</EstimateCell>
                    <EstimateCell align="right">{plan.amount.toLocaleString()}</EstimateCell>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr>
              <EstimateCell colSpan={4}>
                <strong>&lt;食事プラン&gt;</strong>
              </EstimateCell>
            </tr>
            {estimateInfo.mealPlans.map((meal, index) => (
              <tr key={index}>
                <EstimateCell>{meal.name}</EstimateCell>
                <EstimateCell></EstimateCell>
                <EstimateCell>{meal.count}</EstimateCell>
                <EstimateCell align="right">{meal.amount.toLocaleString()}</EstimateCell>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <EstimateCell colSpan={2}>消費税</EstimateCell>
              <EstimateCell></EstimateCell>
              <EstimateCell align="right">込み</EstimateCell>
            </tr>
            <tr>
              <EstimateCell colSpan={2}>サービス料</EstimateCell>
              <EstimateCell></EstimateCell>
              <EstimateCell align="right">込み</EstimateCell>
            </tr>
            <TotalRow>
              <EstimateCell colSpan={2}>合計金額</EstimateCell>
              <EstimateCell></EstimateCell>
              <EstimateCell align="right">{estimateInfo.totalAmount.toLocaleString()}円</EstimateCell>
            </TotalRow>
          </tfoot>
        </EstimateTable>
      </SectionContainer>
    </>
  );
}