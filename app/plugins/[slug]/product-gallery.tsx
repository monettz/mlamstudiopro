'use client';
import { useState } from 'react';

export default function ProductGallery({ productName, image, galleryImages }: { productName: string; image: string; galleryImages: string[] }) {
  const slides = [...new Set([image, ...galleryImages].filter(Boolean))];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = slides[activeIndex] ?? image;

  return (
    <div className="product-detail-gallery">
      <div className="product-detail-art-wrap">
        <img className="product-detail-art" src={activeImage} alt={`${productName} product image ${activeIndex + 1}`} fetchPriority="high" />
      </div>
      {slides.length > 0 && (
        <div className="product-detail-thumbnails" aria-label={`${productName} image gallery`}>
          {slides.map((src, index) => (
            <button className={`product-detail-thumbnail${index === activeIndex ? ' active' : ''}`} type="button" key={`${src}-${index}`} onClick={() => setActiveIndex(index)} aria-label={`View product image ${index + 1}`} aria-pressed={index === activeIndex}>
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
