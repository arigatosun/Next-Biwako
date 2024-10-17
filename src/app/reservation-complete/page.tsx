'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronUp } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import Layout from '@/app/components/common/Layout';
import { Reservation } from '@/app/types/supabase';

export default function ReservationCompletionPage() {
  const [email, setEmail] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const reservationId = searchParams ? searchParams.get('reservationId') : null;

  console.log('Reservation ID from URL:', reservationId);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchReservation = async () => {
      console.log('Fetching reservation for ID:', reservationId);
      if (!reservationId) {
        setLoading(false);
        setError('予約IDが指定されていません。');
        return;
      }
    
      try {
        const response = await fetch(`/api/reservations?reservationId=${reservationId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched reservation data:', data);
        setReservation(data);
      } catch (error) {
        console.error('Error fetching reservation:', error);
        setError(error instanceof Error ? error.message : '予約情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId]);

  const handleStepClick = () => {
    // Implement step navigation logic here
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
          reservation_number: reservation?.reservation_number,
          email: email 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend confirmation email');
      }

      alert('予約確認メールを再送信しました。');
    } catch (error) {
      console.error('Error resending confirmation email:', error);
      alert('メールの再送信に失敗しました。もう一度お試しください。');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!reservation) return <div>予約が見つかりません。予約番号をご確認ください。</div>;

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="flex-grow overflow-y-auto">
          <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-8 max-w-6xl">
            <div className="space-y-6">
              <ReservationProcess 
                currentStep={5}
                onStepClick={handleStepClick}
              />

              <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-500 mb-6 sm:mb-8">予約完了</h1>

                <div className="flex justify-center mb-6 sm:mb-8">
                  <Image src="/images/header/Frame 3.webp" alt="NEST BIWAKO" width={isMobile ? 150 : 200} height={isMobile ? 45 : 60} />
                </div>

                <div className="text-center mb-6 sm:mb-8">
                  <p className="font-bold mb-2 sm:mb-4 text-[#363331]">ご予約ありがとうございます</p>
                  <p className="mb-2 text-sm sm:text-base text-[#363331]">お客様へ予約内容を記載したメールを送信いたしましたので、ご確認ください。</p>
                  <p className="text-sm sm:text-base text-[#363331]">メールが届かない場合は<a href="#" className="text-blue-500 underline">こちら</a>をご確認ください。</p>
                </div>

                <div className="mb-6 sm:mb-8">
                  <p className="text-xs sm:text-sm text-[#363331] mb-1 sm:mb-2">以下の「予約番号」は予約内容の確認・変更・キャンセルに必要です。</p>
                  <p className="text-xs sm:text-sm text-[#363331]">忘れないようにご注意ください。</p>
                </div>

                <table className="w-full mb-6 sm:mb-8">
                  <tbody>
                    <tr className="bg-gray-100">
                      <td className="py-2 px-4 font-bold text-xs sm:text-sm text-[#363331]">施設名</td>
                      <td className="py-2 px-4 text-xs sm:text-sm text-[#363331]">NEST琵琶湖</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-bold text-xs sm:text-sm text-[#363331]">予約番号</td>
                      <td className="py-2 px-4 text-xs sm:text-sm text-[#363331]">{reservation.reservation_number}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="bg-gray-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                  <div className="bg-gray-800 text-white py-2 px-4 mb-4 rounded-t-lg">
                    <h2 className="text-base sm:text-lg font-bold text-center">予約内容の確認方法</h2>
                  </div>

                  <p className="font-bold mb-4 text-sm sm:text-base text-[#363331]">●予約内容は以下【1】または【2】の方法でご確認できます。</p>
                  <div className="mb-6">
                    <p className="font-bold mb-2 text-sm sm:text-base text-[#363331]">【1】予約の確認ページにログイン</p>
                    <p className="text-xs sm:text-sm mb-2 text-[#363331]">・「予約番号」とお客様の「メールアドレス(ご予約のメールアドレス)」でログインして、</p>
                    <p className="text-xs sm:text-sm mb-2 text-[#363331]">予約内容を確認（・変更・キャンセル）できます。</p>
                    <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-xs sm:text-sm">
                      予約確認・変更・キャンセル
                    </button>
                  </div>
                  <div>
                    <p className="font-bold mb-2 text-sm sm:text-base text-[#363331]">【2】予約内容確認メール</p>
                    <p className="text-xs sm:text-sm mb-2 text-[#363331]">・お客様の「メールアドレス(ご予約のメールアドレス)」に予約内容を記載した「予約内容確認メール」を再度お送りします。</p>
                    <p className="text-xs sm:text-sm mb-2 text-[#363331]">「予約内容確認メール」は別のメールアドレスにあることもできます。</p>
                    <p className="text-xs sm:text-sm mb-4 text-[#363331]">送りたいメールアドレスを入力し「再送信」ボタンをクリックしてください。</p>
                    <div className="flex items-center mb-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="abcdef@gmail.com"
                        className="border rounded-md px-3 py-2 mr-2 flex-grow text-xs sm:text-sm"
                      />
                      <button 
                        onClick={resendConfirmationEmail}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-xs sm:text-sm"
                      >
                        再送信
                      </button>
                    </div>
                    <p className="text-2xs sm:text-xs text-[#363331] leading-relaxed">
                    [再送信]を行っても[予約内容確認メール]が届いていない場合、[迷惑メールフォルダ]に振り分けられていないかご確認ください。また、携帯電話・PHS・スマートフォンのメールアドレスをご利用の場合、
                    メール受信環境の設定（ドメイン指定などの受信制限、迷惑メール対策設定）をご確認ください。[受信設定（※）]で「info.nest.biwako@gmail.com」
                    から送付されるメールの受け取りを「許可」していただかないとメールが届かないことがあります。（※）携帯キャリア（docomo・au・SoftBankなど）が提供している「お客様が受信可能なメールを制限する」設定です。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button className="fixed bottom-8 right-8 bg-gray-800 text-white p-3 rounded-full shadow-lg">
        <ChevronUp size={24} />
      </button>
    </Layout>
  );
}