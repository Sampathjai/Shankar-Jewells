import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../api/client';
import { DollarSign, Package, Vault, Sparkles, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetchApi<{ data: any }>('/reports/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-8 text-center">
        <div className="w-10 h-10 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-luxury-gray">Loading real-time vault analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
          Executive Dashboard
        </span>
        <h1 className="font-serif text-3xl font-bold text-luxury-charcoal">
          Store Operations & Vault Metrics
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-luxury-border shadow-card space-y-2">
          <div className="flex justify-between items-center text-luxury-gold">
            <span className="text-xs font-semibold uppercase">Today's Revenue</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="font-serif text-3xl font-bold text-luxury-charcoal">
            ₹{stats.todaySales.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">Real-time POS finalized</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-luxury-border shadow-card space-y-2">
          <div className="flex justify-between items-center text-luxury-gold">
            <span className="text-xs font-semibold uppercase">This Month Sales</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="font-serif text-3xl font-bold text-luxury-charcoal">
            ₹{stats.monthSales.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-luxury-gray">{stats.totalOrders} total completed orders</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-luxury-border shadow-card space-y-2">
          <div className="flex justify-between items-center text-luxury-gold">
            <span className="text-xs font-semibold uppercase">Vault Gold Net Wt</span>
            <Vault className="w-5 h-5" />
          </div>
          <div className="font-serif text-3xl font-bold text-luxury-charcoal">
            {stats.vaultStock.totalNetWeight}g
          </div>
          <span className="text-[10px] text-luxury-gray">{stats.vaultStock.totalUnits} active inventory items</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-luxury-border shadow-card space-y-2">
          <div className="flex justify-between items-center text-luxury-gold">
            <span className="text-xs font-semibold uppercase">Pending Designs</span>
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="font-serif text-3xl font-bold text-luxury-charcoal">
            {stats.pendingCustomRequests}
          </div>
          <span className="text-[10px] text-amber-700 font-medium">Custom requests awaiting quotes</span>
        </div>
      </div>

      {/* Recent Orders & Quick POS Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-4">
          <div className="flex justify-between items-center border-b border-luxury-border pb-3">
            <h3 className="font-serif text-lg font-bold text-luxury-charcoal">Recent POS Transactions</h3>
            <Link to="/admin/invoices" className="text-xs text-luxury-gold font-semibold uppercase flex items-center gap-1">
              View Invoices <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-xs text-luxury-gray">No transactions recorded yet.</p>
            ) : (
              stats.recentOrders.map((ord: any) => (
                <div key={ord.id} className="p-3 bg-luxury-beige/30 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-luxury-charcoal">{ord.orderNumber}</strong>
                    <span className="text-luxury-gray block text-[10px]">
                      Customer: {ord.customer?.name || 'Walk-in'} • {new Date(ord.createdAt).toLocaleTimeString('en-IN')}
                    </span>
                  </div>
                  <strong className="font-serif text-base text-luxury-gold">
                    ₹{ord.grandTotal.toLocaleString('en-IN')}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Billing Launch Card */}
        <div className="bg-luxury-charcoal text-luxury-ivory rounded-2xl p-6 border border-luxury-gold/30 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <span className="text-xs text-luxury-gold uppercase tracking-widest font-semibold">Fast Checkout</span>
            <h3 className="font-serif text-2xl font-bold text-white">Jewellery POS Terminal</h3>
            <p className="text-xs text-luxury-ivory/70 leading-relaxed">
              Launch the high-speed barcode scanning & split payment billing screen for counter sales.
            </p>
          </div>

          <Link
            to="/admin/billing"
            className="w-full py-3.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all text-center shadow-luxury"
          >
            Launch POS Desk
          </Link>
        </div>
      </div>
    </div>
  );
};

