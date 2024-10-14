import React, { useState } from 'react';
import Image from 'next/image';

interface Coupon {
    code: string;
    discount: number;
    description: string;
  }

  interface PaymentAndPolicyProps {
    totalAmount: number;
    onCouponApplied: (discount: number) => void;
  }

  export default function PaymentAndPolicy({ totalAmount, onCouponApplied }: PaymentAndPolicyProps) {
    const [paymentMethod, setPaymentMethod] = useState('credit');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

    const applyCoupon = () => {
        // Mock coupon data
        const mockCoupons: { [key: string]: Coupon } = {
          'SUMMER10': { code: 'SUMMER10', discount: 0.1, description: '10% OFF夏季割引' },
          'WELCOME20': { code: 'WELCOME20', discount: 0.2, description: '20% OFFウェルカム割引' },
        };
    
        const coupon = mockCoupons[couponCode];
        if (coupon) {
          setAppliedCoupon(coupon);
          onCouponApplied(coupon.discount * totalAmount);
        } else {
          alert('無効なクーポンコードです。');
        }
        setCouponCode('');
      };

      
  return (
    <>
      <div className="mb-8">
        <h3 className="bg-gray-800 text-white py-3 text-center text-lg font-bold rounded-md mb-4">
          お支払い方法
        </h3>
        <div
          className={`border-2 ${
            paymentMethod === 'credit' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-300'
          } rounded-md p-4 mb-4 cursor-pointer transition-all duration-300`}
          onClick={() => setPaymentMethod('credit')}
        >
          <div className="flex items-center">
            <input
              type="radio"
              id="credit"
              name="payment"
              value="credit"
              checked={paymentMethod === 'credit'}
              onChange={() => setPaymentMethod('credit')}
              className="mr-2"
            />
            <label htmlFor="credit" className="font-medium text-gray-600">クレジットカードでのオンライン決済</label>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            こちらのお支払い方法は、株式会社タイムデザインとの手配旅行契約、クレジットカードによる事前決済となります。
            お客様の個人情報をホテペイの運営会社である株式会社タイムデザインに提供いたします。
          </p>
          <Image src="/images/card_5brand.webp" alt="Credit Card Brands" width={200} height={40} className="mt-2" />
        </div>
        <div
          className={`border-2 ${
            paymentMethod === 'onsite' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-300'
          } rounded-md p-4 mb-4 cursor-pointer transition-all duration-300`}
          onClick={() => setPaymentMethod('onsite')}
        >
          <div className="flex items-center">
            <input
              type="radio"
              id="onsite"
              name="payment"
              value="onsite"
              checked={paymentMethod === 'onsite'}
              onChange={() => setPaymentMethod('onsite')}
              className="mr-2"
            />
            <label htmlFor="onsite" className="font-medium text-gray-600">現地決済</label>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            当日、現地にてご精算ください。
          </p>
        </div>
      </div>

      {/* Coupon Code Section */}
      <div className="mt-7 mb-6 border-2 border-gray-300 rounded-md p-4">
          <h4 className="font-medium text-gray-600 mb-2">クーポンコード</h4>
          <div className="flex">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="クーポンコードを入力"
              className="flex-grow border rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={applyCoupon}
              className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition duration-300"
            >
              適用
            </button>
          </div>
          {appliedCoupon && (
            <div className="mt-2 text-sm text-green-600">
              適用済みクーポン: {appliedCoupon.description}
            </div>
          )}
        </div>
 
      <div className="mb-8">
        <h3 className="bg-gray-800 text-white py-4 text-center text-lg font-bold rounded-md mb-4">
          キャンセルポリシー
        </h3>
        <ul className="list-none pl-1">
          <li className="mb-2 text-gray-700 relative pl-6">
            <span className="absolute left-0 top-0 text-gray-500">●</span>
            宿泊日から30日前〜 宿泊料金（食事・オプション等含）の50%
          </li>
          <li className="mb-2 text-gray-700 relative pl-6">
            <span className="absolute left-0 top-0 text-gray-500">●</span>
            宿泊日から7日前〜 宿泊料金（食事・オプション等含）の100%
          </li>
        </ul>
      </div>
    </>
  );
}