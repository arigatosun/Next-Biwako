import React, { useState } from 'react';
import styled from 'styled-components';
import Image from 'next/image';

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

const PaymentOption = styled.div<{ selected: boolean }>`
  border: 2px solid ${props => props.selected ? '#00A2EF' : '#ddd'};
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 10px;
  background-color: ${props => props.selected ? '#f0f8ff' : 'white'};
  box-shadow: ${props => props.selected ? '0 0 10px rgba(0,162,239,0.5)' : 'none'};
  cursor: pointer;
  transition: all 0.3s ease;
`;

const PaymentDescription = styled.p`
  font-size: 0.9em;
  color: #363331;
  margin-top: 5px;
`;

const CancellationPolicy = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const PolicyItem = styled.li`
  margin-bottom: 10px;
  color: #363331;
  &::before {
    content: '●';
    color: #363331;
    display: inline-block;
    width: 1em;
    margin-left: -1em;
    font-size: 1.2em;
  }
`;

export default function PaymentAndPolicy() {
  const [paymentMethod, setPaymentMethod] = useState('credit');

  return (
    <>
      <SectionContainer>
        <SectionTitle>お支払い方法</SectionTitle>
        <PaymentOption 
          selected={paymentMethod === 'credit'} 
          onClick={() => setPaymentMethod('credit')}
        >
          <input
            type="radio"
            id="credit"
            name="payment"
            value="credit"
            checked={paymentMethod === 'credit'}
            onChange={() => setPaymentMethod('credit')}
          />
          <label htmlFor="credit">クレジットカードでのオンライン決済</label>
          <PaymentDescription>
            こちらのお支払い方法は、株式会社タイムデザインとの手配旅行契約、クレジットカードによる事前決済となります。
            お客様の個人情報をホテペイの運営会社である株式会社タイムデザインに提供いたします。
          </PaymentDescription>
          <Image src="/images/card_5brand.webp" alt="Credit Card Brands" width={200} height={40} />
        </PaymentOption>
        <PaymentOption 
          selected={paymentMethod === 'onsite'} 
          onClick={() => setPaymentMethod('onsite')}
        >
          <input
            type="radio"
            id="onsite"
            name="payment"
            value="onsite"
            checked={paymentMethod === 'onsite'}
            onChange={() => setPaymentMethod('onsite')}
          />
          <label htmlFor="onsite">現地決済</label>
          <PaymentDescription>
            当日、現地にてご精算ください。
          </PaymentDescription>
        </PaymentOption>
      </SectionContainer>

      <SectionContainer>
        <SectionTitle>キャンセルポリシー</SectionTitle>
        <CancellationPolicy>
        <PolicyItem>宿泊日から30日前〜 宿泊料金（食事・オプション等含）の50%</PolicyItem>
          <PolicyItem>宿泊日から7日前〜 宿泊料金（食事・オプション等含）の100%</PolicyItem>
        </CancellationPolicy>
      </SectionContainer>
    </>
  );
}