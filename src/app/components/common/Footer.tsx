'use client';

import React, { useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';

const Footer: React.FC = () => {
  const initializeLineSDK = useCallback(() => {
    if (typeof window !== 'undefined' && window.LineIt) {
      window.LineIt.loadButton();
    }
  }, []);

  useEffect(() => {
    const loadLineSDK = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 50; // 5秒間試行

          const checkSDK = setInterval(() => {
            attempts++;

            if (window.LineIt) {
              clearInterval(checkSDK);
              resolve();
            }

            if (attempts >= maxAttempts) {
              clearInterval(checkSDK);
              reject(new Error('LINE SDK load timeout'));
            }
          }, 100);
        });

        initializeLineSDK();
      } catch (error) {
        console.warn('LINE SDK initialization warning:', error);
      }
    };

    loadLineSDK();
  }, [initializeLineSDK]);

  return (
    <footer className="bg-gray-800 text-white">
      <Script
        src="https://www.line-website.com/social-plugins/js/thirdparty/loader.min.js"
        strategy="afterInteractive"
        onLoad={initializeLineSDK}
        onError={(e) => {
          console.error('LINE SDK load error:', e);
        }}
      />

      <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <div className="mb-6 md:mb-24">
              <Image
                src="/images/footer/logo.webp"
                alt="NEST BIWAKO"
                width={200}
                height={80}
                className="w-40 md:w-auto"
              />
            </div>

            <div className="mb-4 md:mb-6 text-base md:text-xl">
              <span className="inline-block">520-1836</span>
              <span className="block">滋賀県高島市マキノ町新保浜田146-1</span>
            </div>

            <div className="flex items-center mb-4">
              <Image
                src="/images/footer/mail.webp"
                alt="Email"
                width={24}
                height={24}
                className="mr-2 md:mr-4 w-5 h-5 md:w-6 md:h-6"
              />
              <a
                href="mailto:info.nest.biwako@gmail.com"
                className="hover:text-blue-300 text-sm md:text-xl"
              >
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
                data-ver="3"
                style={{ opacity: 0 }}
                suppressHydrationWarning
              />
              <Link
                href="https://www.instagram.com/nest.biwako/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Image
                  src="/images/footer/Instagram_icon.webp"
                  alt="Instagram"
                  width={40}
                  height={40}
                  className="w-10 h-10 md:w-[40px] md:h-[40px]"
                />
              </Link>
            </div>

            {/* CTA Button */}
            <div className="w-full text-center md:text-left mt-6 md:mt-8">
              <Link
                href="https://www.nest-biwako.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-6 py-2 md:px-8 md:py-3 rounded-full inline-block hover:bg-blue-600 text-sm md:text-base font-semibold transition-colors duration-300"
              >
                NEST琵琶湖のTOPに戻る
              </Link>
            </div>
          </div>

          {/* Right Section */}
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
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="bg-[#00A2EF] py-4 md:py-6">
        <div className="container mx-auto px-4 md:px-8 text-center flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-4">
          <p className="text-sm md:text-base">
            &copy; {new Date().getFullYear()} NEST琵琶湖. All Rights Reserved.
          </p>
          <Link href="/legal" className="text-sm md:text-base hover:underline">
            特定商取引法に基づく表記
          </Link>
          <Link href="/privacy-policy" className="text-sm md:text-base hover:underline">
            プライバシーポリシー
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
