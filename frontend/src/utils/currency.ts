/**
 * Format a currency amount in Indian Rupees (₹).
 * Amounts are stored in paise (1/100 of a rupee), similar to cents.
 */
export function formatCurrency(amountInPaise: number, showSymbol = true): string {
  const amount = amountInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
