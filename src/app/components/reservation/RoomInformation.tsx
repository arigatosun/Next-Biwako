"use client"
import { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const roomImages = [
  '/images/nest-reservation-room-view/1.webp',
  '/images/nest-reservation-room-view/2.webp',
  '/images/nest-reservation-room-view/3.webp',
  '/images/nest-reservation-room-view/4.webp',
  '/images/nest-reservation-room-view/5.webp',
  '/images/nest-reservation-room-view/6.webp',
  '/images/nest-reservation-room-view/7.webp',
  '/images/nest-reservation-room-view/8.webp',
  '/images/nest-reservation-room-view/9.webp',
  '/images/nest-reservation-room-view/10.webp',
  '/images/nest-reservation-room-view/11.webp',
  '/images/nest-reservation-room-view/12.webp',
];

const amenities = [
  { icon: '/images/itemfornest/Group 518.webp', width: 26, height: 26 },
  { icon: '/images/itemfornest/Group 519.webp', width: 26, height: 26 },
  { icon: '/images/itemfornest/Group 520.webp', width: 26, height: 26 },
  { icon: '/images/itemfornest/Group 521.webp', width: 26, height: 26 },
  { icon: '/images/itemfornest/Group_517.webp', width: 26, height: 26 },
];

export default function RoomInformation() {
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  return (
    <div className="bg-white shadow-md rounded-lg p-3 sm:p-5 mb-6 font-shin-go">
      <div className="border border-gray-200 rounded-lg p-3 sm:p-5 md:p-6 lg:p-8 xl:p-16">
        {/* 背景画像と説明文のセクション */}
        <div className="relative w-full h-26 sm:h-32 mb-3">
          <Image
            src="/images/itemfornest/Vector.webp"
            alt="Background"
            layout="fill"
            objectFit="cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#363331] p-2 sm:p-3">
            <h2 className="text-lg sm:text-xl font-semibold mb-1">【一棟貸切！】</h2>
            <h3 className="text-base sm:text-lg font-medium mb-1">贅沢遊びつくし素泊まりヴィラプラン</h3>
            <p className="text-center font-normal text-xs sm:text-sm">◆室内温水プール・天然温泉・サウナ完備◆</p>
          </div>
        </div>
        
        <div className="mb-3">
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            className="rounded-xl overflow-hidden"
          >
            {roomImages.map((src, index) => (
              <SwiperSlide key={index}>
                <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative' }}>
                  <Image
                    src={src}
                    alt={`Room view ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="cursor-pointer"
                    onClick={() => setEnlargedImage(src)}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* 特徴セクション */}
        <div className="mb-5">
          <div className="rounded-xl overflow-hidden">
            <div className="bg-gray-100 p-1.5 flex justify-center items-center" style={{ height: '32px' }}>
              <h4 className="font-semibold text-[#363331] text-center text-xs sm:text-sm whitespace-nowrap">特徴</h4>
            </div>
          </div>
        </div>
        <div className="text-xs text-[#363331] font-light text-left mt-3">
          <p className="mb-2">●水温３０℃の室内温水プール付き　●プライベート温泉・サウナ完備　●一棟貸切ヴィラ</p>
          <p>●グループ利用にも優しいルームチャージ制　※食材の持ち込みでのBBQも可能です。</p>
        </div>

        <div className="flex h-10 items-center pl-1.5 mt-5 md:mt-6 lg:mt-8">
          {amenities.map((amenity, index) => (
            <div key={index} className="flex items-center justify-center h-full mr-9 last:mr-0">
              <div className="relative" style={{ width: `${amenity.width}px`, height: `${amenity.height}px` }}>
                <Image
                  src={amenity.icon}
                  alt={`Amenity ${index + 1}`}
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setEnlargedImage(null)}
        >
          <Image
            src={enlargedImage}
            alt="Enlarged room view"
            width={960}
            height={640}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}