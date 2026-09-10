import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../api/client';
import {
  Handshake,
  Plus,
  Search,
  Building2,
  Phone,
  FileText,
  Percent,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface ConsignmentPartner {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  gstin?: string;
  agreementNumber?: string;
  commissionType: 'PERCENTAGE' | 'PER_GRAM' | 'FIXED';
  commissionBasis: 'TOTAL_SALES' | 'METAL_VALUE' | 'MAKING_CHARGE' | 'CUSTOM';
  commissionValue: number;
  settlementFrequency?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  _count?: {
    consignments: number;
    settlements: number;
  };
}

export const AdminConsignmentPartnersPage: React.FC = () => {
  const [partners, setPartners] = useState<ConsignmentPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    mobile: '',
    whatsapp: '',
    email: '',
    address: '',
    gstin: '',
    agreementNumber: '',
    commissionType: 'PERCENTAGE' as 'PERCENTAGE' | 'PER_GRAM' | 'FIXED',
    commissionBasis: 'TOTAL_SALES' as 'TOTAL_SALES' | 'METAL_VALUE' | 'MAKING_CHARGE' | 'CUSTOM',
    commissionValue: '5',
    settlementFrequency: 'Monthly',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchApi<{ success: boolean; data: ConsignmentPartner[] }>('/consignment/partners');
      if (res.success) {
        setPartners(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load consignment partners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await fetchApi('/consignment/partners', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          commissionValue: parseFloat(formData.commissionValue) || 0,
        }),
      });

      setIsModalOpen(false);
      fetchPartners();
    } catch (err: any) {
      alert(err.message || 'Failed to register consignment partner.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mobile.includes(searchTerm)
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-gold/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-gold font-bold flex items-center gap-3">
            <Handshake className="w-7 h-7 text-luxury-gold" />
            Consignment Retail Partners & Commission Rules
          </h1>
          <p className="text-xs text-luxury-ivory/60 mt-1">
            Register bulk stock placement partners, configure commission formulas & settlement frequency
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-semibold rounded-xl text-xs transition-all shadow-luxury"
        >
          <Plus className="w-4 h-4" /> Register Consignment Partner
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-luxury-charcoal/40 p-4 rounded-2xl border border-luxury-gold/20 backdrop-blur-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-luxury-ivory/40" />
          <input
            type="text"
            placeholder="Search partners by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-luxury-charcoal/80 border border-luxury-gold/20 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold"
          />
        </div>

        <div className="text-xs text-luxury-ivory/60 font-semibold">
          Active Partners: <span className="text-white font-bold">{partners.length}</span>
        </div>
      </div>

      {/* Partner Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-luxury-ivory/60">
          Loading consignment partner accounts...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
          {error}
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="text-center py-16 bg-luxury-charcoal/30 rounded-2xl border border-luxury-gold/10 text-xs text-luxury-ivory/60">
          No consignment partners registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((p) => (
            <div
              key={p.id}
              className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-luxury-gold/50 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white leading-tight">
                      {p.businessName}
                    </h3>
                    {p.contactPerson && (
                      <p className="text-xs text-luxury-ivory/60">Partner Contact: {p.contactPerson}</p>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="text-xs text-luxury-ivory/70 space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-luxury-gold" />
                    <span>{p.mobile}</span>
                  </div>
                  {p.agreementNumber && (
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-luxury-gold" />
                      <span>Agreement #: {p.agreementNumber}</span>
                    </div>
                  )}
                </div>

                {/* Commission Rules Info */}
                <div className="p-3 bg-white/5 rounded-xl border border-luxury-gold/10 space-y-1 text-xs">
                  <span className="text-[10px] text-luxury-gold uppercase font-bold tracking-wider">
                    Configured Commission Policy
                  </span>
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>
                      {p.commissionType === 'PERCENTAGE'
                        ? `${p.commissionValue}% of Sales`
                        : p.commissionType === 'PER_GRAM'
                        ? `₹${p.commissionValue}/gram`
                        : `Fixed ₹${p.commissionValue}`}
                    </span>
                    <span className="text-[10px] text-luxury-ivory/50">Basis: {p.commissionBasis}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add Consignment Partner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-luxury-charcoal border border-luxury-gold/40 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-luxury-gold/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-luxury-gold">
                Register Consignment Partner Business
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
                  Partner Retailer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Silver Emporium"
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
                    placeholder="Owner / Manager"
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

              {/* Commission Configurations */}
              <div className="p-4 bg-white/5 rounded-xl border border-luxury-gold/20 space-y-3">
                <span className="text-[10px] text-luxury-gold font-bold uppercase tracking-wider block">
                  Commission Settings
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-luxury-ivory/70 text-[10px] mb-1">Commission Type</label>
                    <select
                      value={formData.commissionType}
                      onChange={(e) =>
                        setFormData({ ...formData, commissionType: e.target.value as any })
                      }
                      className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-lg px-2 py-1.5 text-white"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="PER_GRAM">Per Gram (₹/g)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-luxury-ivory/70 text-[10px] mb-1">
                      Commission Value *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5 for 5%"
                      value={formData.commissionValue}
                      onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                      className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-lg px-2 py-1.5 text-white font-bold"
                    />
                  </div>
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
                  {saving ? 'Registering...' : 'Register Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsignmentPartnersPage;

