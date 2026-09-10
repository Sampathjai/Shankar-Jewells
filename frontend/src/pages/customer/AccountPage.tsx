import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchApi } from '../../api/client';
import { User as UserIcon, Package, Sparkles, FileText, Download, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [ordRes, reqRes] = await Promise.all([
          fetchApi<{ data: any[] }>('/billing/orders'),
          fetchApi<{ data: any[] }>('/custom-requests'),
        ]);
        setOrders(ordRes.data);
        setRequests(reqRes.data);
      } catch (err) {
        console.error('Failed to load customer account data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-luxury-gold/10 text-luxury-gold flex items-center justify-center font-serif text-2xl font-bold">
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-luxury-charcoal">{user?.name}</h1>
            <p className="text-xs text-luxury-gray">{user?.email} • {user?.phone || 'No phone'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-luxury-beige text-[10px] text-luxury-gold font-bold uppercase">
              {user?.role} Account
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-full border border-red-200 text-red-600 text-xs font-semibold uppercase hover:bg-red-50 transition-all flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Orders Section */}
      <div className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-4">
        <h3 className="font-serif text-xl font-bold text-luxury-charcoal flex items-center gap-2 border-b border-luxury-border pb-3">
          <Package className="w-5 h-5 text-luxury-gold" /> Order & Invoice History
        </h3>

        {orders.length === 0 ? (
          <p className="text-xs text-luxury-gray py-4">No order history found.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((ord) => (
              <div key={ord.id} className="p-4 bg-luxury-beige/30 rounded-xl border border-luxury-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-luxury-charcoal text-sm">{ord.orderNumber}</strong>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-luxury-gray mt-1">
                    Date: {new Date(ord.createdAt).toLocaleDateString('en-IN')} • Items: {ord.items.length}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-[10px] text-luxury-gray uppercase block">Grand Total</span>
                    <strong className="font-serif text-lg text-luxury-gold">
                      ₹{ord.grandTotal.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  {ord.invoices[0] && (
                    <a
                      href={`/api/billing/invoices/${ord.invoices[0].invoiceNumber}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-full border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-white transition-all"
                      title="Download PDF Invoice"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Requests Section */}
      <div className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-4">
        <h3 className="font-serif text-xl font-bold text-luxury-charcoal flex items-center gap-2 border-b border-luxury-border pb-3">
          <Sparkles className="w-5 h-5 text-luxury-gold" /> Custom Design Requests
        </h3>

        {requests.length === 0 ? (
          <p className="text-xs text-luxury-gray py-4">No custom jewellery requests submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="p-4 bg-luxury-beige/30 rounded-xl border border-luxury-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-luxury-charcoal text-sm">{req.requestNumber}</strong>
                    <span className="px-2 py-0.5 rounded bg-luxury-gold/20 text-luxury-gold text-[10px] font-bold uppercase">
                      {req.status}
                    </span>
                  </div>
                  <p className="text-luxury-gray mt-1">
                    {req.jewelleryType} • {req.purity} {req.metalType} • Date: {new Date(req.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>

                {req.quotations[0] && (
                  <button
                    onClick={() => navigate(`/quotation/${req.quotations[0].secureToken}`)}
                    className="px-4 py-2 rounded-full bg-luxury-gold text-white font-semibold text-xs uppercase tracking-wider hover:bg-luxury-gold-dark transition-all"
                  >
                    View Active Quotation
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

