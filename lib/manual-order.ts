// Validation for payments the owner records by hand (M-Pesa and similar),
// kept free of database code so it can be unit tested on its own.

export const PAYMENT_METHODS = { mpesa: 'M-Pesa', 'airtel-money': 'Airtel Money', 'mixx-by-yas': 'Mixx by Yas', halopesa: 'HaloPesa', bank: 'Bank transfer', cash: 'Cash', other: 'Other' } as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;
export const CURRENCIES = ['TZS', 'USD'] as const;
export type Currency = typeof CURRENCIES[number];

export type ManualOrder = {
  productId: string; email: string; phone: string; amountMinor: number; currency: Currency;
  method: PaymentMethod; reference: string; issueLicense: boolean; maxDownloads: number;
};

export function parseManualOrder(value: unknown): { order: ManualOrder } | { error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'Fill in the payment details' };
  const input = value as Record<string, unknown>;
  const productId = String(input.product_id ?? '').trim();
  const email = String(input.customer_email ?? '').trim().toLowerCase();
  const phone = String(input.customer_phone ?? '').replace(/[^\d+]/g, '');
  const currency = String(input.currency ?? 'TZS').toUpperCase();
  const method = String(input.payment_method ?? '');
  const reference = String(input.provider_ref ?? '').trim().toUpperCase();
  const amount = Number(input.amount);
  const maxDownloads = input.max_downloads === undefined || input.max_downloads === '' ? 5 : Number(input.max_downloads);

  if (!/^[a-zA-Z0-9-]{1,80}$/.test(productId)) return { error: 'Choose the product that was paid for' };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter the customer email address' };
  if (phone.length > 20) return { error: 'Phone number is too long' };
  if (!(CURRENCIES as readonly string[]).includes(currency)) return { error: 'Currency must be TZS or USD' };
  if (!Object.hasOwn(PAYMENT_METHODS, method)) return { error: 'Choose how the customer paid' };
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) return { error: 'Enter the amount received' };
  if (reference.length > 60 || !/^[A-Z0-9\-_.\s]*$/.test(reference)) return { error: 'Transaction code may use letters, numbers and dashes only' };
  if (method !== 'cash' && !reference) return { error: 'Enter the transaction code from the payment message' };
  if (!Number.isInteger(maxDownloads) || maxDownloads < 1 || maxDownloads > 100) return { error: 'Download limit must be between 1 and 100' };

  return { order: { productId, email, phone, amountMinor: Math.round(amount * 100), currency: currency as Currency, method: method as PaymentMethod, reference, issueLicense: input.issue_license !== false, maxDownloads } };
}
