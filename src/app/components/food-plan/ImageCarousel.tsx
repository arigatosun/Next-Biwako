'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';

interface ImageCarouselProps {
  images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  return (
    <>
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        className="rounded-xl overflow-hidden"
      >
        {images.map((src, index) => (
          <SwiperSlide key={index}>
            <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative' }}>
              <Image
                src={src}
                alt={`Food plan image ${index + 1}`}
                layout="fill"
                objectFit="cover"
                className="cursor-pointer"
                onClick={() => setEnlargedImage(src)}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {enlargedImage && (
        <div
          className="enlarged-image-modal"
          onClick={() => setEnlargedImage(null)}
        >
          <Image
            src={enlargedImage}
            alt="Enlarged food plan image"
            width={1080}
            height={720}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}