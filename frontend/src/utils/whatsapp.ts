/**
 * WhatsApp Helper Utilities for Shanker Jewells ERP
 */

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '91944394912'; // Default business phone
  // Remove spaces, hyphens, parentheses, and leading plus
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // If 10 digits (Standard Indian Mobile Number), prepend country code 91
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }

  return cleaned;
}

export function buildWhatsAppLink(phone?: string, text?: string): string {
  const cleanNumber = formatWhatsAppPhone(phone);
  const encodedText = text ? encodeURIComponent(text) : '';
  return `https://wa.me/${cleanNumber}${encodedText ? `?text=${encodedText}` : ''}`;
}

export function openWhatsAppChat(phone?: string, text?: string): void {
  const link = buildWhatsAppLink(phone, text);
  window.open(link, '_blank', 'noopener,noreferrer');
}

export function buildWholesaleInvoiceMessage(params: {
  invoiceNumber: string;
  customerName: string;
  grandTotal: number;
  goldEquivalentGrams: number;
  rate24K: number;
  gstRegistered?: boolean;
  gstin?: string;
  outstandingGoldGrams?: number;
  invoiceDate?: string;
}): string {
  const dateStr = params.invoiceDate || new Date().toLocaleDateString('en-IN');
  const gstStatus = params.gstRegistered || params.gstin ? `GSTIN: ${params.gstin || 'Registered'}` : 'Not Registered / GST OFF';

  return `*SHANKER JEWELLS • TRICHY*
*B2B Wholesale Tax Invoice*

*Invoice #:* ${params.invoiceNumber}
*Date:* ${dateStr}
*Customer:* ${params.customerName}

*Invoice Amount:* ₹${params.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
*24K Gold Equivalent:* ${params.goldEquivalentGrams.toFixed(4)} g (@ ₹${params.rate24K.toLocaleString('en-IN')}/g)
*GST Status:* ${gstStatus}

${params.outstandingGoldGrams !== undefined ? `*Account Net Dues:* ${params.outstandingGoldGrams.toFixed(4)} g 24K\n` : ''}
Thank you for doing business with Shanker Jewells.
*Trichy • Since 2000*`;
}

export function buildWholesalePaymentMessage(params: {
  paymentNumber: string;
  customerName: string;
  paymentType: string;
  goldPurity?: string;
  goldWeightGrams?: number;
  goldEquivalent24KGrams?: number;
  cashAmount?: number;
  cashEquivalent24KGrams?: number;
  totalEquivalent24KGrams: number;
  remainingOutstandingGoldGrams?: number;
  paymentDate?: string;
}): string {
  const dateStr = params.paymentDate || new Date().toLocaleDateString('en-IN');
  const pType = (params.paymentType || 'CASH').toUpperCase();

  let breakdown = '';
  if (pType === 'GOLD' || (params.goldWeightGrams && params.goldWeightGrams > 0)) {
    breakdown += `• Gold: ${params.goldWeightGrams?.toFixed(4)} g @ ${params.goldPurity || '22K'} (${params.goldEquivalent24KGrams?.toFixed(4)} g 24K eq)\n`;
  }
  if (pType === 'CASH' || (params.cashAmount && params.cashAmount > 0)) {
    breakdown += `• Cash: ₹${params.cashAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${params.cashEquivalent24KGrams?.toFixed(4)} g 24K eq)\n`;
  }

  return `*SHANKER JEWELLS • TRICHY*
*Wholesale Payment Receipt*

*Receipt #:* ${params.paymentNumber}
*Date:* ${dateStr}
*Customer:* ${params.customerName}
*Settlement Type:* ${pType}

${breakdown}*Total Settlement Credited:* ${params.totalEquivalent24KGrams.toFixed(4)} g 24K eq
${params.remainingOutstandingGoldGrams !== undefined ? `*Remaining Net Gold Dues:* ${params.remainingOutstandingGoldGrams.toFixed(4)} g 24K\n` : ''}
Thank you for your prompt settlement.
*Shanker Jewells Accounts Team • Trichy*`;
}

export function buildWholesaleLedgerMessage(params: {
  customerName: string;
  creditLimitGoldGrams: number;
  outstandingGoldGrams: number;
  activeRate24K: number;
  mobile?: string;
}): string {
  const inrValuation = (params.outstandingGoldGrams || 0) * params.activeRate24K;

  return `*SHANKER JEWELLS • TRICHY*
*Wholesale Customer Ledger Statement*

*Customer:* ${params.customerName}
*Approved Gold Credit:* ${params.creditLimitGoldGrams.toFixed(4)} g 24K
*Net Gold Outstanding Dues:* ${params.outstandingGoldGrams.toFixed(4)} g 24K
*Current INR Valuation:* ₹${inrValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (@ ₹${params.activeRate24K.toLocaleString('en-IN')}/g)
*Statement Date:* ${new Date().toLocaleDateString('en-IN')}

Official computer generated B2B Gold-Equivalent ledger statement.
*Shanker Jewells • Trichy*`;
}

export function buildRetailInvoiceMessage(params: {
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
}): string {
  return `*SHANKER JEWELLS • TRICHY*
*Retail Tax Invoice*

*Invoice #:* ${params.invoiceNumber}
*Customer:* ${params.customerName || 'Valued Customer'}
*Items Purchased:* ${params.itemCount}
*Total Bill Amount:* ₹${params.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
*Date:* ${new Date().toLocaleDateString('en-IN')}

Thank you for shopping with Shanker Jewells.
*No. 4, Sandhukadai, Big Bazzar Street, Trichy - 620008*`;
}

export function buildQuotationMessage(params: {
  quotationNumber: string;
  customerName: string;
  jewelleryType: string;
  metalType: string;
  purity: string;
  approxBudget?: number;
}): string {
  return `*SHANKER JEWELLS • TRICHY*
*Custom Jewellery Quotation Estimate*

*Quotation #:* ${params.quotationNumber}
*Customer:* ${params.customerName}
*Item:* ${params.jewelleryType} (${params.metalType} ${params.purity})
${params.approxBudget ? `*Estimated Budget:* ₹${params.approxBudget.toLocaleString('en-IN')}\n` : ''}
*Date:* ${new Date().toLocaleDateString('en-IN')}

Thank you for choosing Shanker Jewells for custom crafting.`;
}
