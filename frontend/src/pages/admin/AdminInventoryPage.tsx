import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../api/client';
import { Vault, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const [summary, setSummary] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [invRes, txRes] = await Promise.all([
        fetchApi<{ summary: any; data: any[] }>('/inventory'),
        fetchApi<{ data: any[] }>('/inventory/transactions'),
      ]);
      setSummary(invRes.summary);
      setProducts(invRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error('Failed to load inventory vault data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
          Physical Vault Reserve
        </span>
        <h1 className="font-serif text-3xl font-bold text-luxury-charcoal">
          Gold Weight & Inventory Audit
        </h1>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-luxury-border shadow-card">
            <span className="text-xs text-luxury-gray font-semibold uppercase">Total Vault Units</span>
            <div className="font-serif text-3xl font-bold text-luxury-gold">{summary.totalUnits} items</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-luxury-border shadow-card">
            <span className="text-xs text-luxury-gray font-semibold uppercase">Total Gross Weight</span>
            <div className="font-serif text-3xl font-bold text-luxury-gold">{summary.totalGrossWeight}g</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-luxury-border shadow-card">
            <span className="text-xs text-luxury-gray font-semibold uppercase">Total Net Gold Weight</span>
            <div className="font-serif text-3xl font-bold text-luxury-gold">{summary.totalNetWeight}g</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-luxury-border shadow-card">
            <span className="text-xs text-luxury-gray font-semibold uppercase">Low Stock Alerts</span>
            <div className="font-serif text-3xl font-bold text-amber-600">{summary.lowStockCount} items</div>
          </div>
        </div>
      )}

      {/* Stock Transaction Audit Log Table */}
      <div className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-4">
        <h3 className="font-serif text-xl font-bold text-luxury-charcoal flex items-center gap-2">
          <Vault className="w-5 h-5 text-luxury-gold" /> Immutable Stock Transaction Trail
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-luxury-border text-luxury-gold font-semibold uppercase">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">SKU / Item</th>
                <th className="py-2.5 px-4">Transaction Type</th>
                <th className="py-2.5 px-4">Qty Delta</th>
                <th className="py-2.5 px-4">Previous & New Stock</th>
                <th className="py-2.5 px-4">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-luxury-beige/20">
                  <td className="py-2.5 px-4 font-mono text-[11px]">
                    {new Date(tx.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4">
                    <strong className="text-luxury-charcoal block">{tx.product.sku}</strong>
                    <span className="text-[10px] text-luxury-gray">{tx.product.name}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-luxury-beige text-luxury-gold font-bold">
                      {tx.transactionType}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-bold">{tx.quantity} units ({tx.netWeight}g)</td>
                  <td className="py-2.5 px-4">{tx.previousQuantity} → <strong>{tx.newQuantity}</strong></td>
                  <td className="py-2.5 px-4 text-luxury-gray">{tx.referenceType} ({tx.referenceId || 'N/A'})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

