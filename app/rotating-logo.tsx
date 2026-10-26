'use client';

const TOTAL_LAYERS = 7;
const HALF_DEPTH = 6; // 12px sleek, natural 3D emblem thickness

export default function RotatingLogo() {
  return (
    <div
      className="studio-logo-scene"
      role="img"
      aria-label="MLAM Studio Pro 3D logo rotating 360 degrees around its axis"
    >
      <style>{`
        @keyframes studio-axis-turn {
          from {
            transform: rotateY(0deg);
          }
          to {
            transform: rotateY(360deg);
          }
        }
        .studio-logo-scene {
          position: relative;
          width: min(390px, 82vw);
          height: min(390px, 82vw);
          aspect-ratio: 1;
          perspective: 1000px;
          animation: none !important;
          filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 35px rgba(74, 222, 128, 0.25));
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
        }
        .studio-logo-solid {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: studio-axis-turn 12s linear infinite !important;
          animation-play-state: running !important;
          will-change: transform;
        }
        .studio-logo-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          will-change: transform;
        }
        .studio-logo-face img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
        }
        .studio-logo-depth {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #62bf73 0%, #206d39 50%, #0d2c17 100%);
          mask: url('/mlam-mark-3d-green-512.png') center/contain no-repeat;
          -webkit-mask: url('/mlam-mark-3d-green-512.png') center/contain no-repeat;
          pointer-events: none;
        }
      `}</style>

      <div className="studio-logo-solid">
        {/* Sleek, natural 3D depth slices (12px total thickness, silky smooth GPU performance) */}
        {Array.from({ length: TOTAL_LAYERS }, (_, i) => {
          const z = -HALF_DEPTH + (i / (TOTAL_LAYERS - 1)) * (HALF_DEPTH * 2);
          return (
            <span
              aria-hidden="true"
              key={i}
              className="studio-logo-depth"
              style={{
                transform: `translateZ(${z.toFixed(2)}px)`,
              }}
            />
          );
        })}

        {/* Front Face */}
        <div
          className="studio-logo-face studio-logo-front"
          style={{ transform: `translateZ(${HALF_DEPTH}px)` }}
        >
          <img
            src="/mlam-mark-3d-green-512.webp"
            alt="MLAM Studio Logo"
            width={512}
            height={415}
            loading="eager"
          />
        </div>

        {/* Back Face */}
        <div
          className="studio-logo-face studio-logo-back"
          style={{ transform: `rotateY(180deg) translateZ(${HALF_DEPTH}px)` }}
        >
          <img
            src="/mlam-mark-3d-green-512.webp"
            alt=""
            width={512}
            height={415}
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
}

