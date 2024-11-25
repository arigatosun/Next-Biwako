// src/app/affiliate/affiliate-registration/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script';


export default function AffiliateRegistrationPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    nameKanji: '',
    nameKana: '',
    email: '',
    phone: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    accountHolderName: '',
    accountType: '普通',
    promotionMediums: [] as string[],
    promotionInfo: {} as { [key: string]: string },
  })
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const promotionOptions = [
    { label: 'Instagram', value: 'instagram' },
    { label: 'X', value: 'x' },
    { label: 'TikTok', value: 'tiktok' },
    { label: 'YouTube', value: 'youtube' },
    { label: 'Webサイト', value: 'website' },
    { label: 'その他', value: 'other' },
  ]

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMediumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setFormData((prev) => {
      const promotionMediums = checked
        ? [...prev.promotionMediums, value]
        : prev.promotionMediums.filter((medium) => medium !== value)
      const promotionInfo = { ...prev.promotionInfo }
      if (!checked) {
        delete promotionInfo[value]
      }
      return { ...prev, promotionMediums, promotionInfo }
    })
  }

  const handleInfoChange = (medium: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      promotionInfo: { ...prev.promotionInfo, [medium]: value },
    }))
  }

  const generateAffiliateCode = () => {
    return 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const generateCouponCode = () => {
    return 'COUPON' + Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const newAffiliateCode = generateAffiliateCode()
    const coupon = generateCouponCode()

    try {
      const promotionMediumsArray = formData.promotionMediums
      const promotionInfoArray = promotionMediumsArray.map(
        (medium) => formData.promotionInfo[medium] || ''
      )

      if (promotionMediumsArray.length !== promotionInfoArray.length) {
        setErrorMessage('宣伝媒体と情報の数が一致しません。')
        setIsSubmitting(false)
        return
      }

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
          account_type: formData.accountType,
          coupon_code: coupon,
          promotion_mediums: promotionMediumsArray,
          promotion_info: promotionInfoArray,
        },
      ])

      if (affiliateError) {
        console.error('Error inserting affiliate:', affiliateError)
        setErrorMessage(`登録に失敗しました。エラー: ${affiliateError.message}`)
        setIsSubmitting(false)
        return
      }

      const { error: couponError } = await supabase.from('coupons').insert([
        {
          coupon_code: coupon,
          affiliate_code: newAffiliateCode,
          discount_rate: 5.0,
        },
      ])

      if (couponError) {
        console.error('Error inserting coupon:', couponError)
        setErrorMessage('クーポンの登録に失敗しました。サポートにお問い合わせください。')
        setIsSubmitting(false)
        return
      }

      // APIリクエストで送信するデータを作成
      const affiliateData = {
        nameKanji: formData.nameKanji,
        nameKana: formData.nameKana,
        email: formData.email,
        phone: formData.phone,
        bankName: formData.bankName,
        branchName: formData.branchName,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        accountType: formData.accountType,
        promotionMediums: promotionMediumsArray,
        promotionInfo: promotionInfoArray,
        affiliateCode: newAffiliateCode,
        couponCode: coupon,
      }

      const response = await fetch('/api/sendAffiliateEmails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(affiliateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error sending emails:', errorData)
        setErrorMessage('メールの送信に失敗しました。サポートにお問い合わせください。')
        setIsSubmitting(false)
        return
      }

      setAffiliateCode(newAffiliateCode)
      setCouponCode(coupon)
    } catch (error) {
      console.error('Unexpected error:', error)
      setErrorMessage('システムエラーが発生しました。再度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const navigateToLogin = () => {
    router.push('/affiliate/login')
  }

  useEffect(() => {
    // LINEボタンの初期化
    if (typeof window !== 'undefined' && window.LineIt) {
      window.LineIt.loadButton();
    }
  }, []);

  return (

      <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <motion.h1 
              className="text-3xl font-bold mb-2 text-center text-gray-800"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              NEST琵琶湖アフィリエイト登録
            </motion.h1>
            <motion.p 
              className="text-sm text-gray-600 mb-4 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              報酬のお支払いは宿泊日の翌月末のお支払いになります。例えば予約日が1月の場合は2月末に報酬をお振込みいたします。
            </motion.p>
            <motion.p 
              className="text-sm text-gray-600 mb-8 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              詳しくは登録後にinfo.nest.biwako@gmail.comからメールが届きますので確認してください。
            </motion.p>
            {!affiliateCode ? (
              <motion.form 
                onSubmit={handleSubmit} 
                className="bg-white rounded-xl shadow-lg p-8 space-y-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {errorMessage && (
                  <div className="text-red-500 text-center bg-red-100 p-3 rounded-lg">{errorMessage}</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium mb-1 text-gray-700">氏名（漢字）</label>
                    <input
                      type="text"
                      name="nameKanji"
                      value={formData.nameKanji}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="例：山田太郎"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-gray-700">氏名（カナ）</label>
                    <input
                      type="text"
                      name="nameKana"
                      value={formData.nameKana}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="例：ヤマダタロウ"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-gray-700">メールアドレス</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="例：example@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-gray-700">電話番号(ハイフン無しで入力してください)</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="例：0312345678"
                      required
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">報酬支払情報</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-medium mb-1 text-gray-700">銀行名</label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="例：○○銀行"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1 text-gray-700">支店名</label>
                      <input
                        type="text"
                        name="branchName"
                        value={formData.branchName}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="例：○○支店"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1 text-gray-700">口座番号</label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="例：1234567"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1 text-gray-700">名義人</label>
                      <input
                        type="text"
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="例：ヤマダタロウ"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block font-medium mb-2 text-gray-700">口座タイプ</label>
                    <div className="flex items-center space-x-6">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="accountType"
                          value="普通"
                          checked={formData.accountType === '普通'}
                          onChange={handleChange}
                          className="form-radio text-blue-500 focus:ring-blue-500"
                          required
                        />
                        <span className="ml-2 text-gray-700">普通</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="accountType"
                          value="当座"
                          checked={formData.accountType === '当座'}
                          onChange={handleChange}
                          className="form-radio text-blue-500 focus:ring-blue-500"
                          required
                        />
                        <span className="ml-2 text-gray-700">当座</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">宣伝媒体情報</h2>
                  <div className="flex flex-wrap mb-4">
                    {promotionOptions.map((option) => (
                      <div key={option.value} className="mr-6 mb-2">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            name="promotionMediums"
                            value={option.value}
                            checked={formData.promotionMediums.includes(option.value)}
                            onChange={handleMediumChange}
                            className="form-checkbox text-blue-500 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-gray-700">{option.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.promotionMediums.length > 0 && (
                    <div className="space-y-4">
                      {formData.promotionMediums.map((medium) => (
                        <div key={medium}>
                          <label className="block font-medium mb-1 text-gray-700">
                            {promotionOptions.find((opt) => opt.value === medium)?.label}の情報
                          </label>
                          <textarea
                            name={`promotionInfo_${medium}`}
                            value={formData.promotionInfo[medium] || ''}
                            onChange={(e) => handleInfoChange(medium, e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            rows={2}
                            placeholder={`${promotionOptions.find((opt) => opt.value === medium)?.label}に関するURLやアカウント名などの情報を入力してください`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  登録後クーポンコードが発行されます。このクーポンコードを使用してユーザーに紹介してください。
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? '登録中...' : '登録'}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                className="bg-white rounded-xl shadow-lg p-8 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-800">登録が完了しました！</h2>
                <p className="text-sm text-gray-600 mb-6">
                  登録時に設定したメールアドレスにメールが届いています。ご確認ください。
                </p>
                <p className="text-gray-600 mb-2">あなたのIDは：</p>
                <p className="text-3xl font-bold mb-4 text-blue-600">{affiliateCode}</p>
                <p className="text-gray-600 mb-2">あなたのクーポンコードは：</p>
                <p className="text-3xl font-bold mb-6 text-green-600">{couponCode}</p>
                <p className="text-gray-600 mb-6">このクーポンコードをあなた固有のクーポンコードです。</p>
                <p className="text-gray-600 mb-6">予約者がこのクーポンコードを入力して予約を行うとあなたに報酬が発生します。</p>
                <p className="text-sm text-gray-600 mb-3">
                 ダッシュボードにてクーポンコードや報酬状況が確認できます。
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  ログインにはIDとメールアドレスが必要になります。
                </p>
                <button
                  onClick={navigateToLogin}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  ダッシュボードログイン
                </button>
              </motion.div>
            )}
          </div>
        </main>

      
    </div>
  )
}
