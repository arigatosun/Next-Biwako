'use client';

import { useState, useEffect } from 'react';
import CustomButton from '@/app/components/ui/CustomButton';
import CustomCard, { CustomCardContent } from '@/app/components/ui/CustomCard';
import { Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Reservation } from '@/app/types/supabase';

export default function BookingCancel() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [cancellationFee, setCancellationFee] = useState<number | null>(null);
  const { refreshToken } = useAuth();

  useEffect(() => {
    fetchReservation();
  }, []);

  const fetchReservation = async () => {
    try {
      let token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const response = await fetch('/api/reservations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        token = await refreshToken();
        const newResponse = await fetch('/api/reservations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!newResponse.ok) {
          throw new Error('Failed to fetch reservation after token refresh');
        }
        const data = await newResponse.json();
        setReservation(data);
      } else if (!response.ok) {
        throw new Error('Failed to fetch reservation');
      } else {
        const data = await response.json();
        setReservation(data);
      }
    } catch (error) {
      setError('予約情報の取得に失敗しました。');
      console.error('Error fetching reservation:', error);
    }
  };

  const handleCancelReservation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let token = localStorage.getItem('authToken');

      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const response = await fetch('/api/cancel-reservation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        token = await refreshToken();
        const newResponse = await fetch('/api/cancel-reservation', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!newResponse.ok) {
          throw new Error('Failed to cancel reservation after token refresh');
        }
        const data = await newResponse.json();
        setCancellationFee(data.cancellationFee);
      } else if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel reservation');
      } else {
        const data = await response.json();
        setCancellationFee(data.cancellationFee);
      }

      setIsCancelled(true);
      console.log('予約をキャンセルしました');
    } catch (error) {
      setError('予約のキャンセルに失敗しました。');
      console.error('Error cancelling reservation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!reservation) {
    return <div>Loading...</div>;
  }

  return (
    <CustomCard>
      <CustomCardContent>
        <div className="space-y-5 text-[#363331]">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">＜予約をキャンセルできます＞</h2>
            <p className="text-red-500">まだ予約のキャンセルは成立しておりません</p>
          </div>

          <Section title="キャンセル料">
            {isCancelled ? (
              <p className="text-center font-bold">
                キャンセル料: {cancellationFee?.toLocaleString()}円
              </p>
            ) : (
              <p className="text-center font-bold">現在のキャンセル料は計算中です</p>
            )}
          </Section>

          <Section title="キャンセル時の注意項目（キャンセルポリシー）">
            <ul className="list-disc pl-5">
              <li>宿泊日から30日前〜　宿泊料金（食事・オプション含む）の５０％</li>
              <li>宿泊日から7日前〜　宿泊料金（食事・オプション含む）の１００％</li>
              {reservation.payment_method === 'credit' && (
                <li className="text-red-500 font-semibold">
                  クレジットカード決済の場合、宿泊日の30日前よりも前のキャンセルでも、
                  予約総額の3.6%のキャンセル手数料が発生します。
                </li>
              )}
            </ul>
          </Section>

          <Section title="予約情報">
            <div className="grid grid-cols-2 gap-4">
              <SubSection title="予約番号" content={reservation.reservation_number} />
              <SubSection title="予約受付日時" content={new Date(reservation.created_at).toLocaleString('ja-JP')} />
              <SubSection 
                title="お支払い方法" 
                content={reservation.payment_method === 'credit' ? 'クレジットカード' : '現地決済'} 
              />
            </div>
            {reservation.payment_method === 'credit' && (
              <p className="mt-4 text-sm text-red-500">
                ※クレジットカード決済を選択されているため、30日前よりも前のキャンセルでも
                3.6%のキャンセル手数料が発生する可能性があります。
              </p>
            )}
          </Section>


          <Section title="プラン情報">
            <div className="grid grid-cols-2 gap-4">
              <SubSection title="プラン" content="【一棟貸切】贅沢選びつくしヴィラプラン" />
              <SubSection title="宿泊日" content={new Date(reservation.check_in_date).toLocaleDateString('ja-JP')} />
              <SubSection title="棟数" content={`${reservation.num_units}棟`} />
            </div>
          </Section>

          <Section title="お見積もり内容">
            <EstimateTable reservation={reservation} />
          </Section>

          <div className="text-center">
  {isCancelled ? (
    <p className="text-green-500 font-bold">予約がキャンセルされました。</p>
  ) : (
    <>
      <CustomButton
        onClick={handleCancelReservation}
        disabled={isLoading}
        className="bg-blue-500 text-white px-10 py-3 rounded-full text-lg font-bold hover:bg-blue-600 transition-colors"
      >
        {isLoading ? 'キャンセル中...' : '予約をキャンセルする'}
      </CustomButton>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <p className="text-red-500 mt-2">※キャンセルの取り消しはできません。</p>
      {reservation.payment_method === 'credit' && (
        <p className="text-red-500 mt-2 text-sm">
          ※クレジットカード決済を選択されているため、30日前よりも前のキャンセルでも
          3.6%のキャンセル手数料が発生する可能性があります。
        </p>
      )}
    </>
  )}
</div>
        </div>
      </CustomCardContent>
    </CustomCard>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="bg-[#333333] text-white p-2 text-lg font-bold text-center">{title}</h3>
      <div className="bg-white p-4">{children}</div>
    </div>
  );
}

function SubSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="flex items-center">
      <div className="bg-gray-200 p-2 w-1/3 text-center rounded">{title}</div>
      <div className="ml-4 w-2/3">{content}</div>
    </div>
  );
}

function EstimateTable({ reservation }: { reservation: Reservation }) {
  const getPlanName = (planId: string) => {
    switch (planId) {
      case 'plan-a':
        return 'Plan A 贅沢素材のディナーセット';
      case 'plan-b':
        return 'Plan B お肉づくし！豪華BBQセット';
      case 'plan-c':
        return '大満足！よくばりお子さまセット';
      default:
        return '不明なプラン';
    }
  };

  return (
    <div className="space-y-4">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">プラン</th>
            <th className="text-left p-2 border">タイプ</th>
            <th className="text-left p-2 border">人数</th>
            <th className="text-right p-2 border">金額</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4} className="font-bold p-2 border bg-gray-50">
              &lt;宿泊料金&gt; {new Date(reservation.check_in_date).toLocaleDateString('ja-JP')}〜
            </td>
          </tr>
          <tr>
            <td className="p-2 border">【一棟貸切】贅沢選びつくしヴィラプラン</td>
            <td className="p-2 border">宿泊料金</td>
            <td className="p-2 border">{reservation.total_guests}</td>
            <td className="text-right p-2 border">{reservation.room_rate.toLocaleString()}円</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">プラン</th>
            <th className="text-left p-2 border">タイプ</th>
            <th className="text-left p-2 border">人数</th>
            <th className="text-right p-2 border">金額</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4} className="font-bold p-2 border bg-gray-50">
              &lt;食事プラン&gt;
            </td>
          </tr>
          {reservation.meal_plans && Object.entries(reservation.meal_plans).length > 0 ? (
            Object.entries(reservation.meal_plans).map(([planId, plan]: [string, any], index) => (
              <tr key={index}>
                <td className="p-2 border">
                  {getPlanName(planId)}
                  {plan.menuSelections && (
                    <ul className="list-disc pl-5 text-sm">
                      {Object.entries(plan.menuSelections).map(([category, items]: [string, any], idx) => (
                        <li key={idx}>
                          {category}:
                          <ul className="list-circle pl-5">
                            {Object.entries(items).map(([item, count]: [string, any], itemIdx) => (
                              <li key={itemIdx}>{item} x {count}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="p-2 border">{plan.count || 0}</td>
                <td className="text-right p-2 border">
                  {typeof reservation.total_meal_price === 'number' 
                    ? `${reservation.total_meal_price.toLocaleString()}円` 
                    : '価格未定'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="p-2 border text-center">食事プランなし</td>
            </tr>
          )}
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td colSpan={2} className="p-2 border">消費税</td>
            <td className="p-2 border"></td>
            <td className="text-right p-2 border">込み</td>
          </tr>
          <tr>
            <td colSpan={2} className="p-2 border">サービス料</td>
            <td className="p-2 border"></td>
            <td className="text-right p-2 border">込み</td>
          </tr>
          <tr className="font-bold text-lg bg-gray-100">
            <td colSpan={2} className="p-2 border">合計金額</td>
            <td className="p-2 border"></td>
            <td className="text-right p-2 border">{reservation.total_amount.toLocaleString()}円</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}