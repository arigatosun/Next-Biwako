'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Footer: React.FC = () => {
  // メニュー項目を更新
  const menuItems = ['予約', '予約確認・変更・キャンセル', 'ログアウト'];

  return (
    <footer className="bg-gray-800 text-white">
      {/* フッター上部のコンテナ */}
      <div className="container mx-auto px-8 py-10">
        <div className="flex flex-wrap justify-between">
          {/* 左セクション */}
          <div className="w-full md:w-1/3 mb-8 md:mb-0">
            <Link href="/">
              {/* ロゴのサイズとマージンを調整 */}
              <Image
                src="/images/footer/logo.webp"
                alt="NEST BIWAKO"
                width={250}
                height={100}
                className="mb-24" // mb-16からmb-8に変更
              />
            </Link>
            {/* 電話番号と住所 */}
            <p className="mb-6 text-xl"> {/* mb-2からmb-6、text-lgからtext-xlに変更 */}
              <Link href="#" className="hover:text-blue-300">
                520-1836 <br /> 滋賀県高島市マキノ町新保浜田146-1
              </Link>
            </p>
            {/* メールアドレス */}
            <div className="flex items-center mb-4"> {/* mb-4からmb-6に変更 */}
              <Image
                src="/images/footer/mail.webp"
                alt="Email"
                width={24}
                height={24}
                className="mr-4" // mr-2からmr-4に変更
              />
              <a href="mailto:info.nest.biwako@gmail.com" className="hover:text-blue-300 text-xl">
                info.nest.biwako@gmail.com
              </a>
            </div>
            {/* ソーシャルアイコン */}
            <div className="flex space-x-9 items-center"> {/* space-x-4からspace-x-6に変更 */}
              <Link href="#" aria-label="LINE">
                <Image src="/images/footer/LINE.webp" alt="LINE" width={90} height={90} />
              </Link>
              <Link href="#" aria-label="Instagram">
                <Image src="/images/footer/Instagram_icon.webp" alt="Instagram" width={40} height={40} />
              </Link>
            </div>
          </div>

          {/* 右セクション */}
          <div className="w-full md:w-2/3">
            {/* イラスト画像 */}
            <div className="mb-8"> {/* mb-8からmb-12に変更 */}
              <Image
                src="/images/footer/illust.webp"
                alt="Illustration"
                width={600}
                height={300}
                className="w-full"
              />
            </div>
            {/* メニュー項目とCTAボタン */}
            <div className="flex flex-wrap justify-between">
              {/* メニュー項目 */}
              <nav className="w-full md:w-2/3 mb-12 md:mb-0">
  <ul className="flex flex-col md:flex-row justify-between items-start mt-4 md:items-center space-y-2 md:space-y-0">
    {menuItems.map((item, index) => (
      <li key={index} className={`flex items-center  ${index === 1 ? 'md:flex-grow md:mx-20' : ''}`}>
        <Link href="#" className="flex items-center  hover:text-blue-300 text-sm">
          <Image src="/images/footer/Group.webp" alt="" width={16} height={16} className="mr-2" />
          <span className="tracking-wide">{item}</span>
        </Link>
      </li>
    ))}
  </ul>
</nav>
              {/* CTAボタン */}
              <div className="w-full md:w-1/3 text-center md:text-right">
                <Link
                  href="#"
                  className="bg-blue-500 text-white px-8 py-3 rounded-full inline-block hover:bg-blue-600 text-base font-semibold transition-colors duration-300"
                >
                  NEST琵琶湖のTOPに戻る
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* フッター下部のコンテナ */}
      <div className="bg-blue-600 py-6"> {/* py-4からpy-6に変更 */}
        <div className="container mx-auto px-8 text-center">
          <p className="text-base">&copy; 2024 NEST琵琶湖. All Rights Reserved.</p> {/* text-smからtext-baseに変更 */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
