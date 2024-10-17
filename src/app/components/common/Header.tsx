'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="mx-auto my-4 w-11/12 max-w-7xl">
      <div className="flex items-center justify-between bg-white shadow-md rounded-full px-6 py-3">
        <Link href="/" className="flex-shrink-0">
          <Image src="/images/header/Frame 3.webp" alt="NEST BIWAKO" width={120} height={40} />
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/" className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition duration-300 text-sm md:text-base">
            NEST琵琶湖のTOPに戻る
          </Link>
          
          <Link href="#" aria-label="Instagram" className="bg-white p-2 rounded-full shadow-md">
            <Image src="/images/footer/Vector.webp" alt="Instagram" width={20} height={20} className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}