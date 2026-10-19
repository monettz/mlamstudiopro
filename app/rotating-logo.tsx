'use client';
import { useEffect, useRef } from 'react';
export default function RotatingLogo() {
  const reference = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mark = reference.current; if (!mark) return;
    let visible = true;
    const update = () => { mark.style.animationPlayState = !document.hidden && visible ? 'running' : 'paused'; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(mark); document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return (
    <div className="studio-logo-scene" role="img" aria-label="MLAM Studio Pro 3D logo rotating 360 degrees around its axis">
      <div ref={reference} className="studio-logo-solid">
        {Array.from({ length: 7 }, (_, i) => (
          <span aria-hidden="true" key={i} className="studio-logo-depth" style={{ transform: `translateZ(${(i - 3) * 2.5}px)` }} />
        ))}
        <div className="studio-logo-face studio-logo-front">
          <img src="/mlam-mark-3d-green-512.webp" alt="MLAM Studio Logo" width={512} height={415} loading="eager" />
        </div>
        <div className="studio-logo-face studio-logo-back">
          <img src="/mlam-mark-3d-green-512.webp" alt="" width={512} height={415} loading="eager" />
        </div>
      </div>
    </div>
  );
}
