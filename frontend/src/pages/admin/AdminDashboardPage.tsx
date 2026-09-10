import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import {
  TrendingUp,
  Receipt,
  Building2,
  Truck,
  Vault,
  Package,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Users,
  CreditCard,
  DollarSign,
  Gem,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [metalRates, setMetalRates] = useState<any[]>([]);

  // Summary Metrics State
  const [inventoryValuation, setInventoryValuation] = useState<any>(null);
  const [wholesaleReceivables, setWholesaleReceivables] = useState<any>(null);
  const [consignmentStock, setConsignmentStock] = useState<any[]>([]);
  const [customRequestsCount, setCustomRequestsCount] = useState(0);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        const ratesRes = await fetchApi<{ success: boolean; data: any[] }>('/metal-rates');
        setMetalRates(ratesRes.data || []);

        const invRes = await fetchApi<{ success: boolean; data: any }>('/inventory');
        setInventoryValuation(invRes.data);

        const whsRes = await fetchApi<{ success: boolean; data: any }>('/wholesale/receivables');
        setWholesaleReceivables(whsRes.data);

        const csgRes = await fetchApi<{ success: boolean; data: any[] }>('/consignment/stock');
        setConsignmentStock(csgRes.data || []);

        const custRes = await fetchApi<{ success: boolean; data: any[] }>('/custom-requests');
        setCustomRequestsCount(custRes.data?.filter((r: any) => r.status === 'NEW').length || 0);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const gold22k = metalRates.find((r) => r.metalType === 'GOLD' && r.purity === 'K22')?.ratePerGram || 6830;
  const silver925 = metalRates.find((r) => r.metalType === 'SILVER' && r.purity === 'SILVER_925')?.ratePerGram || 88;

  const totalConsignmentUnits = consignmentStock.reduce((sum, item) => sum + item.quantity, 0);
  const totalConsignmentWeight = consignmentStock.reduce((sum, item) => sum + item.netWeight, 0);

  return (
    <div className="p-8 space-y-8">
      {/* Header with Live Ticker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-luxury-gold/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-luxury-gold text-xs font-bold uppercase tracking-widest">
            <Gem className="w-4 h-4" /> Shanker Jewells ERP • Trichy
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            Good Morning, {user?.name || 'Manager'}
          </h1>
          <p className="text-xs text-luxury-ivory/60 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Live Metal Rates Ticker */}
        <div className="flex items-center gap-4 bg-luxury-charcoal/80 p-3.5 rounded-2xl border border-luxury-gold/30 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30">
              Au
            </div>
            <div>
              <div className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Live Gold 22K</div>
              <div className="text-sm font-bold text-amber-400 font-mono">₹{gold22k}/g</div>
            </div>
          </div>

          <div className="h-8 w-px bg-luxury-gold/20" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-400/20 text-slate-200 flex items-center justify-center font-bold text-xs border border-slate-400/30">
              Ag
            </div>
            <div>
              <div className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Live Silver 925</div>
              <div className="text-sm font-bold text-slate-200 font-mono">₹{silver925}/g</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-luxury-gold font-bold uppercase tracking-wider mr-2">Quick Operations:</span>
        <Link
          to="/admin/billing"
          className="flex items-center gap-2 px-4 py-2 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-bold rounded-xl text-xs shadow-luxury transition-all"
        >
          <Plus className="w-4 h-4" /> Retail POS Bill
        </Link>
        <Link
          to="/admin/wholesale"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-luxury-gold/30"
        >
          <Building2 className="w-4 h-4 text-luxury-gold" /> Wholesale Credit Bill
        </Link>
        <Link
          to="/admin/consignment/issue"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-luxury-gold/30"
        >
          <Truck className="w-4 h-4 text-luxury-gold" /> Consignment Stock Issue
        </Link>
        <Link
          to="/admin/inventory"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-luxury-gold/30"
        >
          <Vault className="w-4 h-4 text-luxury-gold" /> Add Vault Inventory
        </Link>
      </div>

      {/* Primary KPI Grid (8 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Vault Gold Reserve */}
        <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 backdrop-blur-md space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-luxury-gold uppercase font-bold tracking-wider">Vault Gold Stock</span>
            <Vault className="w-5 h-5 text-luxury-gold" />
          </div>
          <div className="text-2xl font-serif font-bold text-white">
            {inventoryValuation?.totalNetWeight ? `${inventoryValuation.totalNetWeight.toFixed(1)}g` : '0g'}
          </div>
          <div className="text-[11px] text-amber-300 font-medium">
            Valuation: ₹{(inventoryValuation?.goldStockValue || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 2: Vault Silver Reserve */}
        <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 backdrop-blur-md space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">Vault Silver Reserve</span>
            <Package className="w-5 h-5 text-slate-300" />
          </div>
          <div className="text-2xl font-serif font-bold text-white">
            {inventoryValuation?.totalProducts ? `${inventoryValuation.totalProducts} Items` : '0 Items'}
          </div>
          <div className="text-[11px] text-slate-300 font-medium">
            Valuation: ₹{(inventoryValuation?.silverStockValue || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 3: Wholesale Outstanding */}
        <div className="bg-luxury-charcoal/60 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-md space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Wholesale Receivables</span>
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-400">
            ₹{(wholesaleReceivables?.totalOutstanding || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-rose-400 font-semibold">
            Overdue Dues: ₹{(wholesaleReceivables?.totalOverdue || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 4: Consignment Stock */}
        <div className="bg-luxury-charcoal/60 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-md space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Consignment Bulk Stock</span>
            <Truck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-400">
            {totalConsignmentWeight.toFixed(1)}g Net
          </div>
          <div className="text-[11px] text-emerald-300 font-medium">
            {totalConsignmentUnits} Units Placed With Partners
          </div>
        </div>
      </div>

      {/* Multi-Workflow Breakdown & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Workflow Summaries (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
            <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center justify-between border-b border-luxury-gold/20 pb-3">
              <span>Business Workflows Summary</span>
              <span className="text-xs text-luxury-ivory/60">3 Independent Channels</span>
            </h3>

            <div className="space-y-4 text-xs">
              {/* Retail Channel */}
              <div className="p-4 bg-white/5 rounded-xl border border-luxury-gold/10 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-luxury-gold" /> 1. Retail Store Sales
                  </div>
                  <p className="text-[11px] text-luxury-ivory/60">
                    In-store customer POS billing with manual product selection & A4 invoice generation
                  </p>
                </div>
                <Link
                  to="/admin/billing"
                  className="px-3 py-1.5 bg-luxury-gold/20 text-luxury-gold rounded-lg font-bold hover:bg-luxury-gold hover:text-luxury-charcoal transition-all text-[11px]"
                >
                  Open POS
                </Link>
              </div>

              {/* Wholesale Channel */}
              <div className="p-4 bg-white/5 rounded-xl border border-luxury-gold/10 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" /> 2. Wholesale / Credit B2B
                  </div>
                  <p className="text-[11px] text-luxury-ivory/60">
                    Jewellery supplied to retailer accounts, credit limit checking & receivables aging
                  </p>
                </div>
                <Link
                  to="/admin/wholesale"
                  className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg font-bold hover:bg-amber-500 hover:text-luxury-charcoal transition-all text-[11px]"
                >
                  Open Wholesale
                </Link>
              </div>

              {/* Consignment Channel */}
              <div className="p-4 bg-white/5 rounded-xl border border-luxury-gold/10 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" /> 3. Consignment Placement
                  </div>
                  <p className="text-[11px] text-luxury-ivory/60">
                    Bulk stock placement with partner stores, return restock & commission settlements
                  </p>
                </div>
                <Link
                  to="/admin/consignment/stock"
                  className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg font-bold hover:bg-emerald-500 hover:text-luxury-charcoal transition-all text-[11px]"
                >
                  View Consignment
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inventory Alerts & Pending Custom Requests (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
            <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center justify-between border-b border-luxury-gold/20 pb-3">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Stock Level Alerts
              </span>
              <span className="text-xs text-amber-400 font-bold">
                {inventoryValuation?.lowStockCount || 0} Low Stock
              </span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-luxury-gold/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Out of Stock Items</div>
                  <div className="text-[10px] text-luxury-ivory/50">Requires urgent vault replenishment</div>
                </div>
                <span className="font-bold text-rose-400 font-mono text-sm">
                  {inventoryValuation?.outOfStockCount || 0} Products
                </span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-luxury-gold/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Low Stock Threshold Alerts</div>
                  <div className="text-[10px] text-luxury-ivory/50">Items below threshold limit</div>
                </div>
                <span className="font-bold text-amber-400 font-mono text-sm">
                  {inventoryValuation?.lowStockCount || 0} Products
                </span>
              </div>

              <Link
                to="/admin/inventory"
                className="block text-center py-2 bg-white/5 hover:bg-white/10 text-luxury-gold font-bold text-xs rounded-xl transition-all border border-luxury-gold/20"
              >
                View Vault Inventory
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
