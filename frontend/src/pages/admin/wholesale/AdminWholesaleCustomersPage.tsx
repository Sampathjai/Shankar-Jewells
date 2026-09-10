import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../../api/client';
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

interface WholesaleCustomer {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  pan?: string;
  creditLimit: number;
  outstandingBalance: number;
  paymentTerms: string;
  dueDays: number;
  status: 'ACTIVE' | 'ON_HOLD' | 'BLOCKED' | 'INACTIVE';
  _count?: {
    invoices: number;
    payments: number;
  };
}

export const AdminWholesaleCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<WholesaleCustomer | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    mobile: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
    pan: '',
    creditLimit: '500000',
    paymentTerms: '30 Days',
    dueDays: '30',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchApi<{ success: boolean; data: WholesaleCustomer[] }>('/wholesale/customers');
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load wholesale customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      businessName: '',
      contactPerson: '',
      mobile: '',
      whatsapp: '',
      email: '',
      address: '',
      city: '',
      state: '',
      gstin: '',
      pan: '',
      creditLimit: '500000',
      paymentTerms: '30 Days',
      dueDays: '30',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await fetchApi('/wholesale/customers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to save wholesale customer');
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-gold font-bold flex items-center gap-3">
            <Building2 className="w-7 h-7 text-luxury-gold" />
            Wholesale B2B Customer Profiles
          </h1>
          <p className="text-xs text-luxury-ivory/60 mt-1">
            Manage jewellery retailers, credit limits, outstanding balances & payment terms
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-semibold rounded-xl text-xs transition-all shadow-luxury"
        >
          <Plus className="w-4 h-4" /> Add Wholesale Customer
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-luxury-charcoal/40 p-4 rounded-2xl border border-luxury-gold/20 backdrop-blur-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-luxury-ivory/40" />
          <input
            type="text"
            placeholder="Search by business name, phone or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-luxury-charcoal/80 border border-luxury-gold/20 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold"
          />
        </div>

        <div className="text-xs text-luxury-ivory/60 font-semibold">
          Total Customers: <span className="text-white font-bold">{customers.length}</span>
        </div>
      </div>

      {/* Grid Cards of Customers */}
      {loading ? (
        <div className="text-center py-16 text-xs text-luxury-ivory/60">
          Loading wholesale customer accounts...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
          {error}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-16 bg-luxury-charcoal/30 rounded-2xl border border-luxury-gold/10 text-xs text-luxury-ivory/60">
          No wholesale customers found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((c) => {
            const availableCredit = Math.max(0, c.creditLimit - c.outstandingBalance);

            return (
              <div
                key={c.id}
                className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-luxury-gold/50 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white leading-tight">
                        {c.businessName}
                      </h3>
                      {c.contactPerson && (
                        <p className="text-xs text-luxury-ivory/60">Contact: {c.contactPerson}</p>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="text-xs text-luxury-ivory/70 space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-luxury-gold" />
                      <span>{c.mobile}</span>
                    </div>
                    {c.gstin && (
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-luxury-gold" />
                        <span>GSTIN: {c.gstin}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-luxury-gold/10 text-xs">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-luxury-gold/10">
                      <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Credit Limit</span>
                      <div className="font-bold text-white">₹{c.creditLimit.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl border border-luxury-gold/10">
                      <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Outstanding Dues</span>
                      <div className="font-bold text-amber-400">₹{c.outstandingBalance.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-luxury-gold/20 flex items-center justify-between gap-2 text-xs">
                  <Link
                    to={`/admin/wholesale/ledger/${c.id}`}
                    className="flex-1 py-2 bg-luxury-gold/10 hover:bg-luxury-gold hover:text-luxury-charcoal text-luxury-gold font-semibold rounded-xl text-center transition-all border border-luxury-gold/30 flex items-center justify-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> View Ledger
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Add Wholesale Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-luxury-charcoal border border-luxury-gold/40 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-luxury-gold/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-luxury-gold">
                Register New Wholesale Business Customer
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-luxury-ivory/50 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">
                  Business / Jewellery Shop Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Jewellers Pvt Ltd"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-luxury-ivory/70 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Owner / Manager name"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-luxury-ivory/70 font-semibold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-luxury-ivory/70 font-semibold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="33AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-luxury-ivory/70 font-semibold mb-1">Credit Limit (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="500000"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-luxury-ivory/70 font-semibold mb-1">Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="45 Days">45 Days</option>
                    <option value="60 Days">60 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-luxury-ivory/70 font-semibold mb-1">City / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Trichy, Madurai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-luxury-gold/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-luxury-ivory/70 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-semibold rounded-xl shadow-luxury"
                >
                  {saving ? 'Saving...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWholesaleCustomersPage;

