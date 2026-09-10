import React, { useEffect } from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { formatGoldGrams } from '../../utils/goldEquivalent';

interface WholesalePaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    paymentNumber: string;
    businessName?: string;
    customerName?: string;
    contactPerson?: string;
    mobile?: string;
    paymentType: 'GOLD' | 'CASH' | 'MIXED' | string;
    paymentMethod?: string;
    goldPurity?: string;
    goldWeightGrams?: number;
    goldEquivalent24KGrams?: number;
    cashAmount?: number;
    rate24K: number;
    cashEquivalent24KGrams?: number;
    totalEquivalent24KGrams: number;
    previousOutstandingGoldGrams?: number;
    remainingOutstandingGoldGrams?: number;
    referenceNo?: string;
    recordedBy?: string;
    paymentDate?: string;
    notes?: string;
  } | null;
}

export const WholesalePaymentReceiptModal: React.FC<WholesalePaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const isGoldIncluded = receiptData.paymentType === 'GOLD' || receiptData.paymentType === 'MIXED' || (receiptData.goldWeightGrams && receiptData.goldWeightGrams > 0);
  const isCashIncluded = receiptData.paymentType === 'CASH' || receiptData.paymentType === 'MIXED' || (receiptData.cashAmount && receiptData.cashAmount > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
      <div
        className="relative max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-luxury-gold/40 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Actions Header (Hidden on Print) */}
        <div className="p-4 border-b border-luxury-border flex justify-between items-center bg-luxury-beige/40 no-print">
          <span className="text-xs font-bold text-luxury-gold uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Payment Recorded Successfully
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-luxury-gold text-white text-xs font-bold uppercase hover:bg-luxury-gold-dark transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>

            <button
              onClick={onClose}
              className="p-2 text-luxury-gray hover:text-luxury-charcoal rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-8 space-y-6 text-luxury-charcoal overflow-y-auto print-container">
          {/* Header Branding */}
          <div className="text-center border-b border-luxury-border pb-4 space-y-1">
            <div className="flex justify-center items-center gap-2">
              <Sparkles className="w-5 h-5 text-luxury-gold" />
              <h2 className="font-serif text-2xl font-bold tracking-widest uppercase text-luxury-charcoal">
                SHANKER JEWELLS
              </h2>
            </div>
            <p className="text-xs font-semibold text-luxury-gold uppercase tracking-wider">
              WHOLESALE PAYMENT RECEIPT • TRICHY
            </p>
            <p className="text-[11px] text-luxury-gray">
              No. 4, Sandhukadai, Big Bazzar Street, Trichy - 620008 • Phone: +91 944394912
            </p>
          </div>

          {/* Receipt Summary Grid */}
          <div className="bg-luxury-beige/30 p-4 rounded-2xl border border-luxury-border space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-luxury-border/60 pb-2">
              <span className="font-bold text-luxury-gray uppercase text-[10px]">Receipt No:</span>
              <span className="font-mono font-bold text-luxury-gold text-sm">{receiptData.paymentNumber}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-luxury-gray">Customer:</span>
              <strong className="text-sm font-serif">{receiptData.businessName || receiptData.customerName || 'Wholesale Account'}</strong>
            </div>

            {receiptData.contactPerson && (
              <div className="flex justify-between items-center text-luxury-gray">
                <span>Contact Person:</span>
                <span>{receiptData.contactPerson} ({receiptData.mobile})</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 border-t border-luxury-border/40">
              <span className="text-luxury-gray">Payment Settlement Type:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-luxury-gold/20 text-luxury-gold font-bold text-[10px] uppercase">
                {receiptData.paymentType} SETTLEMENT
              </span>
            </div>

            <div className="flex justify-between items-center text-luxury-gray">
              <span>Date & Time:</span>
              <span className="font-mono">
                {receiptData.paymentDate ? new Date(receiptData.paymentDate).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Settlement Breakdown Table */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-luxury-charcoal uppercase tracking-wider border-b border-luxury-border pb-1">
              Settlement Breakdown & Valuation
            </h3>

            <div className="space-y-2 text-xs">
              {/* Gold Payment Details */}
              {isGoldIncluded && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-amber-900">
                    <span>Gold Received ({receiptData.goldPurity || '24K'}):</span>
                    <span>{formatGoldGrams(receiptData.goldWeightGrams)}</span>
                  </div>
                  <div className="flex justify-between text-amber-800 text-[11px] font-mono">
                    <span>24K Equivalent Conversion:</span>
                    <span className="font-bold">{formatGoldGrams(receiptData.goldEquivalent24KGrams)} 24K</span>
                  </div>
                </div>
              )}

              {/* Cash Payment Details */}
              {isCashIncluded && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Cash / Bank Received:</span>
                    <span>{formatCurrency(receiptData.cashAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 text-[11px] font-mono">
                    <span>24K Gold Rate Basis:</span>
                    <span>{formatCurrency(receiptData.rate24K)}/g</span>
                  </div>
                  <div className="flex justify-between text-slate-700 text-[11px] font-mono">
                    <span>Cash Gold Equivalent:</span>
                    <span className="font-bold">{formatGoldGrams(receiptData.cashEquivalent24KGrams)} 24K</span>
                  </div>
                </div>
              )}

              {/* Total Settlement Banner */}
              <div className="p-4 bg-luxury-charcoal text-white rounded-2xl border border-luxury-gold/50 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-luxury-gold uppercase font-bold tracking-wider block">
                    TOTAL SETTLED CREDIT
                  </span>
                  <span className="text-xs text-luxury-ivory/80">24K Gold Equivalent</span>
                </div>
                <div className="font-serif text-2xl font-bold text-luxury-gold font-mono">
                  {formatGoldGrams(receiptData.totalEquivalent24KGrams)}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Gold Outstanding Ledger Balance */}
          <div className="border-t border-luxury-border pt-4 space-y-2 text-xs">
            {receiptData.previousOutstandingGoldGrams !== undefined && receiptData.previousOutstandingGoldGrams !== null && (
              <div className="flex justify-between text-luxury-gray">
                <span>Previous Outstanding:</span>
                <span className="font-mono font-semibold">{formatGoldGrams(receiptData.previousOutstandingGoldGrams)} 24K</span>
              </div>
            )}

            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Total Settlement Credited:</span>
              <span className="font-mono font-bold">- {formatGoldGrams(receiptData.totalEquivalent24KGrams)} 24K</span>
            </div>

            {receiptData.remainingOutstandingGoldGrams !== undefined && receiptData.remainingOutstandingGoldGrams !== null && (
              <>
                <div className="flex justify-between items-center text-luxury-charcoal font-bold pt-1 border-t border-luxury-border/60">
                  <span>Remaining Gold Outstanding:</span>
                  <span className="font-serif text-lg text-luxury-gold font-mono">
                    {formatGoldGrams(receiptData.remainingOutstandingGoldGrams)} 24K
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-luxury-gray">
                  <span>Current INR Equivalent Value (@ {formatCurrency(receiptData.rate24K)}/g):</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(receiptData.remainingOutstandingGoldGrams * receiptData.rate24K)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Footer Notes & Recorded By */}
          <div className="border-t border-luxury-border pt-4 text-[11px] text-luxury-gray flex justify-between items-end">
            <div>
              <p>Recorded By: <strong className="text-luxury-charcoal">{receiptData.recordedBy || 'Authorized Staff'}</strong></p>
              {receiptData.referenceNo && <p>Ref / Receipt #: {receiptData.referenceNo}</p>}
              {receiptData.notes && <p className="italic">Notes: {receiptData.notes}</p>}
            </div>

            <div className="text-right">
              <span className="block font-serif text-xs font-bold text-luxury-charcoal">SHANKER JEWELLS</span>
              <span className="text-[10px] text-luxury-gold">Authorized Signature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
