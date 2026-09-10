import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Download, ShieldCheck, ArrowRight } from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const invoiceNumber = searchParams.get('inv') || 'INV-2026-000001';

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest block">
        Order Confirmed & Insured
      </span>
      <h1 className="font-serif text-3xl sm:text-5xl font-bold text-luxury-charcoal">
        Invoice: {invoiceNumber}
      </h1>

      <p className="text-xs sm:text-sm text-luxury-gray max-w-md mx-auto leading-relaxed">
        Thank you for purchasing with Royal Jewels & Bullion. Your order has been registered into our vault dispatch system. An official tax invoice PDF has been generated with 100% BIS hallmark certification guarantee.
      </p>

      <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
        <a
          href={`/api/billing/invoices/${invoiceNumber}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="px-8 py-3 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury"
        >
          <Download className="w-4 h-4" /> Download Official Invoice PDF
        </a>

        <Link
          to="/shop"
          className="px-8 py-3 rounded-full border border-luxury-border text-luxury-charcoal font-semibold text-xs tracking-widest uppercase hover:bg-luxury-beige transition-all flex items-center justify-center gap-2"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

