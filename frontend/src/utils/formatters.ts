/**
 * Utility functions for currency and weight formatting in Shanker Jewells ERP.
 */

/**
 * Formats a numeric amount to Indian Rupee currency standard with 2 decimal places.
 * Example: 139244.11 -> "₹1,39,244.11"
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0.00';
  }
  const numericVal = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericVal)) {
    return '₹0.00';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericVal);
};

/**
 * Formats a weight in grams with 3 decimal places.
 * Example: 12.45 -> "12.450 g"
 */
export const formatWeight = (grams: number | string | null | undefined): string => {
  if (grams === null || grams === undefined || grams === '') {
    return '0.000 g';
  }
  const numericVal = typeof grams === 'string' ? parseFloat(grams) : grams;
  if (isNaN(numericVal)) {
    return '0.000 g';
  }

  return `${numericVal.toFixed(3)} g`;
};
