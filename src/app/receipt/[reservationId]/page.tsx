import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/app/types/supabase';
import { createReceiptDataFromStripe } from '@/utils/email';
import { notFound } from 'next/navigation';

interface ReceiptPageProps {
  params: {
    reservationId: string;
  };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // 予約情報を取得
  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', params.reservationId)
    .single();

  if (error || !reservation) {
    notFound();
  }

  // クレジットカード決済でない場合は404
  if (reservation.payment_method !== 'credit' || !reservation.stripe_payment_intent_id) {
    notFound();
  }

  // 領収書データを取得
  let receiptData = null;
  try {
    receiptData = await createReceiptDataFromStripe(reservation.stripe_payment_intent_id);
  } catch (error) {
    console.error('Error fetching receipt data:', error);
  }

  // 領収書データがない場合は基本データを作成
  if (!receiptData) {
    receiptData = {
      receiptNumber: reservation.stripe_payment_intent_id,
      amount: reservation.payment_amount || 0,
      currency: 'jpy',
      paymentDate: new Date().toISOString(),
      paymentStatus: 'succeeded',
      cardLast4: undefined,
      cardBrand: undefined,
    };
  }

  const formatReceiptDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

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