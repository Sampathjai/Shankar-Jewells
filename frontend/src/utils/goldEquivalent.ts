/**
 * Frontend Gold Equivalent & Settlement Calculation Engine
 * Matches Backend GoldEquivalentService for live UI previews.
 */

export function purityToKarat(purity: string | null | undefined): number {
  if (!purity) return 24;
  const p = purity.toUpperCase().trim();
  if (p.includes('24') || p.includes('999') || p === 'K24') return 24;
  if (p.includes('22') || p.includes('916') || p === 'K22') return 22;
  if (p.includes('18') || p.includes('750') || p === 'K18') return 18;
  if (p.includes('14') || p.includes('585') || p === 'K14') return 14;

  const match = p.match(/^(\d+(\.\d+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    if (val > 0 && val <= 24) return val;
  }
  return 24;
}

export function roundGoldGrams(grams: number, decimals: number = 4): number {
  if (isNaN(grams) || !isFinite(grams)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((grams + Number.EPSILON) * factor) / factor;
}

export function roundCurrency(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatGoldGrams(grams: number | null | undefined, decimals: number = 4): string {
  if (grams === null || grams === undefined || isNaN(grams)) return '0.0000 g';
  const val = roundGoldGrams(grams, decimals);
  return `${val.toFixed(decimals)} g`;
}

export function convertGoldTo24KEquivalent(weightGrams: number, purity: string): number {
  const weight = Math.max(0, Number(weightGrams) || 0);
  const karat = purityToKarat(purity);
  return roundGoldGrams((weight * karat) / 24, 4);
}

export function convertCashTo24KEquivalent(cashAmount: number, rate24K: number): number {
  const cash = Math.max(0, Number(cashAmount) || 0);
  const rate = Number(rate24K);
  if (!rate || rate <= 0) return 0;
  return roundGoldGrams(cash / rate, 4);
}

export function calculateInvoiceGoldEquivalent(grandTotalInr: number, rate24K: number): number {
  const total = Math.max(0, Number(grandTotalInr) || 0);
  const rate = Number(rate24K);
  if (!rate || rate <= 0) return 0;
  return roundGoldGrams(total / rate, 4);
}

export interface MixedSettlementCalc {
  goldWeightGrams: number;
  goldPurity: string;
  goldEquivalent24KGrams: number;
  goldValueInr: number;
  cashAmount: number;
  cashEquivalent24KGrams: number;
  totalEquivalent24KGrams: number;
  rate24K: number;
}

export function calculateMixedSettlementFrontend(params: {
  goldWeightGrams?: number;
  goldPurity?: string;
  cashAmount?: number;
  rate24K: number;
}): MixedSettlementCalc {
  const rate24K = Math.max(1, Number(params.rate24K) || 6830);
  const goldWeightGrams = Math.max(0, Number(params.goldWeightGrams) || 0);
  const goldPurity = params.goldPurity || '24K';
  const cashAmount = Math.max(0, Number(params.cashAmount) || 0);

  const goldEquivalent24KGrams = convertGoldTo24KEquivalent(goldWeightGrams, goldPurity);
  const goldValueInr = Math.round(goldEquivalent24KGrams * rate24K * 100) / 100;
  const cashEquivalent24KGrams = convertCashTo24KEquivalent(cashAmount, rate24K);
  const totalEquivalent24KGrams = roundGoldGrams(goldEquivalent24KGrams + cashEquivalent24KGrams, 4);

  return {
    goldWeightGrams: roundGoldGrams(goldWeightGrams, 4),
    goldPurity,
    goldEquivalent24KGrams,
    goldValueInr,
    cashAmount,
    cashEquivalent24KGrams,
    totalEquivalent24KGrams,
    rate24K,
  };
}
