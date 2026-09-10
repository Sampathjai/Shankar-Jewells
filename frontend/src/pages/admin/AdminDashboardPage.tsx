import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Receipt,
  Building2,
  Vault,
  Package,
  AlertTriangle,
  Plus,
  Sparkles,
  Gem,
  Coins,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [metalRates, setMetalRates] = useState<any[]>([]);

  // Summary Metrics State
  const [inventoryValuation, setInventoryValuation] = useState<any>(null);
  const [wholesaleReceivables, setWholesaleReceivables] = useState<any>(null);
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-luxury-gray uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-luxury-ivory min-h-screen">
      {/* Header with Live Metal Rates Ticker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-luxury-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-luxury-gold text-xs font-bold uppercase tracking-widest">
            <Gem className="w-4 h-4 text-luxury-gold" /> Shanker Jewells ERP • Trichy
          </div>
          <h1 className="font-serif text-3xl font-bold text-luxury-charcoal mt-1">
            Good Morning, {user?.name || 'Manager'}
          </h1>
          <p className="text-xs text-luxury-gray mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Live Metal Rates Ticker */}
        <div className="flex items-center gap-5 bg-white p-4 rounded-2xl border border-luxury-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs border border-amber-200">
              Au
            </div>
            <div>
              <div className="text-[10px] text-luxury-gray uppercase font-semibold">Live Gold 22K</div>
              <div className="text-sm font-bold text-luxury-charcoal font-mono">₹{gold22k.toLocaleString('en-IN')}/g</div>
            </div>
          </div>

          <div className="h-8 w-px bg-luxury-border" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
              Ag
            </div>
            <div>
              <div className="text-[10px] text-luxury-gray uppercase font-semibold">Live Silver 925</div>
              <div className="text-sm font-bold text-luxury-charcoal font-mono">₹{silver925.toLocaleString('en-IN')}/g</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operations Panel */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-luxury-gray font-bold uppercase tracking-wider mr-2">Quick Operations:</span>
        <Link
          to="/admin/billing"
          className="flex items-center gap-2 px-4 py-2.5 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Retail POS Bill
        </Link>
        <Link
          to="/admin/wholesale"
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-luxury-ivory text-luxury-charcoal font-bold rounded-xl text-xs border border-luxury-border shadow-sm transition-all"
        >
          <Building2 className="w-4 h-4 text-luxury-gold" /> Wholesale Credit Bill
        </Link>
        <Link
          to="/admin/inventory"
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-luxury-ivory text-luxury-charcoal font-bold rounded-xl text-xs border border-luxury-border shadow-sm transition-all"
        >
          <Vault className="w-4 h-4 text-luxury-gold" /> Vault Inventory
        </Link>
        <Link
          to="/admin/custom-requests"
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-luxury-ivory text-luxury-charcoal font-bold rounded-xl text-xs border border-luxury-border shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4 text-luxury-gold" /> Custom Requests
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Vault Gold Stock */}
        <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-luxury-gray uppercase font-bold tracking-wider">Vault Gold Stock</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-luxury-charcoal">
            {inventoryValuation?.totalNetWeight ? `${inventoryValuation.totalNetWeight.toFixed(1)}g` : '0g'}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
            Valuation: ₹{(inventoryValuation?.goldStockValue || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 2: Vault Silver Stock */}
        <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-luxury-gray uppercase font-bold tracking-wider">Vault Silver Reserve</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-luxury-charcoal">
            {inventoryValuation?.totalProducts ? `${inventoryValuation.totalProducts} Items` : '0 Items'}
          </div>
          <div className="text-[11px] text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-md inline-block">
            Valuation: ₹{(inventoryValuation?.silverStockValue || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 3: Wholesale Receivables */}
        <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-luxury-gray uppercase font-bold tracking-wider">Wholesale Receivables</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-amber-700">
            ₹{(wholesaleReceivables?.totalOutstanding || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md inline-block">
            Overdue: ₹{(wholesaleReceivables?.totalOverdue || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 4: Custom Orders */}
        <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-luxury-gray uppercase font-bold tracking-wider">New Custom Requests</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-luxury-charcoal">
            {customRequestsCount} Requests
          </div>
          <div className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md inline-block">
            Pending Staff Review
          </div>
        </div>
      </div>

      {/* Business Workflows & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Business Workflows (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center justify-between border-b border-luxury-border pb-3">
              <span>Business Workflows</span>
              <span className="text-xs text-luxury-gray font-normal">2 Primary Sales Channels</span>
            </h3>

            <div className="space-y-4 text-xs">
              {/* Retail Channel */}
              <div className="p-4 bg-luxury-ivory/60 rounded-xl border border-luxury-border flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-luxury-charcoal text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-luxury-gold" /> 1. Retail Store Sales POS
                  </div>
                  <p className="text-[11px] text-luxury-gray">
                    In-store customer billing with metal-rate calculation, GST 3%, and print receipt.
                  </p>
                </div>
                <Link
                  to="/admin/billing"
                  className="px-4 py-2 bg-luxury-gold text-white rounded-xl font-bold hover:bg-luxury-gold/90 transition-all text-xs shrink-0"
                >
                  Open POS
                </Link>
              </div>

              {/* Wholesale Channel */}
              <div className="p-4 bg-luxury-ivory/60 rounded-xl border border-luxury-border flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-luxury-charcoal text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" /> 2. Wholesale / Credit B2B
                  </div>
                  <p className="text-[11px] text-luxury-gray">
                    Bulk supply to retailer accounts, credit limit checking, dues tracking, & aging.
                  </p>
                </div>
                <Link
                  to="/admin/wholesale"
                  className="px-4 py-2 bg-white text-luxury-charcoal border border-luxury-border rounded-xl font-bold hover:bg-luxury-ivory transition-all text-xs shrink-0 shadow-sm"
                >
                  Open Wholesale
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inventory Alerts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center justify-between border-b border-luxury-border pb-3">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Stock Level Alerts
              </span>
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                {inventoryValuation?.lowStockCount || 0} Low Stock
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-luxury-ivory/60 rounded-xl border border-luxury-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-luxury-charcoal">Out of Stock Items</div>
                  <div className="text-[10px] text-luxury-gray">Requires urgent vault replenishment</div>
                </div>
                <span className="font-bold text-rose-600 font-mono text-sm">
                  {inventoryValuation?.outOfStockCount || 0} Items
                </span>
              </div>

              <div className="p-3.5 bg-luxury-ivory/60 rounded-xl border border-luxury-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-luxury-charcoal">Low Stock Alerts</div>
                  <div className="text-[10px] text-luxury-gray">Items below threshold limit</div>
                </div>
                <span className="font-bold text-amber-600 font-mono text-sm">
                  {inventoryValuation?.lowStockCount || 0} Items
                </span>
              </div>

              <Link
                to="/admin/inventory"
                className="block text-center py-2.5 bg-white hover:bg-luxury-ivory text-luxury-gold font-bold text-xs rounded-xl transition-all border border-luxury-border shadow-sm"
              >
                View Vault Stock Inventory
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
