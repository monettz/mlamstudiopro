'use client';
import { useState } from 'react';

type Slide = { src: string; label: string; zoom?: { scale: number; focus: string } };

// Detail views used when a product has fewer than four photos: close-ups of
// different parts of the main artwork, so the gallery always has a large
// image and four thumbnails. Real gallery images (added in Admin) come first.
const DETAIL_VIEWS: Slide['zoom'][] = [
  { scale: 1.9, focus: '20% 25%' },
  { scale: 1.9, focus: '80% 30%' },
  { scale: 1.9, focus: '50% 85%' },
];

export default function ProductGallery({ productName, image, galleryImages }: { productName: string; image: string; galleryImages: string[] }) {
  const photos = [...new Set([image, ...galleryImages].filter(Boolean))];
  const slides: Slide[] = photos.slice(0, 4).map((src, index) => ({ src, label: `${productName} image ${index + 1}` }));
  for (let i = 0; slides.length < 4 && i < DETAIL_VIEWS.length; i++) {
    slides.push({ src: image, label: `${productName} close-up ${i + 1}`, zoom: DETAIL_VIEWS[i] });
  }
  const [activeIndex, setActiveIndex] = useState(0);
  const active = slides[activeIndex] ?? slides[0];

  const zoomStyle = (slide: Slide) => slide.zoom
    ? { transform: `scale(${slide.zoom.scale})`, transformOrigin: slide.zoom.focus }
    : undefined;

  return (
    <div className="product-detail-gallery">
      <div className="product-detail-art-wrap">
        <img className="product-detail-art" src={active.src} alt={active.label} style={zoomStyle(active)} fetchPriority="high" />
      </div>
      <div className="product-detail-thumbnails" aria-label={`${productName} image gallery`}>
        {slides.map((slide, index) => (
          <button className={`product-detail-thumbnail${index === activeIndex ? ' active' : ''}`} type="button" key={`${slide.src}-${index}`} onClick={() => setActiveIndex(index)} aria-label={`View ${slide.label}`} aria-pressed={index === activeIndex}>
            <img src={slide.src} alt="" loading="lazy" style={zoomStyle(slide)} />
          </button>
        ))}
      </div>
    </div>
  );
}
