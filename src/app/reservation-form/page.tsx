'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import PlanAndEstimateInfo from '@/app/components/reservation-form/PlanAndEstimateInfo';
import PaymentAndPolicy from '@/app/components/reservation-form/PaymentAndPolicy';
import PersonalInfoForm, { PersonalInfoFormData } from '@/app/components/reservation-form/PersonalInfoForm';
import { useReservation } from '@/app/contexts/ReservationContext';
import { FoodPlan } from '@/app/types/food-plan';
import { format } from 'date-fns';

/** 
 * 例としてフードプランを定義 
 * （元々のコードがあればそちらを維持）
 */
const foodPlans: FoodPlan[] = [
  { id: 'no-meal', name: '食事なし', price: 0 },
  { id: 'plan-a', name: 'plan.A 贅沢素材のディナーセット', price: 6500 },
  { id: 'plan-b', name: 'plan.B お肉づくし！豪華BBQセット', price: 6500 },
  { id: 'plan-c', name: '大満足！よくばりお子さまセット', price: 3000 },
];

/**
 * 全角→半角に変換し、数字以外をすべて除去したうえで文字列を返す関数。
 * スマホ入力で "/", "１月" などが混ざっていても "11" のように変換する。
 */
function toHalfWidthDigitsOnly(str: string): string {
  // 全角英数を半角に変換
  let half = str.replace(/[！-～]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  // 追加で必要に応じて
  half = half.replace(/―/g, '-');
  half = half.replace(/　/g, ' ');

  // 数字以外を全部削除
  half = half.replace(/\D/g, '');

  return half;
}

const ReservationFormPage: React.FC = () => {
  const router = useRouter();
  const { state, dispatch } = useReservation();

  // 個人情報ステップは 4 としているとのこと
  const [currentStep, setCurrentStep] = useState(4);

  // 合計金額を状態管理
  const [totalAmount, setTotalAmount] = useState(state.totalPrice);

  // personalInfo は ReservationContext の state から初期値を取る
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoFormData | null>(state.personalInfo);

  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // バリデーションエラーの配列
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    try {
      setTotalAmount(state.totalPrice);

      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } catch (err) {
      console.error('Error initializing reservation form:', err);
      setError('予約フォームの初期化中にエラーが発生しました。');
    }
  }, [state.totalPrice]);

  // ステップバーのクリック時の遷移ハンドリング
  const handleStepClick = (step: number) => {
    switch (step) {
      case 1:
        router.push('/reservation');
        break;
      case 2:
        router.push('/guest-selection');
        break;
      case 3:
        router.push('/food-plan');
        break;
      case 4:
        // 現在のページ
        break;
      case 5:
        // 予約完了ページは送信後に行く想定
        router.push('/reservation-complete');
        break;
      default:
        break;
    }
  };

  // クーポン適用時の割引処理
  const handleCouponApplied = (discount: number) => {
    const newTotalAmount = Math.max(totalAmount - discount, 0);
    setTotalAmount(newTotalAmount);
    dispatch({ type: 'SET_TOTAL_PRICE', payload: newTotalAmount });
    dispatch({ type: 'SET_DISCOUNT_AMOUNT', payload: discount });
  };

  // 個人情報フォームで入力変更があったら更新
  const handlePersonalInfoChange = (data: PersonalInfoFormData) => {
    setPersonalInfo(data);
    dispatch({ type: 'SET_PERSONAL_INFO', payload: data });
  };

  /**
   * バリデーション関数
   * 生年月日についても、PC・携帯問わず数値化してからチェックするよう修正。
   */
  const validatePersonalInfo = useCallback((): boolean => {
    const errors: string[] = [];

    if (!personalInfo) {
      errors.push('個人情報を入力してください。');
    } else {
      // 姓・名
      if (!personalInfo.lastName) errors.push('姓を入力してください。');
      if (!personalInfo.firstName) errors.push('名を入力してください。');

      // ふりがな
      if (!personalInfo.lastNameKana) errors.push('姓（ふりがな）を入力してください。');
      if (!personalInfo.firstNameKana) errors.push('名（ふりがな）を入力してください。');

      // メール
      if (!personalInfo.email) {
        errors.push('メールアドレスを入力してください。');
      } else if (personalInfo.email !== personalInfo.emailConfirm) {
        errors.push('メールアドレスが一致しません。');
      }

      // 性別
      if (!personalInfo.gender) errors.push('性別を選択してください。');

      // 生年月日
      if (!personalInfo.birthYear || !personalInfo.birthMonth || !personalInfo.birthDay) {
        errors.push('生年月日を入力してください。');
      } else {
        // ▼ ここで携帯対策: 全角→半角数字、不要文字削除、ゼロ埋め
        const yearStr = toHalfWidthDigitsOnly(personalInfo.birthYear).padStart(4, '0');
        const monthStr = toHalfWidthDigitsOnly(personalInfo.birthMonth).padStart(2, '0');
        const dayStr = toHalfWidthDigitsOnly(personalInfo.birthDay).padStart(2, '0');

        const y = Number(yearStr);
        const m = Number(monthStr) - 1; // 0始まり
        const d = Number(dayStr);

        const birthDate = new Date(y, m, d);
        if (isNaN(birthDate.getTime())) {
          errors.push('生年月日が無効です。');
        }
      }

      // 電話
      if (!personalInfo.phone) errors.push('電話番号を入力してください。');

      // 住所関連
      if (!personalInfo.postalCode) errors.push('郵便番号を入力してください。');
      if (!personalInfo.prefecture) errors.push('都道府県を選択してください。');
      if (!personalInfo.address) errors.push('市区町村／番地を入力してください。');

      // 交通手段
      if (!personalInfo.transportation) errors.push('当日の交通手段を選択してください。');

      // チェックイン予定時間
      if (!personalInfo.checkInTime) errors.push('チェックインの予定時間を選択してください。');

      // 過去の宿泊経験
      if (!personalInfo.pastStay) errors.push('過去のご宿泊経験を選択してください。');

      // 利用目的
      if (!personalInfo.purpose) errors.push('ご利用目的を選択してください。');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [personalInfo]);

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">エラー:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <ReservationProcess currentStep={currentStep} onStepClick={handleStepClick} />

      <div className="bg-white rounded-2xl shadow-md p-4 sm:p-8 mt-6 sm:mt-8 space-y-8">
        <PlanAndEstimateInfo />

        {/* 個人情報フォーム */}
        <PersonalInfoForm
          onDataChange={handlePersonalInfoChange}
          isMobile={isMobile}
          initialData={personalInfo}
        />

        {/* バリデーションエラーメッセージ */}
        {validationErrors.length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <ul className="list-disc list-inside">
              {validationErrors.map((errMsg, index) => (
                <li key={index}>{errMsg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* お支払い方法とポリシー */}
        <PaymentAndPolicy
          totalAmount={totalAmount}
          onCouponApplied={handleCouponApplied}
          personalInfo={personalInfo}
          isMobile={isMobile}
          validatePersonalInfo={validatePersonalInfo} // ここで呼び出される
        />
      </div>
    </>
  );
};

export default ReservationFormPage;
