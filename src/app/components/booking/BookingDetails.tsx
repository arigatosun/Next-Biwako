'use client';

import { useState } from 'react';
import CustomButton from '@/app/components/ui/CustomButton';
import CustomCard, { CustomCardContent } from '@/app/components/ui/CustomCard';
import { Mail } from 'lucide-react';

interface InfoTableProps {
  data: { label: string; value: string }[];
}

export default function BookingDetails() {
  const resendConfirmationEmail = () => {
    console.log('予約内容確認メールを再送信しました');
  };

  return (
    <CustomCard>
      <CustomCardContent>
        <div className="space-y-5 text-[#363331]">
          <div className="flex justify-between items-center mb-4">
            <p className="text-base font-semibold">＜予約内容の確認ができます＞</p>
            <div className="bg-[#333333] rounded-lg p-2">
              <CustomButton
                variant="primary"
                onClick={resendConfirmationEmail}
                className="text-white text-sm flex items-center"
              >
                <Mail className="mr-2 h-4 w-4" />
                予約内容確認のメールの再送信
              </CustomButton>
            </div>
          </div>

          <Section title="キャンセルポリシー">
            <ul className="list-disc pl-5 text-center">
              <li>宿泊日から30日前〜　宿泊料金（食事・オプション含む）の５０％</li>
              <li>宿泊日から7日前〜　宿泊料金（食事・オプション含む）の１００％</li>
            </ul>
          </Section>

          <Section title="予約情報">
            <div className="space-y-4">
              <SubSection title="予約番号" content="000" />
              <SubSection title="予約受付日時" content="2024.10.21(月) 10:00:20" />
              <SubSection title="お支払い方法" content="現地決済" />
            </div>
          </Section>

          <Section title="プラン情報">
            <div className="space-y-4">
              <SubSection title="プラン" content="【一棟貸切】贅沢選びつくしヴィラプラン" />
              <SubSection title="宿泊日" content="2024年10月21日(月)" />
              <SubSection title="棟数" content="2棟" />
              <SubSection title="食事プラン" content="Plan.A 贅沢素材のディナーセット" />
            </div>
          </Section>

          <Section title="お見積もり内容">
            <EstimateTable />
          </Section>

          <Section title="予約者情報">
            <InfoTable
              data={[
                { label: '氏名', value: '記載内容が入ります。' },
                { label: '氏名（ふりがな）', value: '記載内容が入ります。' },
                { label: 'メールアドレス', value: '記載内容が入ります。' },
                { label: '性別', value: '記載内容が入ります。' },
                { label: '生年月日', value: '記載内容が入ります。' },
                { label: '電話番号', value: '記載内容が入ります。' },
                { label: '郵便番号', value: '記載内容が入ります。' },
                { label: '都道府県', value: '記載内容が入ります。' },
                { label: '市区町村/番地', value: '記載内容が入ります。' },
                { label: '建物名・アパート名など', value: '記載内容が入ります。' },
              ]}
            />
          </Section>
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

function InfoTable({ data }: InfoTableProps) {
  return (
    <table className="w-full">
      <tbody>
        {data.map((item, index) => (
          <tr key={index} className="border-b last:border-b-0">
            <td className="py-2 w-[30%] font-bold">{item.label}</td>
            <td className="py-2 w-[70%]">{item.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EstimateTable() {
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
              &lt;1棟目&gt; 2024年10月21日(月)〜
            </td>
          </tr>
          <tr>
            <td className="p-2 border">【一棟貸切】贅沢選びつくしヴィラプラン</td>
            <td className="p-2 border">男性</td>
            <td className="p-2 border">3</td>
            <td className="text-right p-2 border">68,000円</td>
          </tr>
          <tr>
            <td colSpan={4} className="font-bold p-2 border bg-gray-50">
              &lt;2棟目&gt; 2024年10月21日(月)〜
            </td>
          </tr>
          <tr>
            <td className="p-2 border">【一棟貸切】贅沢選びつくしヴィラプラン</td>
            <td className="p-2 border">女性</td>
            <td className="p-2 border">3</td>
            <td className="text-right p-2 border">68,000円</td>
          </tr>
          <tr>
            <td className="p-2 border">【一棟貸切】贅沢選びつくしヴィラプラン</td>
            <td className="p-2 border">小学生以下（添い寝）</td>
            <td className="p-2 border">2</td>
            <td className="text-right p-2 border">0円</td>
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
          <tr>
            <td className="p-2 border">Plan.A 贅沢素材のディナーセット</td>
            <td className="p-2 border"></td>
            <td className="p-2 border">2</td>
            <td className="text-right p-2 border">13,000円</td>
          </tr>
          <tr>
            <td className="p-2 border">Plan.B お肉づくし！豪華BBQセット</td>
            <td className="p-2 border"></td>
            <td className="p-2 border">3</td>
            <td className="text-right p-2 border">19,000円</td>
          </tr>
          <tr>
            <td className="p-2 border">大満足！よくばりおすそわけセット</td>
            <td className="p-2 border"></td>
            <td className="p-2 border">2</td>
            <td className="text-right p-2 border">6,000円</td>
          </tr>
          <tr>
            <td className="p-2 border">食事なし</td>
            <td className="p-2 border"></td>
            <td className="p-2 border">1</td>
            <td className="text-right p-2 border">0円</td>
          </tr>
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
            <td className="text-right p-2 border">174,500円</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}