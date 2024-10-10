"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';

export default function Component() {
  const [email, setEmail] = useState('');

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto pt-8 pb-16 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2 text-sm text-gray-500">
              <span className="font-bold">①宿泊日選択</span>
              <ChevronRight size={20} />
              <span className="font-bold">②予約内容確認</span>
              <ChevronRight size={20} />
              <span className="font-bold">③個人情報入力</span>
              <ChevronRight size={20} />
              <span className="font-bold text-black">④予約完了</span>
            </div>
          </div>
          <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm flex items-center">
            <ChevronLeft size={16} className="mr-1" />
            戻に戻る
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center text-blue-500 mb-8">予約完了</h1>

          <div className="flex justify-center mb-8">
            <Image src="/placeholder.svg?height=60&width=200" alt="NEST BIWAKO" width={200} height={60} />
          </div>

          <div className="text-center mb-8">
            <p className="font-bold mb-4">ご予約ありがとうございます</p>
            <p className="mb-2">お客様へ予約内容を記載したメールを送信いたしましたので、ご確認ください。</p>
            <p>メールが届かない場合は<a href="#" className="text-blue-500 underline">こちら</a>をご確認ください。</p>
          </div>

          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-2">以下の「予約番号」は予約内容の確認・変更・キャンセルに必要です。</p>
            <p className="text-sm text-gray-600">忘れないようにご注意ください。</p>
          </div>

          <table className="w-full mb-8">
            <tbody>
              <tr className="bg-gray-100">
                <td className="py-2 px-4 font-bold">施設名</td>
                <td className="py-2 px-4">NEST琵琶湖</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-bold">予約番号</td>
                <td className="py-2 px-4">000</td>
              </tr>
            </tbody>
          </table>

          <div className="bg-gray-200 rounded-lg p-6 mb-8">
            <div className="bg-gray-800 text-white py-2 px-4 mb-4 rounded-t-lg">
              <h2 className="text-lg font-bold text-center">予約内容の確認方法</h2>
            </div>

            <p className="font-bold mb-4">●予約内容は以下【1】または【2】の方法でご確認できます。</p>
            <div className="mb-6">
              <p className="font-bold mb-2">【1】予約の確認ページにログイン</p>
              <p className="text-sm mb-2">・「予約番号」とお客様の「メールアドレス(ご予約のメールアドレス)」でログインして、</p>
              <p className="text-sm mb-2">予約内容を確認（・変更・キャンセル）できます。</p>
              <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm">
                予約確認・変更・キャンセル
              </button>
            </div>
            <div>
              <p className="font-bold mb-2">【2】予約内容確認メール</p>
              <p className="text-sm mb-2">・お客様の「メールアドレス(ご予約のメールアドレス)」に予約内容を記載した「予約内容確認メール」を再度お送りします。</p>
              <p className="text-sm mb-2">「予約内容確認メール」は別のメールアドレスにあることもできます。</p>
              <p className="text-sm mb-4">送りたいメールアドレスを入力し「再送信」ボタンをクリックしてください。</p>
              <div className="flex items-center mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="abcdef@gmail.com"
                  className="border rounded-md px-3 py-2 mr-2 flex-grow"
                />
                <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm">
                  再送信
                </button>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                「再送信」を行っても「予約内容確認メール」が届いていない場合、[迷惑メールフォルダ]に振り分けられていないかご確認くださ
                い。また、携帯電話・PHS・スマートフォンのメールアドレスをご利用の場合、メール受信拒否の設定（ドメイン指定などの受
                信制限、迷惑メール対策設定）をご確認ください。【携帯電話（@）】で【info.nest.biwako@gmail.com】からメールを受け取れ
                るように設定してください。なお、一部のキャリア（docomo・au・SoftBankなど）が提供している「お客様が受信可能なメールを制限する」設定です。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm inline-flex items-center">
            <ChevronLeft size={16} className="mr-1" />
            前に戻る
          </button>
        </div>
      </div>

      <button className="fixed bottom-8 right-8 bg-gray-800 text-white p-3 rounded-full shadow-lg">
        <ChevronUp size={24} />
      </button>
    </div>
  );
}