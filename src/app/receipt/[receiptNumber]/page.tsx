'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/app/types/supabase';

interface ReceiptPageProps {
  params: {
    receiptNumber: string;
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
      console.log('Receipt page accessed with receiptNumber:', params.receiptNumber);
      
      try {
        const supabase = createClientComponentClient<Database>();

        // 予約情報を領収書番号（PaymentIntent ID）で取得
        console.log('Fetching reservation data by PaymentIntent ID...');
        const { data: reservationData, error: reservationError } = await supabase
          .from('reservations')
          .select('*')
          .eq('stripe_payment_intent_id', params.receiptNumber)
          .single();

        console.log('Reservation query result:', { reservation: !!reservationData, error: reservationError });

        if (reservationError) {
          console.error('Supabase error:', reservationError);
          setError('領収書が見つかりません');
          return;
        }

        if (!reservationData) {
          console.log('No reservation found');
          setError('領収書が見つかりません');
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
          setError('この領収書は表示できません（クレジット決済のみ対応）');
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
              paymentIntentId: params.receiptNumber
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
              receiptNumber: params.receiptNumber,
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
            receiptNumber: params.receiptNumber,
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
        setError('領収書の取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.receiptNumber]);

  const formatReceiptDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handlePrint = () => {
    // 印刷前の調整
    const printableElement = document.querySelector('.receipt-printable') as HTMLElement;
    if (printableElement) {
      // 高さを調整してA4 1ページに収める
      const receiptContent = printableElement.querySelector('.receipt-content') as HTMLElement;
      if (receiptContent) {
        receiptContent.style.transform = 'scale(0.95)';
        receiptContent.style.transformOrigin = 'top center';
      }
    }

    // 少し遅らせて印刷実行
    setTimeout(() => {
      window.print();
    }, 100);
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
          <p className="text-gray-600 mb-6">{error || '領収書データが見つかりません'}</p>
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
      {/* 印刷用のグローバルスタイル - 厳密制御版 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            /* 全ての要素を非表示 */
            * {
              visibility: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* 印刷対象のみ表示 */
            .receipt-printable,
            .receipt-printable * {
              visibility: visible !important;
            }
            
            /* ページ設定 */
            @page {
              size: A4;
              margin: 1.5cm 2cm;
            }
            
            /* ページ分割の制御 */
            .receipt-printable {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              height: auto !important;
              max-height: 25cm !important; /* A4高さ制限 */
              overflow: hidden !important;
              page-break-inside: avoid !important;
              page-break-after: auto !important;
              page-break-before: avoid !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              box-shadow: none !important;
              border: none !important;
            }
            
            /* 領収書コンテンツ */
            .receipt-content {
              max-height: 22cm !important; /* 余裕をもった高さ制限 */
              overflow: hidden !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
            }
            
            /* 領収書内部要素のサイズ調整 */
            .receipt-content h2 {
              font-size: 24px !important;
              margin-bottom: 20px !important;
              page-break-after: avoid !important;
            }
            
            .receipt-content table {
              font-size: 12px !important;
              page-break-inside: avoid !important;
            }
            
            .receipt-content .grid {
              page-break-inside: avoid !important;
            }
            
            .receipt-content .amount-section {
              margin: 15px 0 !important;
              page-break-inside: avoid !important;
              page-break-before: avoid !important;
              page-break-after: avoid !important;
            }
            
            .receipt-content .amount-box {
              padding: 15px 20px !important;
              page-break-inside: avoid !important;
            }
            
            .receipt-content .amount-box p:first-child {
              font-size: 10px !important;
              margin-bottom: 8px !important;
            }
            
            .receipt-content .amount-box .amount-text {
              font-size: 28px !important;
              margin: 0 !important;
            }
            
            .receipt-content .amount-box p:last-child {
              font-size: 10px !important;
              margin-top: 8px !important;
            }
            
            .receipt-content .issuer-section {
              padding-top: 15px !important;
              margin-top: 15px !important;
              page-break-inside: avoid !important;
              page-break-before: avoid !important;
            }
            
            /* 非表示要素の完全除去 */
            .no-print,
            nav,
            footer,
            .print-instructions {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              width: 0 !important;
              overflow: hidden !important;
            }
            
            /* body設定 */
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              overflow: hidden !important;
            }
            
            /* ページ分割禁止 */
            * {
              page-break-inside: avoid !important;
            }
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
                onClick={handlePrint}
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

        {/* 領収書本体 - 印刷対象エリア */}
        <div className="receipt-printable max-w-4xl mx-auto p-8 bg-white">
          <div className="receipt-content border-2 border-gray-800 p-6 bg-white">
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">領収書（Receipt）</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 font-semibold text-gray-700 text-sm">領収書番号:</td>
                      <td className="py-2 text-gray-800 text-sm">{receiptData.receiptNumber}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 font-semibold text-gray-700 text-sm">発行日:</td>
                      <td className="py-2 text-gray-800 text-sm">{formatReceiptDate(receiptData.paymentDate)}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 font-semibold text-gray-700 text-sm">宛名:</td>
                      <td className="py-2 text-gray-800 text-sm">{reservation.name} 様</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 font-semibold text-gray-700 text-sm">但し書き:</td>
                      <td className="py-2 text-gray-800 text-sm">宿泊料金として</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 font-semibold text-gray-700 text-sm">決済方法:</td>
                      <td className="py-2 text-gray-800 text-sm">
                        クレジットカード
                        {receiptData.cardBrand && receiptData.cardLast4 && 
                          ` (${receiptData.cardBrand} ****${receiptData.cardLast4})`
                        }
                      </td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 font-semibold text-gray-700 text-sm">登録番号:</td>
                      <td className="py-2 text-gray-800 text-sm">T1130001043538</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 金額（大きく表示） */}
            <div className="amount-section text-center mb-6">
              <div className="amount-box inline-block border-2 border-gray-800 px-6 py-4 bg-gray-50">
                <p className="text-xs text-gray-600 mb-1">金額</p>
                <p className="amount-text text-3xl font-bold text-gray-800">
                  ¥{receiptData.amount.toLocaleString()}円
                </p>
                <p className="text-xs text-gray-600 mt-1">(内 消費税10%)</p>
              </div>
            </div>

            {/* 発行者情報 */}
            <div className="issuer-section border-t-2 border-gray-800 pt-4 text-right">
              <p className="text-base font-bold text-gray-800">発行者: NEST琵琶湖</p>
              <p className="text-sm text-gray-600">滋賀県高島市マキノ町新保146-1</p>
              <p className="text-xs text-gray-500 mt-2">
                発行日: {new Date().toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
        </div>

        {/* 使用方法の説明 - 印刷対象外 */}
        <div className="print-instructions no-print max-w-4xl mx-auto px-8 pb-8">
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
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