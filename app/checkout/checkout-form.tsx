'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Check, ChevronDown, CreditCard, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import {
  MpesaSquareBadge,
  AirtelMoneySquareBadge,
  MixxByYasSquareBadge,
  HalopesaSquareBadge,
  VisaLogo,
  MastercardLogo,
} from './payment-logos';

const MOBILE_NETWORKS = [
  { id: 'mpesa', name: 'M-Pesa', badge: MpesaSquareBadge, logoUrl: '/images/payments/mpesa.png', promptLabel: 'M-Pesa' },
  { id: 'airtel-money', name: 'Airtel Money', badge: AirtelMoneySquareBadge, logoUrl: '/images/payments/airtel-money.png', promptLabel: 'Airtel Money' },
  { id: 'mixx-by-yas', name: 'Mixx by Yas', badge: MixxByYasSquareBadge, logoUrl: '/images/payments/mixx-by-yas.png', promptLabel: 'Mixx by Yas' },
  { id: 'halopesa', name: 'HaloPesa', badge: HalopesaSquareBadge, logoUrl: '/images/payments/halopesa.png', promptLabel: 'HaloPesa' },
];

// Generates expiration month/year options (e.g., 01/25 to 12/36)
const EXPIRY_OPTIONS = (() => {
  const list: { value: string; label: string }[] = [];
  const startYear = 2025;
  const endYear = 2036;
  for (let year = startYear; year <= endYear; year++) {
    const yy = String(year).slice(-2);
    for (let month = 1; month <= 12; month++) {
      const mm = month < 10 ? `0${month}` : String(month);
      list.push({
        value: `${mm}/${yy}`,
        label: `${mm} / ${yy}`,
      });
    }
  }
  return list;
})();

