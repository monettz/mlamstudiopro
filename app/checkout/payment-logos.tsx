import React from 'react';

// ============================================================================
// Authentic Payment Brand SVG Logos for ClickPesa & East Africa Mobile Money
// ============================================================================

export function MpesaSquareBadge({ className = "w-full h-full" }: { className?: string }) {
  return (
    <img
      src="/logos/payments/mpesa.png"
      alt="M-Pesa Official Logo"
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}

export function AirtelMoneySquareBadge({ className = "w-full h-full" }: { className?: string }) {
  return (
    <img
      src="/logos/payments/airtel-money.png"
      alt="Airtel Money Official Logo"
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}

export function MixxByYasSquareBadge({ className = "w-full h-full" }: { className?: string }) {
  return (
    <img
      src="/logos/payments/mixx-by-yas.png"
      alt="Mixx by Yas Official Logo"
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}

export function HalopesaSquareBadge({ className = "w-full h-full" }: { className?: string }) {
  return (
    <img
      src="/logos/payments/halopesa.png"
      alt="HaloPesa Official Logo"
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}

export function VisaLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 54 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
      <rect width="54" height="28" rx="5" fill="#1A1F71" />
      <path d="M20.2 7.5L16.8 20.5H13.6L11.5 10.3C11.4 9.8 11.2 9.4 10.8 9.2C10.1 8.8 8.9 8.4 8 8.2L8.1 7.5H13.5C14.2 7.5 14.8 8 15 8.8L16.3 15.8L18.4 7.5H20.2ZM24.4 16.4C24.4 14.1 21.2 13.9 21.2 12.5C21.2 12 21.7 11.5 22.7 11.3C23.2 11.2 24.5 11.2 26 11.8L26.5 9.4C25.8 9.1 24.8 8.9 23.6 8.9C20.7 8.9 18.7 10.4 18.7 12.6C18.7 14.2 20.2 15.1 21.3 15.7C22.4 16.2 22.8 16.6 22.8 17.1C22.8 17.9 21.8 18.3 20.9 18.3C19.4 18.3 18.6 17.9 17.9 17.6L17.3 20.1C18.1 20.4 19.5 20.7 20.9 20.7C24.1 20.7 26.2 19.1 26.2 16.6L24.4 16.4ZM32.3 20.5H35.1L32.6 7.5H30.2C29.6 7.5 29.1 7.8 28.8 8.4L24.6 20.5H27.5L28.1 18.9H31.6L32.3 20.5ZM28.8 16.8L30.2 12.8L31.1 16.8H28.8ZM41.4 7.5L39.1 20.5H36.4L38.7 7.5H41.4Z" fill="#FFFFFF" />
      <path d="M10.8 9.2C10.1 8.8 8.9 8.4 8 8.2L8.1 7.5H13.5C14.2 7.5 14.8 8 15 8.8L16.3 15.8L11.5 10.3C11.5 10.3 11.3 9.7 10.8 9.2Z" fill="#F7B600" />
    </svg>
  );
}

export function MastercardLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 46 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
      <rect width="46" height="28" rx="5" fill="#1C1E24" />
      <circle cx="18" cy="14" r="8" fill="#EB001B" />
      <circle cx="28" cy="14" r="8" fill="#F79E1B" fillOpacity="0.9" />
      <path d="M23 7.8C24.8 9.3 26 11.5 26 14C26 16.5 24.8 18.7 23 20.2C21.2 18.7 20 16.5 20 14C20 11.5 21.2 9.3 23 7.8Z" fill="#FF5F00" />
    </svg>
  );
}

export function MpesaLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="M-Pesa">
      <rect width="72" height="28" rx="5" fill="#00A651" />
      <path d="M6 14C6 9.58 9.58 6 14 6C18.42 6 22 9.58 22 14C22 18.42 18.42 22 14 22C9.58 22 6 18.42 6 14Z" fill="#E60000" />
      <path d="M11 18V10H13.2L14.7 13.5L16.2 10H18.4V18H16.8V12.6L15.3 16H14.1L12.6 12.6V18H11Z" fill="#FFFFFF" />
      <text x="26" y="18" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontSize="11" fontWeight="900" letterSpacing="0.05em">
        M-PESA
      </text>
    </svg>
  );
}

export function AirtelMoneyLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 68 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Airtel Money">
      <rect width="68" height="28" rx="5" fill="#E40000" />
      <path d="M12.5 7.5C10 7.5 8 9.5 8 12C8 16 13 18.5 15.5 20.5C18 18.5 23 16 23 12C23 9.5 21 7.5 18.5 7.5C16.8 7.5 15.5 8.7 15.5 8.7C15.5 8.7 14.2 7.5 12.5 7.5Z" fill="#FFFFFF" />
      <text x="24" y="18" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10.5" fontWeight="800" letterSpacing="0.02em">
        airtel
      </text>
    </svg>
  );
}
