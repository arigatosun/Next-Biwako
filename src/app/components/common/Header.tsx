'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="mx-auto my-4 w-11/12 max-w-7xl">
      {/* デスクトップ表示 */}
      <div className="hidden md:flex items-center justify-between">
        <div className="bg-white shadow-md rounded-full px-6 py-3 flex justify-between items-center flex-grow mr-2">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex-shrink-0">
              <Image src="/images/header/Frame 3.webp" alt="NEST BIWAKO" width={120} height={40} />
            </Link>
            <nav>
              <ul className="flex space-x-16 text-gray-600 text-base">
                <li><Link href="#" className="hover:text-blue-500">予約</Link></li>
                <li className="text-gray-300">/</li>
                <li><Link href="#" className="hover:text-blue-500">予約確認・変更・キャンセル</Link></li>
                <li className="text-gray-300">/</li>
                <li><Link href="#" className="hover:text-blue-500">ログアウト</Link></li>
              </ul>
            </nav>
          </div>

          <div>
            <Link href="/" className="bg-blue-500 text-white px-10 py-3 rounded-full hover:bg-blue-600 transition duration-300 text-base">
              NEST琵琶湖のTOPに戻る
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-md p-5 rounded-full flex-shrink-0">
          <Link href="#" aria-label="Instagram">
            <Image src="/images/footer/Vector.webp" alt="Instagram" width={24} height={24} className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* モバイル表示 */}
      <div className="md:hidden flex items-center justify-between">
        <div className="bg-white shadow-md rounded-full px-6 py-3 flex justify-between items-center w-full">
          <Link href="/" className="flex-shrink-0">
            <Image src="/images/header/Frame 3.webp" alt="NEST BIWAKO" width={120} height={40} />
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-white shadow-md p-2 rounded-full"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      {isMenuOpen && (
        <nav className="md:hidden mt-2 bg-white shadow-lg rounded-lg py-2 z-10">
          <ul className="space-y-2 text-gray-600 text-base">
            <li>
              <Link href="/" className="block px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition duration-300">
                NEST琵琶湖のTOPに戻る
              </Link>
            </li>
            <li><Link href="#" className="block px-4 py-2 hover:bg-gray-100 hover:text-blue-500">予約</Link></li>
            <li><Link href="#" className="block px-4 py-2 hover:bg-gray-100 hover:text-blue-500">予約確認・変更・キャンセル</Link></li>
            <li><Link href="#" className="block px-4 py-2 hover:bg-gray-100 hover:text-blue-500">ログアウト</Link></li>
          </ul>
          <div className="mt-2 px-4 py-2">
            <Link href="#" aria-label="Instagram" className="inline-block">
              <Image src="/images/footer/Vector.webp" alt="Instagram" width={24} height={24} className="w-6 h-6" />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}