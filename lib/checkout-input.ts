export type CheckoutInput = { productId: string; email: string; fullName: string; paymentMethod: 'mpesa' | 'card' };
export function checkoutInput(value: unknown): CheckoutInput | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (typeof data.productId !== 'string' || typeof data.email !== 'string' || typeof data.fullName !== 'string') return null;
  const productId = data.productId.trim();
  const email = data.email.trim().toLowerCase();
  const fullName = data.fullName.trim();
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(productId) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || fullName.length < 2 || fullName.length > 120 || /[\u0000-\u001f\u007f]/.test(fullName)) return null;
  if (data.paymentMethod !== 'mpesa' && data.paymentMethod !== 'card') return null;
  // No amount, discount, card number or "paid" status is accepted from clients.
  return { productId, email, fullName, paymentMethod: data.paymentMethod };
}
