import prisma from '../../config/db.js';

export interface CalculationInput {
  metalType: string; // GOLD, SILVER
  purity: string; // K24, K22, K18, K14, SILVER_925, SILVER_999
  grossWeight: number;
  netWeight: number;
  makingChargeType: string; // FIXED, PER_GRAM, PERCENTAGE
  makingChargeValue: number;
  wastageType: string; // FIXED_WEIGHT, PERCENTAGE
  wastageValue: number;
  stoneCharge?: number;
  otherCharges?: number;
  discount?: number;
  gstRate?: number;
  overrideMetalRate?: number;
}

export interface CalculationResult {
  metal: string;
  metalType: string;
  purity: string;
  weightGrams: number;
  grossWeight: number;
  netWeight: number;
  ratePerGram: number;
  metalRate: number;
  metalValue: number;
  rawMetalValue: number;
  wastagePercent: number;
  wastageGrams: number;
  wastageValue: number;
  baseMetalCost: number;
  makingCharge: number;
  makingCharges: number;
  stoneValue: number;
  stoneCharge: number;
  otherCharges: number;
  subtotal: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  finalPrice: number;
}

export class PricingService {
  /**
   * Fetches current active metal rate for given metal and purity with flexible variant matching
   */
  static async getCurrentMetalRate(metalType: string, purity: string): Promise<number> {
    const normMetal = (metalType || '').toUpperCase().trim();
    const normPurity = (purity || '').toUpperCase().trim();

    const puritiesToTry = [normPurity];
    if (normPurity === '22K' || normPurity === 'K22' || normPurity === '916') puritiesToTry.push('K22', '22K', '916');
    if (normPurity === '24K' || normPurity === 'K24' || normPurity === '999') puritiesToTry.push('K24', '24K', '999');
    if (normPurity === '18K' || normPurity === 'K18' || normPurity === '750') puritiesToTry.push('K18', '18K', '750');
    if (normPurity === '80' || normPurity === '800') puritiesToTry.push('80', '800');
    if (normPurity === '70' || normPurity === '700') puritiesToTry.push('70', '700');
    if (normPurity === 'SILVER_999' || normPurity === '999') puritiesToTry.push('SILVER_999', '999');
    if (normPurity === 'SILVER_925' || normPurity === '925') puritiesToTry.push('SILVER_925', '925');

    const rateRecord = await prisma.metalRate.findFirst({
      where: {
        metalType: normMetal,
        purity: { in: puritiesToTry },
        effectiveTo: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (rateRecord && rateRecord.ratePerGram > 0) {
      return rateRecord.ratePerGram;
    }

    // Trichy Bullion Market benchmark fallback rates
    if (normMetal === 'GOLD') {
      const k24Rate = 15431.0;
      if (puritiesToTry.includes('24K') || puritiesToTry.includes('K24')) return k24Rate;
      if (puritiesToTry.includes('22K') || puritiesToTry.includes('K22')) return 14145.0;
      if (puritiesToTry.includes('18K') || puritiesToTry.includes('K18')) return 11915.0;
      if (puritiesToTry.includes('80')) return 12345.0;
      if (puritiesToTry.includes('70')) return 10800.0;
      if (normPurity === 'K14' || normPurity === '585') return Math.round(k24Rate * (14 / 24));
      return 14145.0;
    } else if (normMetal === 'SILVER') {
      if (puritiesToTry.includes('SILVER_925') || puritiesToTry.includes('925')) return 236.0;
      if (puritiesToTry.includes('80')) return 204.0;
      if (puritiesToTry.includes('70')) return 178.0;
      return 255.0;
    }
    return 14145.0;
  }

  /**
   * Calculates dynamic pricing strictly executing backend rules
   */
  static async calculateItemPrice(input: CalculationInput): Promise<CalculationResult> {
    const metalRate = input.overrideMetalRate !== undefined && input.overrideMetalRate > 0
      ? input.overrideMetalRate
      : await this.getCurrentMetalRate(input.metalType, input.purity);

    const netWeight = Number(input.netWeight) || 0;
    const grossWeight = Number(input.grossWeight) || netWeight;
    const stoneCharge = Number(input.stoneCharge) || 0;
    const otherCharges = Number(input.otherCharges) || 0;
    const discount = Number(input.discount) || 0;
    const gstRate = input.gstRate !== undefined ? Number(input.gstRate) : 3.0; // 3% GST on gold jewellery

    // 1. Raw metal value
    const rawMetalValue = netWeight * metalRate;

    // 2. Wastage calculation
    let wastageGrams = 0;
    let wastagePercent = 0;
    if (input.wastageType === 'FIXED_WEIGHT') {
      wastageGrams = Number(input.wastageValue) || 0;
      wastagePercent = netWeight > 0 ? (wastageGrams / netWeight) * 100 : 0;
    } else {
      // PERCENTAGE
      wastagePercent = Number(input.wastageValue) || 0;
      wastageGrams = netWeight * (wastagePercent / 100);
    }
    const wastageValue = wastageGrams * metalRate;

    // 3. Base Metal Cost including wastage
    const effectiveWeight = netWeight + wastageGrams;
    const baseMetalCost = effectiveWeight * metalRate;

    // 4. Making charges calculation
    let makingCharges = 0;
    if (input.makingChargeType === 'FIXED') {
      makingCharges = Number(input.makingChargeValue) || 0;
    } else if (input.makingChargeType === 'PER_GRAM') {
      makingCharges = netWeight * (Number(input.makingChargeValue) || 0);
    } else if (input.makingChargeType === 'PERCENTAGE') {
      makingCharges = baseMetalCost * ((Number(input.makingChargeValue) || 0) / 100);
    }

    // 5. Subtotal
    const subtotal = baseMetalCost + makingCharges + stoneCharge + otherCharges;

    // 6. Taxable & Tax
    const taxableAmount = Math.max(0, subtotal - discount);
    const gstAmount = taxableAmount * (gstRate / 100);

    // 7. Final Total
    const finalPrice = taxableAmount + gstAmount;

    return {
      metal: input.metalType,
      metalType: input.metalType,
      purity: input.purity,
      weightGrams: Math.round(netWeight * 1000) / 1000,
      grossWeight: Math.round(grossWeight * 1000) / 1000,
      netWeight: Math.round(netWeight * 1000) / 1000,
      ratePerGram: Math.round(metalRate * 100) / 100,
      metalRate: Math.round(metalRate * 100) / 100,
      metalValue: Math.round(rawMetalValue * 100) / 100,
      rawMetalValue: Math.round(rawMetalValue * 100) / 100,
      wastagePercent: Math.round(wastagePercent * 100) / 100,
      wastageGrams: Math.round(wastageGrams * 1000) / 1000,
      wastageValue: Math.round(wastageValue * 100) / 100,
      baseMetalCost: Math.round(baseMetalCost * 100) / 100,
      makingCharge: Math.round(makingCharges * 100) / 100,
      makingCharges: Math.round(makingCharges * 100) / 100,
      stoneValue: Math.round(stoneCharge * 100) / 100,
      stoneCharge: Math.round(stoneCharge * 100) / 100,
      otherCharges: Math.round(otherCharges * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      gstRate,
      gstAmount: Math.round(gstAmount * 100) / 100,
      total: Math.round(finalPrice * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
    };
  }
}

