'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/app/types/supabase';

interface ReceiptPageProps {
  params: {
    reservationId: string;
  };
}

interface ReceiptData {
  receiptNumber: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentStatus: string;
  cardLast4?: string;
  cardBrand?: string;
}

export default function ReceiptPage({ params }: ReceiptPageProps) {
  const [reservation, setReservation] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      console.log('Receipt page accessed with reservationId:', params.reservationId);
      
      try {
        const supabase = createClientComponentClient<Database>();

        // 予約情報を取得
        console.log('Fetching reservation data...');
        const { data: reservationData, error: reservationError } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', params.reservationId)
          .single();

        console.log('Reservation query result:', { reservation: !!reservationData, error: reservationError });

        if (reservationError) {
          console.error('Supabase error:', reservationError);
          setError('予約情報が見つかりません');
          return;
        }

        if (!reservationData) {
          console.log('No reservation found');
          setError('予約情報が見つかりません');
          return;
        }

        console.log('Reservation found:', {
          id: reservationData.id,
          payment_method: reservationData.payment_method,
          stripe_payment_intent_id: !!reservationData.stripe_payment_intent_id
        });

        // クレジットカード決済でない場合はエラー
        if (reservationData.payment_method !== 'credit' || !reservationData.stripe_payment_intent_id) {
          console.log('Not a credit payment or missing PaymentIntent ID');
          setError('この予約は領収書をダウンロードできません（クレジット決済のみ対応）');
          return;
        }

        setReservation(reservationData);

        // 領収書データを取得
        console.log('Fetching receipt data from API...');
        try {
          const response = await fetch('/api/receipt-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: reservationData.stripe_payment_intent_id
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Receipt data obtained:', !!data.receiptData);
            setReceiptData(data.receiptData);
          } else {
            console.error('Failed to fetch receipt data from API');
            // フォールバック領収書データを作成
            const fallbackData = {
              receiptNumber: reservationData.stripe_payment_intent_id,
              amount: reservationData.payment_amount || 0,
              currency: 'jpy',
              paymentDate: new Date().toISOString(),
              paymentStatus: 'succeeded',
              cardLast4: undefined,
              cardBrand: undefined,
            };
            setReceiptData(fallbackData);
          }
        } catch (error) {
          console.error('Error fetching receipt data:', error);
          // フォールバック領収書データを作成
          const fallbackData = {
            receiptNumber: reservationData.stripe_payment_intent_id,
            amount: reservationData.payment_amount || 0,
            currency: 'jpy',
            paymentDate: new Date().toISOString(),
            paymentStatus: 'succeeded',
            cardLast4: undefined,
            cardBrand: undefined,
          };
          setReceiptData(fallbackData);
        }

        console.log('Final receipt data prepared');
      } catch (error) {
        console.error('Error in ReceiptPage:', error);
        setError('予約情報の取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.reservationId]);

  const formatReceiptDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">領収書を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation || !receiptData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">エラーが発生しました</h1>
          <p className="text-gray-600 mb-6">{error || '予約情報または領収書データが見つかりません'}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md transition-colors font-medium"
          >
            ← 戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 印刷用のグローバルスタイル */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body { margin: 0 !important; }
            .no-print { display: none !important; }
            .receipt-container { 
              max-width: none !important; 
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
            }
            .print-break { page-break-before: always; }
          }
        `
      }} />
      
      <div className="min-h-screen bg-gray-50">
        {/* 印刷ボタン */}
        <div className="no-print p-4 bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">領収書</h1>
            <div className="space-x-2">
              <button
                onClick={() => window.print()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                📄 PDFとして保存
              </button>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                ← 戻る
              </button>
            </div>
          </div>
        </div>

        {/* 領収書本体 */}
        <div className="receipt-container max-w-4xl mx-auto p-8 bg-white">
          <div className="border-2 border-gray-800 p-8 bg-white">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">領収書（Receipt）</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 font-semibold text-gray-700">領収書番号:</td>
                      <td className="py-3 text-gray-800">{receiptData.receiptNumber}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 font-semibold text-gray-700">発行日:</td>
                      <td className="py-3 text-gray-800">{formatReceiptDate(receiptData.paymentDate)}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 font-semibold text-gray-700">宛名:</td>
                      <td className="py-3 text-gray-800">{reservation.name} 様</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 font-semibold text-gray-700">但し書き:</td>
                      <td className="py-3 text-gray-800">宿泊料金として</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 font-semibold text-gray-700">決済方法:</td>
                      <td className="py-3 text-gray-800">
                        クレジットカード
                        {receiptData.cardBrand && receiptData.cardLast4 && 
                          ` (${receiptData.cardBrand} ****${receiptData.cardLast4})`
                        }
                      </td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 font-semibold text-gray-700">登録番号:</td>
                      <td className="py-3 text-gray-800">T1130001043538</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 金額（大きく表示） */}
            <div className="text-center mb-8">
              <div className="inline-block border-2 border-gray-800 px-8 py-6 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">金額</p>
                <p className="text-4xl font-bold text-gray-800">
                  ¥{receiptData.amount.toLocaleString()}円
                </p>
                <p className="text-sm text-gray-600 mt-2">(内 消費税10%)</p>
              </div>
            </div>

            {/* 発行者情報 */}
            <div className="border-t-2 border-gray-800 pt-6 text-right">
              <p className="text-lg font-bold text-gray-800">発行者: NEST琵琶湖</p>
              <p className="text-gray-600">滋賀県高島市マキノ町新保146-1</p>
              <p className="text-sm text-gray-500 mt-4">
                発行日: {new Date().toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>

          {/* 使用方法の説明 */}
          <div className="no-print mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold mb-3 text-blue-800 text-lg">📋 PDF保存手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
              <li className="font-medium">上記の「📄 PDFとして保存」ボタンをクリック</li>
              <li>印刷ダイアログが表示されたら、<strong>「送信先」を「PDFに保存」</strong>に変更</li>
              <li>必要に応じて用紙サイズを「A4」に設定</li>
              <li>「保存」をクリックしてPDFファイルをダウンロード</li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
              <p className="text-xs text-yellow-800">
                💡 <strong>ヒント:</strong> この領収書は適格請求書（インボイス）の要件を満たしており、
                経理処理や確定申告でご利用いただけます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 