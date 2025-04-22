'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronUp } from 'lucide-react';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import { Reservation } from '@/app/types/supabase';
import { useRouter } from 'next/navigation';

interface ReservationCompletionContentProps {
  reservation: Reservation;
}

export default function ReservationCompletionContent({ reservation }: ReservationCompletionContentProps) {
  const [email, setEmail] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const emailSentRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // クレジットカード決済成功時のメール送信処理
  useEffect(() => {
    const sendConfirmationEmailForCreditCard = async () => {
      // クレジットカード決済の場合 かつ まだメール送信されていない場合のみ処理
      if (reservation.payment_method === 'credit' && !emailSentRef.current) {
        try {
          // 送信処理を開始する前にフラグを立てる
          emailSentRef.current = true;
          console.log('Attempting to send confirmation email for credit card payment...');
          const response = await fetch('/api/send-reservation-success-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reservationId: reservation.id,
            }),
          });

          if (!response.ok) {
            console.error('Failed to send confirmation email:', await response.text());
            // エラーが発生した場合、フラグをリセットして再試行を許可することも検討できますが、
            // まずは一度だけ送信するロジックに留めます。
            // emailSentRef.current = false; 
          } else {
            console.log('Confirmation email sent successfully');
          }
        } catch (error) {
          console.error('Error sending confirmation email:', error);
          // エラー発生時のフラグ管理
          // emailSentRef.current = false;
        }
      }
    };

    sendConfirmationEmailForCreditCard();
  // reservation が変更されたときにのみ実行されるように依存配列を維持
  }, [reservation]);

  const handleStepClick = () => {
    // ステップナビゲーションのロジックをここに実装
  };

  const resendConfirmationEmail = async () => {
    if (!email) {
      alert('メールアドレスを入力してください。');
      return;
    }
  
    try {
      const response = await fetch('/api/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation_number: reservation.reservation_number,
          email: email,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend confirmation email');
      }
  
      alert('予約確認メールを再送信しました。');
    } catch (error) {
      console.error('Error resending confirmation email:', error);
      alert('メールの再送信に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="space-y-6">
      <ReservationProcess currentStep={5} onStepClick={handleStepClick} />

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-500 mb-6 sm:mb-8">予約完了</h1>

        <div className="flex justify-center mb-6 sm:mb-8">
          <Image
            src="/images/header/Frame 3.webp"
            alt="NEST BIWAKO"
            width={isMobile ? 150 : 200}
            height={isMobile ? 45 : 60}
          />
        </div>

              <div className="text-center mb-6 sm:mb-8">
                <p className="font-bold mb-2 sm:mb-4 text-[#363331]">ご予約ありがとうございます</p>
                <p className="mb-2 text-sm sm:text-base text-[#363331]">
                  お客様へ予約内容を記載したメールを送信いたしましたので、ご確認ください。
                </p>

              </div>

              {/* 予約情報カード */}
              <div className="flex justify-center w-full mb-6 sm:mb-8">
                <div className="w-full sm:w-[600px] bg-white rounded-lg shadow-sm">
                  {/* 施設名セクション */}
                  <div className="p-4 sm:p-6 border-b border-gray-100">
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-gray-500 text-sm sm:text-base">ご予約施設</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                        NEST琵琶湖
                      </h3>
                    </div>
                  </div>
                  
                  {/* 予約番号セクション */}
                  <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-blue-100">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex items-center justify-center space-x-2">
                        <p className="text-gray-600 text-sm sm:text-base">予約番号</p>
                        <div className="flex items-center justify-center bg-blue-600 text-white rounded-full w-5 h-5 text-xs">
                          !
                        </div>
                      </div>
                      <div className="bg-white px-6 py-3 rounded-lg shadow-sm border border-blue-200">
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600 tracking-wider">
                          {reservation.reservation_number}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 text-center max-w-md">
                        ※ この予約番号は予約内容の確認・変更・キャンセルに必要です
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <div className="bg-gray-800 text-white py-2 px-4 mb-4 rounded-t-lg">
                  <h2 className="text-base sm:text-lg font-bold text-center">予約内容の確認方法</h2>
                </div>

                <p className="font-bold mb-4 text-sm sm:text-base text-[#363331]">
                  ●予約内容は以下【1】または【2】の方法でご確認できます。
                </p>
                <div className="mb-6">
                  <p className="font-bold mb-2 text-sm sm:text-base text-[#363331]">
                    【1】予約の確認ページにログイン
                  </p>
                  <p className="text-xs sm:text-sm mb-2 text-[#363331]">
                    ・「予約番号」とお客様の「メールアドレス(ご予約のメールアドレス)」でログインして、
                  </p>
                  <p className="text-xs sm:text-sm mb-2 text-[#363331]">
                    予約内容を確認（・変更・キャンセル）できます。
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-xs sm:text-sm"
                  >
                    予約確認・変更・キャンセル
                  </button>
                </div>
                <div>
                  <p className="font-bold mb-2 text-sm sm:text-base text-[#363331]">
                    【2】予約内容確認メール
                  </p>
                  <p className="text-xs sm:text-sm mb-2 text-[#363331]">
                    ・お客様の「メールアドレス(ご予約のメールアドレス)」に予約内容を記載した「予約内容確認メール」を再度お送りします。
                  </p>
                  <p className="text-xs sm:text-sm mb-2 text-[#363331]">
                    「予約内容確認メール」は別のメールアドレスに送ることもできます。
                  </p>
                  <p className="text-xs sm:text-sm mb-4 text-[#363331]">
                    送りたいメールアドレスを入力し「再送信」ボタンをクリックしてください。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="例: abcdef@gmail.com"
                      className="border rounded-md px-3 py-2 w-full sm:flex-1 text-xs sm:text-sm"
                    />
                    <button
                      onClick={resendConfirmationEmail}
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap w-full sm:w-auto"
                    >
                      再送信
                    </button>
                  </div>
                  <p className="text-[10px] sm:text-xs text-[#363331] leading-relaxed">
                    [再送信]を行っても[予約内容確認メール]が届いていない場合、[迷惑メールフォルダ]に振り分けられていないかご確認ください。また、携帯電話・PHS・スマートフォンのメールアドレスをご利用の場合、
                    メール受信環境の設定（ドメイン指定などの受信制限、迷惑メール対策設定）をご確認ください。[受信設定（※）]で当施設から送付されるメールの受け取りを「許可」していただかないとメールが届かないことがあります。
                    （※）携帯キャリア（docomo・au・SoftBankなど）が提供している「お客様が受信可能なメールを制限する」設定です。
                  </p>
                </div>
              </div>
            </div>
          </div>
    
  );
}