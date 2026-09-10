import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../../api/client';
import { WhatsAppShareButton } from '../../../components/common/WhatsAppShareButton';
import { formatCurrency } from '../../../utils/formatters';
import {
  TrendingDown,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  Printer,
  Coins,
} from 'lucide-react';

interface AgingCustomer {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  creditLimit: number;
  outstandingBalance: number;
  aging: {
    current: number;
    d1_30: number;
    d31_60: number;
    d61_90: number;
    d90_plus: number;
    total: number;
  };
}

interface ReceivablesData {
  totalWholesaleSales: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  activeCustomersCount: number;
  customers: AgingCustomer[];
}

export const AdminWholesaleReceivablesPage: React.FC = () => {
  const [data, setData] = useState<ReceivablesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReceivables() {
      try {
        setLoading(true);
        setError('');
        const res = await fetchApi<{ success: boolean; data: ReceivablesData }>('/wholesale/receivables');
        if (res.success) {
          setData(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load wholesale receivables analytics.');
      } finally {
        setLoading(false);
      }
    }
    loadReceivables();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-luxury-ivory min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-border pb-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl text-luxury-charcoal font-bold flex items-center gap-3">
            <TrendingDown className="w-6 h-6 sm:w-7 sm:h-7 text-luxury-gold" />
            Wholesale Accounts Receivables & Aging Analysis
          </h1>
          <p className="text-xs text-luxury-gray mt-1">
            Track business credit risk, overdue receivables buckets & customer repayment performance.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <WhatsAppShareButton
            phone="91944394912"
            message={`*SHANKER JEWELLS • TRICHY*\n*Accounts Receivables & Aging Summary*\nTotal Active Accounts: ${data?.activeCustomersCount || 0}\nTotal Net INR Valuation: ₹${data?.totalOutstanding?.toLocaleString('en-IN') || '0'}\nTotal Overdue: ₹${data?.totalOverdue?.toLocaleString('en-IN') || '0'}\n\nStatement Date: ${new Date().toLocaleDateString('en-IN')}`}
            label="WhatsApp Aging Summary"
          />
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-luxury-gold hover:bg-luxury-gold/90 text-white rounded-xl text-xs font-bold shadow-sm transition-all min-h-[44px]"
          >
            <Printer className="w-4 h-4" /> Print Aging Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-luxury-gray">
          Calculating credit risk & receivables aging...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      ) : data ? (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white border border-luxury-border rounded-2xl p-5 shadow-card space-y-1">
              <span className="text-[10px] uppercase font-bold text-luxury-gray tracking-wider">Total Wholesale B2B Sales</span>
              <div className="text-2xl font-serif font-bold text-luxury-charcoal">
                {formatCurrency(data.totalWholesaleSales)}
              </div>
            </div>

            <div className="bg-white border border-luxury-border rounded-2xl p-5 shadow-card space-y-1">
              <span className="text-[10px] uppercase font-bold text-luxury-gray tracking-wider">Total Payments Collected</span>
              <div className="text-2xl font-serif font-bold text-emerald-700">
                {formatCurrency(data.totalCollected)}
              </div>
            </div>

            <div className="bg-white border border-luxury-border rounded-2xl p-5 shadow-card space-y-1">
              <span className="text-[10px] uppercase font-bold text-luxury-gray tracking-wider">Total Outstanding Dues</span>
              <div className="text-2xl font-serif font-bold text-amber-700">
                {formatCurrency(data.totalOutstanding)}
              </div>
            </div>

            <div className="bg-white border border-luxury-border rounded-2xl p-5 shadow-card space-y-1">
              <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Total Overdue Receivables</span>
              <div className="text-2xl font-serif font-bold text-rose-700">
                {formatCurrency(data.totalOverdue)}
              </div>
            </div>
          </div>

          {/* Mobile Card List (< md) */}
          <div className="block md:hidden space-y-3">
            <h3 className="font-serif text-sm font-bold text-luxury-charcoal uppercase tracking-wider flex items-center justify-between pt-2">
              <span>B2B Receivables Cards ({data.customers.length})</span>
            </h3>
            {data.customers.map((c) => (
              <div key={c.id} className="bg-white border border-luxury-border rounded-2xl p-4 shadow-card space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-serif text-base font-bold text-luxury-charcoal">{c.businessName}</h4>
                    <p className="text-xs text-luxury-gray">{c.contactPerson ? `${c.contactPerson} • ` : ''}{c.mobile}</p>
                  </div>
                  <Link
                    to={`/admin/wholesale/ledger/${c.id}`}
                    className="px-3 py-1.5 bg-luxury-beige/50 border border-luxury-gold/30 text-luxury-gold font-bold text-xs rounded-xl flex items-center gap-1 min-h-[44px]"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Ledger
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-luxury-border/60">
                  <div>
                    <span className="text-[10px] text-luxury-gray uppercase block">Approved Limit</span>
                    <span className="font-mono font-semibold">{formatCurrency(c.creditLimit)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-luxury-gray uppercase block">Total Dues</span>
                    <span className="font-mono font-bold text-luxury-gold text-sm">{formatCurrency(c.outstandingBalance)}</span>
                  </div>
                </div>

                <div className="bg-luxury-beige/30 p-2.5 rounded-xl grid grid-cols-4 gap-1 text-[10px] text-center">
                  <div>
                    <span className="text-luxury-gray block">0-30 Days</span>
                    <strong className="text-emerald-700">{formatCurrency(c.aging.current + c.aging.d1_30)}</strong>
                  </div>
                  <div>
                    <span className="text-luxury-gray block">31-60 Days</span>
                    <strong className="text-amber-700">{formatCurrency(c.aging.d31_60)}</strong>
                  </div>
                  <div>
                    <span className="text-luxury-gray block">61-90 Days</span>
                    <strong className="text-amber-800">{formatCurrency(c.aging.d61_90)}</strong>
                  </div>
                  <div>
                    <span className="text-rose-700 font-bold block">90+ Days</span>
                    <strong className="text-rose-700 font-bold">{formatCurrency(c.aging.d90_plus)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Aging Analysis Table (>= md) */}
          <div className="hidden md:block bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center justify-between border-b border-luxury-border pb-3">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-luxury-gold" /> B2B Retailer Receivables Aging Buckets
              </span>
              <span className="text-xs text-luxury-gray font-mono">{data.customers.length} Retailer Accounts</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-luxury-border text-luxury-gray uppercase text-[10px] font-bold text-left bg-luxury-ivory/50">
                    <th className="py-3 px-3">Retailer Business</th>
                    <th className="py-3 px-3 text-right">Approved Limit</th>
                    <th className="py-3 px-3 text-right">Current (0-30 Days)</th>
                    <th className="py-3 px-3 text-right">31-60 Days</th>
                    <th className="py-3 px-3 text-right">61-90 Days</th>
                    <th className="py-3 px-3 text-right text-rose-700">90+ Days (High Risk)</th>
                    <th className="py-3 px-3 text-right font-bold text-luxury-charcoal">Total Dues</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-border/60">
                  {data.customers.map((c) => (
                    <tr key={c.id} className="hover:bg-luxury-ivory/30 transition-all">
                      <td className="py-3 px-3">
                        <div className="font-bold text-luxury-charcoal">{c.businessName}</div>
                        <div className="text-[10px] text-luxury-gray">{c.mobile}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{formatCurrency(c.creditLimit)}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700">{formatCurrency(c.aging.current + c.aging.d1_30)}</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-700">{formatCurrency(c.aging.d31_60)}</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-800">{formatCurrency(c.aging.d61_90)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">{formatCurrency(c.aging.d90_plus)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-luxury-charcoal text-sm">{formatCurrency(c.outstandingBalance)}</td>
                      <td className="py-3 px-3 text-center">
                        <Link
                          to={`/admin/wholesale/ledger/${c.id}`}
                          className="px-3 py-1 bg-white border border-luxury-border hover:bg-luxury-ivory text-luxury-charcoal rounded-lg font-bold text-[11px] shadow-sm inline-flex items-center gap-1"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-luxury-gold" /> Ledger
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminWholesaleReceivablesPage;
