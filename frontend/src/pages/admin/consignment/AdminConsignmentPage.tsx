import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../../api/client';
import {
  Truck,
  Plus,
  Search,
  Handshake,
  FileCheck2,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ConsignmentStockItem {
  id: string;
  quantity: number;
  grossWeight: number;
  netWeight: number;
  partner: {
    id: string;
    businessName: string;
    mobile: string;
  };
  product: {
    id: string;
    name: string;
    sku: string;
    metalType: string;
    purity: string;
    grossWeight: number;
    netWeight: number;
  };
}

export const AdminConsignmentPage: React.FC = () => {
  const [stockList, setStockList] = useState<ConsignmentStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadStock() {
      try {
        setLoading(true);
        setError('');
        const res = await fetchApi<{ success: boolean; data: ConsignmentStockItem[] }>('/consignment/stock');
        if (res.success) {
          setStockList(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load consignment stock overview.');
      } finally {
        setLoading(false);
      }
    }
    loadStock();
  }, []);

  const totalQuantity = stockList.reduce((sum, s) => sum + s.quantity, 0);
  const totalNetWeight = stockList.reduce((sum, s) => sum + s.netWeight, 0);

  const filteredStock = stockList.filter(
    (s) =>
      s.partner.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-gold/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-gold font-bold flex items-center gap-3">
            <Truck className="w-7 h-7 text-luxury-gold" />
            Consignment Bulk Stock Overview
          </h1>
          <p className="text-xs text-luxury-ivory/60 mt-1">
            Track un-sold jewellery placed with retail partners (separate from store vault stock)
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/consignment/partners"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-luxury-gold/20"
          >
            <Handshake className="w-4 h-4" /> Partners
          </Link>
          <Link
            to="/admin/consignment/issue"
            className="flex items-center gap-2 px-4 py-2.5 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-bold rounded-xl text-xs shadow-luxury"
          >
            <Plus className="w-4 h-4" /> Issue Stock
          </Link>
          <Link
            to="/admin/consignment/settlements"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow"
          >
            <FileCheck2 className="w-4 h-4" /> Settle Consignment
          </Link>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 backdrop-blur-md space-y-1">
          <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Total Stock Items With Partners</span>
          <div className="text-2xl font-serif font-bold text-white">{totalQuantity} Units</div>
        </div>

        <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 backdrop-blur-md space-y-1">
          <span className="text-[10px] text-luxury-gold uppercase font-semibold">Total Net Weight Placed</span>
          <div className="text-2xl font-serif font-bold text-luxury-gold">{totalNetWeight.toFixed(2)}g Net</div>
        </div>

        <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 backdrop-blur-md space-y-1">
          <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Consignment Partners</span>
          <div className="text-2xl font-serif font-bold text-white">
            {new Set(stockList.map((s) => s.partner.id)).size} Active
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-luxury-charcoal/40 p-4 rounded-2xl border border-luxury-gold/20 backdrop-blur-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-luxury-ivory/40" />
          <input
            type="text"
            placeholder="Search by partner name, product or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-luxury-charcoal/80 border border-luxury-gold/20 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold"
          />
        </div>
      </div>

      {/* Consignment Stock Table */}
      {loading ? (
        <div className="text-center py-16 text-xs text-luxury-ivory/60">
          Loading consignment partner inventory...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
          {error}
        </div>
      ) : filteredStock.length === 0 ? (
        <div className="text-center py-16 bg-luxury-charcoal/30 rounded-2xl border border-luxury-gold/10 text-xs text-luxury-ivory/60">
          No consignment stock currently placed with partners.
        </div>
      ) : (
        <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-luxury-ivory/80">
              <thead className="bg-luxury-charcoal text-luxury-gold uppercase text-[10px] font-bold tracking-wider border-b border-luxury-gold/20">
                <tr>
                  <th className="px-5 py-3.5">Consignment Partner</th>
                  <th className="px-5 py-3.5">Product Name</th>
                  <th className="px-5 py-3.5">SKU</th>
                  <th className="px-5 py-3.5">Purity & Metal</th>
                  <th className="px-5 py-3.5 text-right">Placed Qty</th>
                  <th className="px-5 py-3.5 text-right">Net Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-gold/10">
                {filteredStock.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{item.partner.businessName}</div>
                      <div className="text-[10px] text-luxury-ivory/50">Ph: {item.partner.mobile}</div>
                    </td>
                    <td className="px-5 py-4 font-medium text-white">{item.product.name}</td>
                    <td className="px-5 py-4 font-mono text-[11px] text-luxury-ivory/70">{item.product.sku}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold">
                        {item.product.purity} {item.product.metalType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-white">{item.quantity}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-luxury-gold">
                      {item.netWeight.toFixed(2)}g
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsignmentPage;

