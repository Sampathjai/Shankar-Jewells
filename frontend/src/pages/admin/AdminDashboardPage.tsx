import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency } from '../../utils/formatters';
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
  ArrowRight,
  ShoppingBag,
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
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-luxury-gray uppercase tracking-widest">Loading ERP Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-luxury-ivory min-h-screen">
      {/* Header with Live Metal Rates Ticker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-luxury-border pb-4 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 text-luxury-gold text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <Gem className="w-4 h-4 text-luxury-gold" /> Shanker Jewells ERP • Trichy
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-charcoal mt-1">
            Good Day, {user?.name || 'Manager'}
          </h1>
          <p className="text-xs text-luxury-gray mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Live Metal Rates Ticker */}
        <div className="flex items-center gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-luxury-border shadow-card overflow-x-auto">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs border border-amber-200">
              Au
            </div>
            <div>
              <div className="text-[10px] text-luxury-gray uppercase font-semibold">Live Gold 22K</div>
              <div className="text-xs sm:text-sm font-bold text-luxury-charcoal font-mono">{formatCurrency(gold22k)}/g</div>
            </div>
          </div>

          <div className="h-8 w-px bg-luxury-border shrink-0" />

          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
              Ag
            </div>
            <div>
              <div className="text-[10px] text-luxury-gray uppercase font-semibold">Live Silver 925</div>
              <div className="text-xs sm:text-sm font-bold text-luxury-charcoal font-mono">{formatCurrency(silver925)}/g</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operations Panel (Touch-friendly Horizontal Scroll on Mobile) */}
      <div className="space-y-2">
        <span className="text-[10px] sm:text-xs text-luxury-gray font-bold uppercase tracking-wider block">
          Quick Actions:
        </span>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 custom-admin-scrollbar">
          <Link
            to="/admin/pos"
            className="flex-none flex items-center gap-2 px-4 py-3 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl text-xs shadow-sm transition-all min-h-[48px]"
          >
            <Plus className="w-4 h-4" /> Retail POS Desk
          </Link>
          <Link
            to="/admin/wholesale/billing"
            className="flex-none flex items-center gap-2 px-4 py-3 bg-white hover:bg-luxury-ivory text-luxury-charcoal font-bold rounded-xl text-xs border border-luxury-border shadow-sm transition-all min-h-[48px]"
          >
            <Building2 className="w-4 h-4 text-luxury-gold" /> Wholesale Billing
          </Link>
          <Link
            to="/admin/wholesale/customers"
            className="flex-none flex items-center gap-2 px-4 py-3 bg-white hover:bg-luxury-ivory text-luxury-charcoal font-bold rounded-xl text-xs border border-luxury-border shadow-sm transition-all min-h-[48px]"
          >
            <Building2 className="w-4 h-4 text-luxury-gold" /> Customers Directory
          </Link>
          <Link
            to="/admin/inventory"
            className="flex-none flex items-center gap-2 px-4 py-3 bg-white hover:bg-luxury-ivory text-luxury-charcoal font-bold rounded-xl text-xs border border-luxury-border shadow-sm transition-all min-h-[48px]"
          >
            <Vault className="w-4 h-4 text-luxury-gold" /> Vault Inventory
          </Link>
        </div>
      </div>

      {/* KPI Cards (Mobile Carousel / Desktop Grid) */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 custom-admin-scrollbar">
        {/* Card 1: Vault Gold Stock */}
        <div className="flex-none w-64 sm:w-auto bg-white border border-luxury-border rounded-2xl p-5 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-luxury-gray uppercase font-bold tracking-wider">Vault Gold Stock</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-luxury-charcoal">
            {inventoryValuation?.totalNetWeight ? `${inventoryValuation.totalNetWeight.toFixed(1)}g` : '0g'}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-block font-mono">
            Valuation: {formatCurrency(inventoryValuation?.goldStockValue || 0)}
          </div>
        </div>

        {/* Card 2: Vault Silver Stock */}
        <div className="flex-none w-64 sm:w-auto bg-white border border-luxury-border rounded-2xl p-5 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-luxury-gray uppercase font-bold tracking-wider">Vault Inventory</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-luxury-charcoal">
            {inventoryValuation?.totalProducts ? `${inventoryValuation.totalProducts} Items` : '0 Items'}
          </div>
          <div className="text-[10px] text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-md inline-block font-mono">
            Silver Val: {formatCurrency(inventoryValuation?.silverStockValue || 0)}
          </div>
        </div>

        {/* Card 3: Wholesale Receivables */}
        <div className="flex-none w-64 sm:w-auto bg-white border border-luxury-border rounded-2xl p-5 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-luxury-gray uppercase font-bold tracking-wider">Wholesale Receivables</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-amber-700 font-mono">
            {formatCurrency(wholesaleReceivables?.totalOutstanding || 0)}
          </div>
          <div className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md inline-block font-mono">
            Overdue: {formatCurrency(wholesaleReceivables?.totalOverdue || 0)}
          </div>
        </div>

        {/* Card 4: Custom Orders */}
        <div className="flex-none w-64 sm:w-auto bg-white border border-luxury-border rounded-2xl p-5 shadow-card space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-luxury-gray uppercase font-bold tracking-wider">Custom Requests</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-luxury-charcoal">
            {customRequestsCount} Requests
          </div>
          <div className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md inline-block">
            Pending Staff Review
          </div>
        </div>
      </div>

      {/* Business Workflows & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Business Workflows */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          <div className="bg-white border border-luxury-border rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
            <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center justify-between border-b border-luxury-border pb-3">
              <span>Primary Sales Channels</span>
              <span className="text-xs text-luxury-gray font-normal">Active ERP Desks</span>
            </h3>

            <div className="space-y-3 text-xs">
              {/* Retail Channel */}
              <div className="p-4 bg-luxury-ivory/60 rounded-xl border border-luxury-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-luxury-charcoal text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-luxury-gold" /> 1. Retail Store Sales POS Desk
                  </div>
                  <p className="text-[11px] text-luxury-gray">
                    In-store retail customer billing with metal-rate calculations and optional GST.
                  </p>
                </div>
                <Link
                  to="/admin/pos"
                  className="px-4 py-2.5 bg-luxury-gold text-white rounded-xl font-bold hover:bg-luxury-gold/90 transition-all text-xs text-center min-h-[44px] flex items-center justify-center shrink-0 shadow-sm"
                >
                  Open POS Desk
                </Link>
              </div>

              {/* Wholesale Channel */}
              <div className="p-4 bg-luxury-ivory/60 rounded-xl border border-luxury-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-luxury-charcoal text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" /> 2. Wholesale B2B Billing & Ledger
                  </div>
                  <p className="text-[11px] text-luxury-gray">
                    Bulk retailer billing, credit line checks, customer photo directory, & statements.
                  </p>
                </div>
                <Link
                  to="/admin/wholesale/billing"
                  className="px-4 py-2.5 bg-white text-luxury-charcoal border border-luxury-border rounded-xl font-bold hover:bg-luxury-ivory transition-all text-xs text-center min-h-[44px] flex items-center justify-center shrink-0 shadow-sm"
                >
                  Open Wholesale Billing
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          <div className="bg-white border border-luxury-border rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
            <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center justify-between border-b border-luxury-border pb-3">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Stock Level Alerts
              </span>
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md font-mono">
                {inventoryValuation?.lowStockCount || 0} Alerts
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-luxury-ivory/60 rounded-xl border border-luxury-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-luxury-charcoal">Out of Stock Items</div>
                  <div className="text-[10px] text-luxury-gray">Requires vault replenishment</div>
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
                className="block text-center py-2.5 bg-white hover:bg-luxury-ivory text-luxury-gold font-bold text-xs rounded-xl transition-all border border-luxury-border shadow-sm min-h-[44px] flex items-center justify-center"
              >
                View Vault Inventory Directory
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
