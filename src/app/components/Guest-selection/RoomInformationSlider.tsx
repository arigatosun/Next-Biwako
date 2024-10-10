import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const images = [
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

const RoomInformationSlider: React.FC = () => {
    return (
        <div className="mb-5 max-w-4xl mx-auto">
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          className="rounded-lg overflow-hidden"
        >
          {images.map((src, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <Image
                  src={src}
                  alt={`Room view ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="mt-4 text-center">
          <span className="inline-block bg-[#00A2EF] text-white px-4 py-2 rounded-full text-sm">
            ▼予約内容をご記入ください▼
          </span>
        </div>
      </div>
    );
  };
  
  export default RoomInformationSlider;