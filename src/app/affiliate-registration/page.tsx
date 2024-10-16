// src/app/affiliate-registration/page.tsx

'use client';

import React, { useState } from 'react';
import Layout from '@/app/components/common/Layout';
import { supabase } from '@/lib/supabaseClient';

export default function AffiliateRegistrationPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    accountInfo: '',
    promotionMedium: '',
    promotionURL: '',
  });
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const generateCouponCode = () => {
    // 仮のクーポンコード生成ロジック
    const code =
      'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase();
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // クーポンコードを生成
    const coupon = generateCouponCode();

    try {
      // トランザクションの開始
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            account_info: formData.accountInfo,
            promotion_medium: formData.promotionMedium,
            promotion_url: formData.promotionURL,
            coupon_code: coupon,
          },
        ])
        .select();

      if (affiliateError) {
        console.error('Error inserting affiliate:', affiliateError);
        setErrorMessage('登録に失敗しました。再度お試しください。');
        return;
      }

      const affiliateId = affiliateData ? affiliateData[0].id : null;

      // クーポンデータをSupabaseに保存
      const { error: couponError } = await supabase.from('coupons').insert([
        {
          coupon_code: coupon,
          affiliate_id: affiliateId,
          discount_rate: 5.0, // 一律5%の割引率
        },
      ]);

      if (couponError) {
        console.error('Error inserting coupon:', couponError);
        setErrorMessage('クーポンの登録に失敗しました。サポートにお問い合わせください。');
        return;
      }

      setCouponCode(coupon);
    } catch (error) {
      console.error('Unexpected error:', error);
      setErrorMessage('システムエラーが発生しました。再度お試しください。');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 pt-8 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-center">
            アフィリエイト登録
          </h1>
          {!couponCode ? (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg shadow-md p-6 space-y-4"
            >
              {errorMessage && (
                <div className="text-red-500 text-center">{errorMessage}</div>
              )}
              <div>
                <label className="block font-medium mb-1">氏名</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">メールアドレス</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">電話番号</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  報酬受け取り用口座
                </label>
                <textarea
                  name="accountInfo"
                  value={formData.accountInfo}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                ></textarea>
              </div>
              <div>
                <label className="block font-medium mb-1">宣伝媒体</label>
                <input
                  type="text"
                  name="promotionMedium"
                  value={formData.promotionMedium}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">宣伝媒体URL</label>
                <input
                  type="url"
                  name="promotionURL"
                  value={formData.promotionURL}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600"
              >
                登録
              </button>
            </form>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h2 className="text-xl font-bold mb-4">登録が完了しました！</h2>
              <p>あなたのクーポンコードは：</p>
              <p className="text-2xl font-bold mt-2">{couponCode}</p>
              <p className="mt-4">
                このコードを使ってユーザーに紹介してください。
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
