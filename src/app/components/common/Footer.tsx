"use client"
import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';

const Footer: React.FC = () => {
  useEffect(() => {
    // LINE SDKの初期化とボタンの表示
    const loadLineSDK = () => {
      if (typeof window !== 'undefined' && window.LineIt) {
        window.LineIt.loadButton();
      } else {
        // SDKがまだロードされていない場合、再試行
        setTimeout(loadLineSDK, 1000);
      }
    };

    loadLineSDK();
  }, []);

  return (
    <footer className="bg-gray-800 text-white">
      {/* LINE SDK */}
      <Script
        src="https://www.line-website.com/social-plugins/js/thirdparty/loader.min.js"
        strategy="lazyOnload"
      />

      {/* フッター上部のコンテナ */}
      <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="flex flex-col md:flex-row justify-between">
          {/* 左セクション */}
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            {/* ロゴを単なる画像として表示 */}
            <Image
              src="/images/footer/logo.webp"
              alt="NEST BIWAKO"
              width={200}
              height={80}
              className="mb-6 md:mb-24 w-40 md:w-auto"
            />
            {/* 住所を単なるテキストとして表示 */}
            <p className="mb-4 md:mb-6 text-base md:text-xl">
              520-1836 <br /> 滋賀県高島市マキノ町新保浜田146-1
            </p>
            <div className="flex items-center mb-4">
              <Image
                src="/images/footer/mail.webp"
                alt="Email"
                width={24}
                height={24}
                className="mr-2 md:mr-4 w-5 h-5 md:w-6 md:h-6"
              />
              <a href="mailto:info.nest.biwako@gmail.com" className="hover:text-blue-300 text-sm md:text-xl">
                info.nest.biwako@gmail.com
              </a>
            </div>
            <div className="flex space-x-4 md:space-x-9 items-center">
              <div
                className="line-it-button"
                data-lang="ja"
                data-type="friend"
                data-env="REAL"
                data-lineId="@627pvjqv"
                style={{ display: 'inline-block' }}
              />
              <Link href="https://www.instagram.com/nest.biwako/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Image src="/images/footer/Instagram_icon.webp" alt="Instagram" width={40} height={40} className="w-10 h-10 md:w-[40px] md:h-[40px]" />
              </Link>
            </div>
            {/* CTAボタン */}
            <div className="w-full text-center md:text-left mt-6 md:mt-8">
              <Link
                href="#"
                className="bg-blue-500 text-white px-6 py-2 md:px-8 md:py-3 rounded-full inline-block hover:bg-blue-600 text-sm md:text-base font-semibold transition-colors duration-300"
              >
                NEST琵琶湖のTOPに戻る
              </Link>
            </div>
          </div>

          {/* 右セクション */}
          <div className="w-full md:w-2/3">
            <div className="mb-6 md:mb-8 order-first md:order-none">
              <Image
                src="/images/footer/illust.webp"
                alt="Illustration"
                width={600}
                height={300}
                className="w-full"
              />
            </div>
            {/* 空のナビゲーションエリア */}
            <nav className="w-full mb-6 md:mb-0 hidden md:block">
              <ul className="flex flex-col md:flex-row justify-between items-start mt-4 md:items-center space-y-2 md:space-y-0">
                <li className="flex-grow">&nbsp;</li>
                <li className="flex-grow md:mx-20">&nbsp;</li>
                <li className="flex-grow">&nbsp;</li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* フッター下部のコンテナ */}
      <div className="bg-[#00A2EF] py-4 md:py-6">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <p className="text-sm md:text-base">&copy; 2024 NEST琵琶湖. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;