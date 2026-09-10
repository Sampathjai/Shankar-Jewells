import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../api/client';
import {
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Clock,
  Building2,
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-gold/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-gold font-bold flex items-center gap-3">
            <TrendingDown className="w-7 h-7 text-luxury-gold" />
            Wholesale Accounts Receivables & Aging Analysis
          </h1>
          <p className="text-xs text-luxury-ivory/60 mt-1">
            Track business credit risk, overdue receivables buckets & customer repayment performance
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-luxury-gold text-luxury-charcoal rounded-xl text-xs font-bold shadow-luxury"
          >
            <Printer className="w-4 h-4" /> Print Aging Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-luxury-ivory/60">
          Calculating credit risk & receivables aging...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
          {error}
        </div>
      ) : data ? (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 backdrop-blur-md space-y-1">
              <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Total Wholesale B2B Sales</span>
              <div className="text-xl font-serif font-bold text-white">
                ₹{data.totalWholesaleSales.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-luxury-charcoal/60 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-md space-y-1">
              <span className="text-[10px] text-emerald-400/80 uppercase font-semibold">Total Collections</span>
              <div className="text-xl font-serif font-bold text-emerald-400">
                ₹{data.totalCollected.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-luxury-charcoal/60 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-md space-y-1">
              <span className="text-[10px] text-amber-400/80 uppercase font-semibold">Total Outstanding Dues</span>
              <div className="text-xl font-serif font-bold text-amber-400">
                ₹{data.totalOutstanding.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-luxury-charcoal/60 border border-rose-500/30 rounded-2xl p-5 backdrop-blur-md space-y-1">
              <span className="text-[10px] text-rose-400/80 uppercase font-semibold">Total Overdue Dues</span>
              <div className="text-xl font-serif font-bold text-rose-400">
                ₹{data.totalOverdue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Customer Aging Breakdown Table */}
          <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="p-4 border-b border-luxury-gold/20 flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" /> Customer-Wise Aging Buckets
              </h3>
              <span className="text-xs text-luxury-ivory/60">{data.customers.length} Accounts</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-luxury-ivory/80">
                <thead className="bg-luxury-charcoal text-luxury-gold uppercase text-[10px] font-bold tracking-wider border-b border-luxury-gold/20">
                  <tr>
                    <th className="px-5 py-3.5">Wholesale Business</th>
                    <th className="px-5 py-3.5 text-right">Current</th>
                    <th className="px-5 py-3.5 text-right">1-30 Days</th>
                    <th className="px-5 py-3.5 text-right">31-60 Days</th>
                    <th className="px-5 py-3.5 text-right">61-90 Days</th>
                    <th className="px-5 py-3.5 text-right text-rose-400">90+ Days</th>
                    <th className="px-5 py-3.5 text-right font-bold">Total Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-gold/10">
                  {data.customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-luxury-ivory/40">
                        No wholesale receivables recorded.
                      </td>
                    </tr>
                  ) : (
                    data.customers.map((c) => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{c.businessName}</div>
                          <div className="text-[10px] text-luxury-ivory/50">Ph: {c.mobile}</div>
                        </td>
                        <td className="px-5 py-4 text-right font-mono">
                          ₹{c.aging.current.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-amber-300">
                          ₹{c.aging.d1_30.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-amber-400">
                          ₹{c.aging.d31_60.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-rose-300">
                          ₹{c.aging.d61_90.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-rose-400 font-bold">
                          ₹{c.aging.d90_plus.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-white text-sm font-mono">
                          ₹{c.aging.total.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
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
