'use client';

import { useState } from 'react';
import CustomButton from "@/app/components/ui/CustomButton";
import Input from "@/app/components/ui/Input";
import CustomCard from "@/app/components/ui/CustomCard";
import { ChevronRight, Mail, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/app/types/supabase';

export default function LoginPage() {
  const supabase = createClientComponentClient<Database>();
  const [reservationNumber, setReservationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('*')
        .eq('reservation_number', reservationNumber)
        .eq('email', email)
        .single();

      if (reservationError || !reservation) {
        throw new Error('予約番号またはメールアドレスが正しくありません');
      }

      localStorage.setItem('reservationNumber', reservationNumber);
      localStorage.setItem('email', email);
      router.push('/booking-confirmation');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">予約確認・変更・キャンセル</h1>
        <p className="text-gray-600">予約内容の確認・変更やキャンセルはこちらから行えます</p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <CustomCard className="border-t-4 border-t-[#00A2EF] shadow-lg">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center mb-1">
                      <Key className="w-5 h-5 text-gray-500 mr-2" />
                      <label className="block text-sm font-medium text-gray-700">予約番号</label>
                    </div>
                    <Input
                      type="text"
                      className="w-full bg-gray-50 border-gray-300 focus:border-[#00A2EF] focus:ring-[#00A2EF] placeholder-shown:text-gray-400"
                      value={reservationNumber}
                      onChange={(e) => setReservationNumber(e.target.value)}
                      placeholder="予約番号を入力"
                      data-full-placeholder="予約時に発行された番号をご入力ください"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center mb-1">
                      <Mail className="w-5 h-5 text-gray-500 mr-2" />
                      <label className="block text-sm font-medium text-gray-700">予約時のメールアドレス</label>
                    </div>
                    <Input
                      type="email"
                      className="w-full bg-gray-50 border-gray-300 focus:border-[#00A2EF] focus:ring-[#00A2EF] placeholder-shown:text-gray-400"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="メールアドレスを入力"
                      data-full-placeholder="予約時にご登録いただいたメールアドレス"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center space-y-4">
                  <CustomButton
                    type="submit"
                    className="w-full sm:w-auto bg-[#00A2EF] hover:bg-[#0091d6] text-white px-12 py-3 flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ログイン中...
                      </div>
                    ) : (
                      <>
                        ログインして予約を確認
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </CustomButton>
                </div>
              </form>
            </div>
          </CustomCard>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>予約番号がわからない場合は、予約時に送信されたメールをご確認ください。</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 640px) {
          input::placeholder {
            content: attr(data-full-placeholder);
          }
        }
      `}</style>
    </>
  );
}
