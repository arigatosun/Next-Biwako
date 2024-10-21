'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const lineButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLineSDK = () => {
      if (typeof window !== 'undefined' && window.LineIt) {
        window.LineIt.loadButton();
      } else {
        setTimeout(loadLineSDK, 1000);
      }
    };

    if (isMenuOpen) {
      loadLineSDK();
    }
  }, [isMenuOpen]);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen && lineButtonRef.current) {
      setTimeout(() => {
        if (window.LineIt) {
          window.LineIt.loadButton();
        }
      }, 0);
    }
  };

  return (
    <header className="mx-auto my-4 w-11/12 max-w-7xl">
      <Script
        src="https://www.line-website.com/social-plugins/js/thirdparty/loader.min.js"
        strategy="lazyOnload"
      />

      <div className="flex items-center justify-between">
        {/* メインコンテナ */}
        <div className="bg-white shadow-md rounded-full px-6 py-3 flex-grow flex items-center justify-between">
          {/* ロゴ */}
          <div className="flex justify-center md:justify-start">
            <Link href="/" className="flex-shrink-0">
              <Image 
                src="/images/header/Frame 3.webp" 
                alt="NEST BIWAKO" 
                width={200} 
                height={67} 
                className="w-36 md:w-[200px] h-auto"
              />
            </Link>
          </div>
          
          {/* デスクトップ用のナビゲーション（モバイルでは非表示） */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link href="/" className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition duration-300 text-base">
              NEST琵琶湖のTOPに戻る
            </Link>
          </div>
        </div>

        {/* インスタグラムアイコン（デスクトップのみ表示） */}
        <div className="hidden md:block ml-4">
          <Link href="https://www.instagram.com/nest.biwako/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <div className="bg-white shadow-md rounded-full w-[60px] h-[60px] flex items-center justify-center">
              <Image src="/images/footer/Vector.webp" alt="Instagram" width={24} height={24} className="w-6 h-6" />
            </div>
          </Link>
        </div>

        {/* モバイル用のハンバーガーメニュー（デスクトップでは非表示） */}
        <div className="md:hidden ml-4">
          <button
            onClick={handleMenuToggle}
            className="bg-white shadow-md rounded-full w-[60px] h-[60px] flex items-center justify-center"
            aria-label="メニュー"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* モバイル用のドロップダウンメニュー */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 bg-white shadow-md rounded-lg p-4">
          <Link href="/" className="block bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition duration-300 text-center mb-6">
            NEST琵琶湖のTOPに戻る
          </Link>
          <div className="flex justify-center items-center space-x-8">
            <div
              ref={lineButtonRef}
              className="line-it-button"
              data-lang="ja"
              data-type="friend"
              data-env="REAL"
              data-lineid="@627pvjqv"
              style={{ display: 'inline-block' }}
            />
            <Link href="https://www.instagram.com/nest.biwako/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Image src="/images/footer/Vector.webp" alt="Instagram" width={32} height={32} className="w-8 h-8" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}