// Real Luhn algorithm (Mod 10) card validation criteria
function checkLuhn(cardNum: string): boolean {
  const digits = cardNum.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export default function CheckoutForm({ productId, priceLabel }: { productId: string; priceLabel: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [mobileNetwork, setMobileNetwork] = useState('mpesa');
  const [mobileNumber, setMobileNumber] = useState('');
  
  // Card input states matching mockup
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardErrors, setCardErrors] = useState<{ [key: string]: string }>({});

  const [limitedUntil, setLimitedUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((limitedUntil - Date.now()) / 1000)));
    update();
    if (!limitedUntil) return;
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [limitedUntil]);

  const selectedMobileNetwork = MOBILE_NETWORKS.find(n => n.id === mobileNetwork) || MOBILE_NETWORKS[0];

  function formatCardNumber(value: string) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  }

  const rawCardNum = cardNumber.replace(/\s/g, '');
  const detectedCardBrand = rawCardNum.startsWith('4')
    ? 'visa'
    : (/^(5[1-5]|2[2-7])/.test(rawCardNum) ? 'mastercard' : null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || Date.now() < limitedUntil) return;
    const data = new FormData(event.currentTarget);

    // Validate Card criteria if card method selected
    if (paymentMethod === 'card') {
      const errors: { [key: string]: string } = {};
      if (!cardHolder.trim() || cardHolder.trim().length < 3) {
        errors.cardHolder = 'Enter the full cardholder name as printed on the card.';
      }
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (!cleanNum || cleanNum.length < 15 || !checkLuhn(cleanNum)) {
        errors.cardNumber = 'Enter a valid 16-digit card number.';
      }
      if (!/^\d{3,4}$/.test(cardCvv.trim())) {
        errors.cardCvv = 'Enter a valid 3-digit CVV from the back of the card.';
      }
      if (!cardExpiry) {
        errors.cardExpiry = 'Please select the card expiration date.';
      }

      if (Object.keys(errors).length > 0) {
        setCardErrors(errors);
        setMessage('Please correct the highlighted card details to proceed.');
        return;
      }
    }

    setCardErrors({});
    setBusy(true);
    setMessage('');

    // Format phone: strip spaces and leading 0 if needed for +255
    let cleanNumber = mobileNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = cleanNumber.slice(1);
    if (cleanNumber.startsWith('255')) cleanNumber = cleanNumber.slice(3);

    try {
      const response = await fetch('/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          email: data.get('email'),
          fullName: data.get('fullName'),
          paymentMethod,
          mobileNetwork: paymentMethod === 'mpesa' ? mobileNetwork : undefined,
          mobileNumber: paymentMethod === 'mpesa' ? `+255${cleanNumber}` : undefined,
          cardBrand: paymentMethod === 'card' ? (detectedCardBrand || 'card') : undefined,
        }),
      });
      const result = await response.json();
      if (response.status === 429) {
        const seconds = Number(response.headers.get('Retry-After'));
        setLimitedUntil(Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000);
      }
      setMessage(result.error || 'ClickPesa integration is being prepared. No charge was made.');
    } catch {
      setMessage('Unable to connect. No payment was started. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="checkout-details checkout-form-modern" onSubmit={submit}>
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      {/* Step 1: Contact Information */}
      <div className="checkout-form-heading">
        <span className="checkout-step">01</span>
        <div><h2>Contact information</h2><p>Your license key and download links will be sent to this email.</p></div>
      </div>
      <div className="checkout-field-grid">
        <label htmlFor="checkout-email">Email address
          <input id="checkout-email" name="email" type="email" autoComplete="email" placeholder="producer@studio.com" maxLength={254} required disabled={busy}/>
        </label>
        <label htmlFor="checkout-name">Full name
          <input id="checkout-name" name="fullName" autoComplete="name" placeholder="John Doe" minLength={2} maxLength={120} required disabled={busy}/>
        </label>
      </div>

      {/* Step 2: Payment Method */}
      <fieldset className="checkout-payment-options" disabled={busy}>
        <legend><span className="checkout-step checkout-step-inline">02</span> Payment Method</legend>

        {/* Top Type Selector Tabs */}
        <div className="checkout-type-pills" role="tablist" aria-label="Payment methods">
          <button
            type="button"
            role="tab"
            aria-selected={paymentMethod === 'mpesa'}
            className={`checkout-type-pill ${paymentMethod === 'mpesa' ? 'active' : ''}`}
            onClick={() => { setPaymentMethod('mpesa'); setMessage(''); }}
          >
            <Smartphone size={17} />
            <span>Mobile Money</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={paymentMethod === 'card'}
            className={`checkout-type-pill ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => { setPaymentMethod('card'); setMessage(''); }}
          >
            <CreditCard size={17} />
            <span>Credit / Debit Card</span>
          </button>
        </div>

        {/* Mobile Money View */}
        {paymentMethod === 'mpesa' && (
          <div className="checkout-method-container">
            <span className="checkout-section-subtitle">Select Mobile Network:</span>
            
            {/* 4-column compact network row */}
            <div className="checkout-network-grid" role="radiogroup" aria-label="Mobile network">
              {MOBILE_NETWORKS.map((net) => {
                const isSelected = mobileNetwork === net.id;
                const Badge = net.badge;
                return (
                  <button
                    key={net.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`checkout-network-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setMobileNetwork(net.id);
                      setMessage('');
                      const input = document.getElementById('checkout-mobile-number');
                      if (input) input.focus();
                    }}
                  >
                    {isSelected && (
                      <span className="checkout-network-check" aria-label="Selected">
                        <Check size={12} strokeWidth={3.5} />
                      </span>
                    )}
                    <div className="checkout-network-badge-box">
                      <Badge className="w-8 h-8" />
                    </div>
                    <span className="checkout-network-title">{net.name}</span>
                  </button>
                );
              })}
            </div>

            {/* USSD Phone Number Input */}
            <div className="checkout-phone-section">
              <label htmlFor="checkout-mobile-number" className="checkout-phone-label">
                {selectedMobileNetwork.promptLabel} Number for USSD Push *
              </label>
              <div className="checkout-phone-group">
                <span className="checkout-phone-prefix">+255</span>
                <input
                  id="checkout-mobile-number"
                  name="mobileNumber"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="711472706"
                  value={mobileNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobileNumber(val);
                  }}
                  required
                />
              </div>
              <p className="checkout-phone-helper">A secure USSD payment prompt will appear on this phone.</p>
            </div>
          </div>
        )}

        {/* Credit / Debit Card View matching User reference mockup */}
        {paymentMethod === 'card' && (
          <div className="checkout-method-container checkout-card-form-container">
            <div className="checkout-card-header">
              <p className="checkout-card-instruction">
                Please add your credit card information<br />
                for a successful purchase
              </p>
            </div>

            <div className="checkout-card-inputs-stack">
              {/* Field 1: Card Holder */}
              <div className="checkout-card-field">
                <label htmlFor="checkout-card-holder" className="sr-only">Card Holder</label>
                <input
                  id="checkout-card-holder"
                  name="cardHolder"
                  type="text"
                  autoComplete="cc-name"
                  placeholder="Card Holder"
                  value={cardHolder}
                  onChange={(e) => {
                    setCardHolder(e.target.value);
                    if (cardErrors.cardHolder) setCardErrors((prev) => ({ ...prev, cardHolder: '' }));
                  }}
                  className={cardErrors.cardHolder ? 'input-error' : ''}
                  required={paymentMethod === 'card'}
                  disabled={busy}
                />
                {cardErrors.cardHolder && (
                  <span className="checkout-field-error-tip">{cardErrors.cardHolder}</span>
                )}
              </div>

              {/* Field 2: Card number */}
              <div className="checkout-card-field">
                <label htmlFor="checkout-card-number" className="sr-only">Card number</label>
                <div className="checkout-card-number-wrap">
                  <input
                    id="checkout-card-number"
                    name="cardNumber"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="Card number"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      setCardNumber(formatCardNumber(e.target.value));
                      if (cardErrors.cardNumber) setCardErrors((prev) => ({ ...prev, cardNumber: '' }));
                    }}
                    className={cardErrors.cardNumber ? 'input-error' : ''}
                    required={paymentMethod === 'card'}
                    disabled={busy}
                  />
                  <div className="checkout-card-number-icons">
                    {detectedCardBrand === 'visa' ? (
                      <VisaLogo className="checkout-card-detected-icon" />
                    ) : detectedCardBrand === 'mastercard' ? (
                      <MastercardLogo className="checkout-card-detected-icon" />
                    ) : (
                      <div className="checkout-card-dual-icons">
                        <VisaLogo className="checkout-card-mini-icon" />
                        <MastercardLogo className="checkout-card-mini-icon" />
                      </div>
                    )}
                  </div>
                </div>
                {cardErrors.cardNumber && (
                  <span className="checkout-field-error-tip">{cardErrors.cardNumber}</span>
                )}
              </div>

              {/* Field 3: CVV */}
              <div className="checkout-card-field">
                <label htmlFor="checkout-card-cvv" className="sr-only">CVV</label>
                <div className="checkout-card-cvv-wrap">
                  <input
                    id="checkout-card-cvv"
                    name="cardCvv"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="CVV"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCardCvv(val);
                      if (cardErrors.cardCvv) setCardErrors((prev) => ({ ...prev, cardCvv: '' }));
                    }}
                    className={cardErrors.cardCvv ? 'input-error' : ''}
                    required={paymentMethod === 'card'}
                    disabled={busy}
                  />
                  <Lock size={15} className="checkout-card-cvv-lock" />
                </div>
                {cardErrors.cardCvv && (
                  <span className="checkout-field-error-tip">{cardErrors.cardCvv}</span>
                )}
              </div>

              {/* Field 4: Date of Expires with dropdown chevron */}
              <div className="checkout-card-field">
                <label htmlFor="checkout-card-expiry" className="sr-only">Date of Expires</label>
                <div className="checkout-card-select-wrap">
                  <select
                    id="checkout-card-expiry"
                    name="cardExpiry"
                    value={cardExpiry}
                    onChange={(e) => {
                      setCardExpiry(e.target.value);
                      if (cardErrors.cardExpiry) setCardErrors((prev) => ({ ...prev, cardExpiry: '' }));
                    }}
                    className={`checkout-card-select ${!cardExpiry ? 'is-placeholder' : ''} ${cardErrors.cardExpiry ? 'input-error' : ''}`}
                    required={paymentMethod === 'card'}
                    disabled={busy}
                  >
                    <option value="" disabled>Date of Expires</option>
                    {EXPIRY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="checkout-card-select-chevron" />
                </div>
                {cardErrors.cardExpiry && (
                  <span className="checkout-field-error-tip">{cardErrors.cardExpiry}</span>
                )}
              </div>
            </div>

            <div className="checkout-card-security-note">
              <Lock size={13} />
              <span>ClickPesa 3D-Secure 2.0 verification · 256-bit encrypted</span>
            </div>
          </div>
        )}
      </fieldset>

      <button className="checkout-submit" disabled={busy || remaining > 0}>
        {busy ? 'Preparing payment…' : remaining > 0 ? `Please wait ${Math.ceil(remaining / 60)} min` : `Continue to payment · ${priceLabel}`}
        {!busy && remaining === 0 && <ArrowRight aria-hidden="true" size={18} />}
      </button>

      {message && <p className="checkout-result" role="status" aria-live="polite">{message}{remaining > 0 && <> Try again in {Math.ceil(remaining / 60)} minute(s).</>}</p>}
      <p className="checkout-secure-note"><ShieldCheck aria-hidden="true" size={16} />ClickPesa verified payment gateway · 256-bit encryption</p>
    </form>
  );
}
