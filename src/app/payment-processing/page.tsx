"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/app/types/supabase';

// Supabaseクライアントの初期化
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function PaymentProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [reservationId, setReservationId] = useState<number | null>(null);

  const reservationNumber = searchParams.get('reservationNumber');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!reservationNumber || !email) {
      console.error('Missing reservation parameters');
      setStatus('error');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        console.log('Checking payment status for:', { reservationNumber, email });

        // 決済完了処理APIを呼び出し
        const response = await fetch('/api/complete-payment-reservation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reservationNumber,
            email
          }),
        });

        const result = await response.json();
        console.log('Payment completion API response:', result);

        if (response.ok && result.success) {
          console.log('Payment confirmed, redirecting to completion page');
          setReservationId(result.reservationId);
          setStatus('success');
          
          // 少し待ってから予約完了ページにリダイレクト
          setTimeout(() => {
            router.push(`/reservation-complete?reservationId=${result.reservationId}`);
          }, 2000);
          
        } else if (result.processing) {
          console.log('Payment still processing, will retry...');
          // まだ決済処理中の場合、少し待ってから再チェック
          setTimeout(checkPaymentStatus, 3000);
          
        } else {
          console.error('Payment completion failed:', result.error);
          setStatus('error');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
      }
    };

    // 初回チェック
    checkPaymentStatus();

    // 30秒後にタイムアウト
    const timeout = setTimeout(() => {
      console.warn('Payment processing timeout');
      setStatus('error');
    }, 30000);

    return () => clearTimeout(timeout);
  }, [reservationNumber, email, router]);

  if (!reservationNumber || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-6">予約情報が不足しています。</p>
          <button
            onClick={() => router.push('/reservation')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            予約ページに戻る
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">決済処理エラー</h1>
          <p className="text-gray-600 mb-6">
            決済処理中にエラーが発生しました。<br />
            お手数ですが、お電話でお問い合わせください。
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/reservation')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              予約ページに戻る
            </button>
            <p className="text-sm text-gray-500">
              お問い合わせ: 0123-456-7890
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">決済完了</h1>
          <p className="text-gray-600 mb-6">
            決済が正常に完了いたしました。<br />
            予約完了ページに移動します...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Processing状態
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-blue-600 mb-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">決済処理中</h1>
        <p className="text-gray-600 mb-6">
          決済処理を行っています。<br />
          しばらくお待ちください...
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>ご注意:</strong> このページを閉じたり、ブラウザの戻るボタンを押さないでください。
          </p>
        </div>
        
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            予約番号: {reservationNumber}
          </p>
        </div>
      </div>
    </div>
  );
}

// ローディング用コンポーネント
function PaymentProcessingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-blue-600 mb-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">読み込み中</h1>
        <p className="text-gray-600">決済情報を確認しています...</p>
      </div>
    </div>
  );
}

export default function PaymentProcessingPage() {
  return (
    <Suspense fallback={<PaymentProcessingFallback />}>
      <PaymentProcessingContent />
    </Suspense>
  );
} 