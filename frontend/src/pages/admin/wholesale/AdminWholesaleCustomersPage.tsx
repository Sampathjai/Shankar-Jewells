import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../../api/client';
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  FileSpreadsheet,
  AlertTriangle,
  X,
  CreditCard,
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
        setCustomers(res.data || []);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        dueDays: parseInt(formData.dueDays) || 30,
      };

      if (editingCustomer) {
        await fetchApi(`/wholesale/customers/${editingCustomer.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/wholesale/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to save customer account.');
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
    <div className="p-8 space-y-6 bg-luxury-ivory min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-border pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-charcoal font-bold flex items-center gap-3">
            <Building2 className="w-7 h-7 text-luxury-gold" />
            Wholesale B2B Customer Profiles
          </h1>
          <p className="text-xs text-luxury-gray mt-1">
            Manage jewellery retailers, approved credit limits, outstanding balances & payment terms.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Wholesale Customer
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-luxury-gray" />
          <input
            type="text"
            placeholder="Search by business name, phone or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-luxury-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
          />
        </div>

        <div className="text-xs text-luxury-gray font-semibold">
          Total B2B Customers: <span className="text-luxury-charcoal font-bold">{customers.length}</span>
        </div>
      </div>

      {/* Grid Cards of Customers */}
      {loading ? (
        <div className="text-center py-16 text-xs text-luxury-gray">
          Loading wholesale customer accounts...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-luxury-border shadow-card text-xs text-luxury-gray">
          No wholesale customers found matching query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((c) => {
            const availableCredit = Math.max(0, c.creditLimit - c.outstandingBalance);

            return (
              <div
                key={c.id}
                className="bg-white border border-luxury-border rounded-2xl p-5 shadow-card flex flex-col justify-between space-y-4 hover:border-luxury-gold/50 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-luxury-charcoal leading-tight">
                        {c.businessName}
                      </h3>
                      {c.contactPerson && (
                        <p className="text-xs text-luxury-gray">Contact: {c.contactPerson}</p>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="text-xs text-luxury-gray space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-luxury-gold" />
                      <span>{c.mobile}</span>
                    </div>
                    {c.gstin && (
                      <div className="text-[11px] font-mono text-luxury-gray">
                        GSTIN: <span className="font-semibold text-luxury-charcoal">{c.gstin}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Stats Box */}
                  <div className="p-3 bg-luxury-ivory/60 rounded-xl border border-luxury-border grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-luxury-gray">Credit Limit</span>
                      <div className="font-mono font-bold text-luxury-charcoal">₹{c.creditLimit.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-luxury-gray">Outstanding</span>
                      <div className="font-mono font-bold text-amber-700">₹{c.outstandingBalance.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-luxury-border flex items-center justify-between gap-2">
                  <Link
                    to={`/admin/wholesale/ledger/${c.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-luxury-gold hover:underline"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> View Ledger
                  </Link>

                  <button
                    onClick={() => {
                      setEditingCustomer(c);
                      setFormData({
                        businessName: c.businessName,
                        contactPerson: c.contactPerson || '',
                        mobile: c.mobile,
                        whatsapp: c.whatsapp || '',
                        email: c.email || '',
                        address: c.address || '',
                        city: c.city || '',
                        state: c.state || '',
                        gstin: c.gstin || '',
                        pan: c.pan || '',
                        creditLimit: c.creditLimit.toString(),
                        paymentTerms: c.paymentTerms,
                        dueDays: c.dueDays.toString(),
                        notes: '',
                      });
                      setIsModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-white border border-luxury-border text-luxury-charcoal rounded-lg font-bold text-xs hover:bg-luxury-ivory transition-all shadow-sm"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-luxury-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-luxury-border rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-luxury-border pb-3">
              <h3 className="font-serif text-lg font-bold text-luxury-charcoal">
                {editingCustomer ? 'Edit Wholesale Customer Profile' : 'Register New Wholesale Retailer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-luxury-gray hover:text-luxury-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-luxury-charcoal font-bold mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-luxury-charcoal font-bold mb-1">Mobile / Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-luxury-gray font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-luxury-gray font-semibold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="33AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 font-mono text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-luxury-charcoal font-bold mb-1">Credit Limit (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 font-mono text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-luxury-charcoal font-bold mb-1">Payment Terms *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NET 30 Days"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-luxury-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white text-luxury-charcoal border border-luxury-border rounded-xl font-bold hover:bg-luxury-ivory transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
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
