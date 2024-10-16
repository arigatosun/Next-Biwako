// src/app/affiliate-registration/page.tsx

'use client';

import React, { useState } from 'react';
import Layout from '@/app/components/common/Layout';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation'; // 追加

export default function AffiliateRegistrationPage() {
  const router = useRouter(); // 追加

  const [formData, setFormData] = useState({
    nameKanji: '',
    nameKana: '',
    email: '',
    phone: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    accountHolderName: '',
    promotionMediums: [] as string[],
    promotionURLs: {} as { [key: string]: string },
  });
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const promotionOptions = [
    { label: 'Instagram', value: 'instagram' },
    { label: 'X', value: 'x' },
    { label: 'TikTok', value: 'tiktok' },
    { label: 'YouTube', value: 'youtube' },
    { label: 'Webサイト', value: 'website' },
    { label: 'その他', value: 'other' },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMediumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setFormData((prev) => {
      const promotionMediums = checked
        ? [...prev.promotionMediums, value]
        : prev.promotionMediums.filter((medium) => medium !== value);

      // Mediumが未選択になった場合、対応するURLを削除
      const promotionURLs = { ...prev.promotionURLs };
      if (!checked) {
        delete promotionURLs[value];
      }

      return {
        ...prev,
        promotionMediums,
        promotionURLs,
      };
    });
  };

  const handleURLChange = (medium: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      promotionURLs: {
        ...prev.promotionURLs,
        [medium]: value,
      },
    }));
  };

  const generateAffiliateCode = () => {
    const code = 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase();
    return code;
  };

  const generateCouponCode = () => {
    const code = 'COUPON' + Math.random().toString(36).substring(2, 8).toUpperCase();
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // アフィリエイトコードとクーポンコードを生成
    const newAffiliateCode = generateAffiliateCode();
    const coupon = generateCouponCode();

    try {
      // 宣伝媒体の配列を作成
      const promotionMediumsArray = formData.promotionMediums;
      const promotionURLsArray = promotionMediumsArray.map(
        (medium) => formData.promotionURLs[medium] || ''
      );

      // 配列の長さが一致しているか確認
      if (promotionMediumsArray.length !== promotionURLsArray.length) {
        setErrorMessage('宣伝媒体とURLの数が一致しません。');
        return;
      }

      // アフィリエイト情報を挿入
      const { error: affiliateError } = await supabase.from('affiliates').insert([
        {
          affiliate_code: newAffiliateCode,
          name_kanji: formData.nameKanji,
          name_kana: formData.nameKana,
          email: formData.email,
          phone: formData.phone,
          bank_name: formData.bankName,
          branch_name: formData.branchName,
          account_number: formData.accountNumber,
          account_holder_name: formData.accountHolderName,
          coupon_code: coupon,
          promotion_mediums: promotionMediumsArray,
          promotion_urls: promotionURLsArray,
        },
      ]);

      if (affiliateError) {
        console.error('Error inserting affiliate:', affiliateError);
        setErrorMessage('登録に失敗しました。再度お試しください。');
        return;
      }

      // クーポンデータを挿入
      const { error: couponError } = await supabase.from('coupons').insert([
        {
          coupon_code: coupon,
          affiliate_code: newAffiliateCode, // affiliate_code を使用
          discount_rate: 5.0, // 一律5%の割引率
        },
      ]);

      if (couponError) {
        console.error('Error inserting coupon:', couponError);
        setErrorMessage('クーポンの登録に失敗しました。サポートにお問い合わせください。');
        return;
      }

      setAffiliateCode(newAffiliateCode);
      setCouponCode(coupon);
    } catch (error) {
      console.error('Unexpected error:', error);
      setErrorMessage('システムエラーが発生しました。再度お試しください。');
    }
  };

  // ログインページへ遷移する関数
  const navigateToLogin = () => {
    router.push('/affiliate/login');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 pt-8 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-center">アフィリエイト登録</h1>
          {!affiliateCode ? (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg shadow-md p-6 space-y-4"
            >
              {errorMessage && (
                <div className="text-red-500 text-center">{errorMessage}</div>
              )}
              {/* 氏名（漢字） */}
              <div>
                <label className="block font-medium mb-1">氏名（漢字）</label>
                <input
                  type="text"
                  name="nameKanji"
                  value={formData.nameKanji}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              {/* 氏名（カナ） */}
              <div>
                <label className="block font-medium mb-1">氏名（カナ）</label>
                <input
                  type="text"
                  name="nameKana"
                  value={formData.nameKana}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              {/* メールアドレス */}
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
              {/* 電話番号 */}
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
              {/* 銀行情報 */}
              <div>
                <label className="block font-medium mb-1">銀行名</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">支店名</label>
                <input
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">口座番号</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">名義人</label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              {/* 宣伝媒体 */}
              <div>
                <label className="block font-medium mb-1">宣伝媒体</label>
                <div className="flex flex-wrap">
                  {promotionOptions.map((option) => (
                    <div key={option.value} className="mr-4 mb-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="promotionMediums"
                          value={option.value}
                          checked={formData.promotionMediums.includes(option.value)}
                          onChange={handleMediumChange}
                          className="form-checkbox"
                        />
                        <span className="ml-2">{option.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              {/* 宣伝媒体URL */}
              {formData.promotionMediums.length > 0 && (
                <div>
                  <label className="block font-medium mb-1">宣伝媒体情報</label>
                  {formData.promotionMediums.map((medium) => (
                    <div key={medium} className="mb-2">
                      <label className="block font-medium mb-1">
                        {promotionOptions.find((opt) => opt.value === medium)?.label}
                      </label>
                      <input
                        type="url"
                        name={`promotionURL_${medium}`}
                        value={formData.promotionURLs[medium] || ''}
                        onChange={(e) => handleURLChange(medium, e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
                  ))}
                </div>
              )}
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
              <p>あなたのIDは：</p>
              <p className="text-2xl font-bold mt-2">{affiliateCode}</p>
              <p>あなたのクーポンコードは：</p>
              <p className="text-2xl font-bold mt-2">{couponCode}</p>
              <p className="mt-4">このコードを使ってユーザーに紹介してください。</p>
              {/* ログインボタンを追加 */}
              <button
                onClick={navigateToLogin}
                className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                ログイン
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
