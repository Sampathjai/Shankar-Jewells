import React, { useState } from 'react';
import { Sparkles, Upload, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomJewelleryPage: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    jewelleryType: 'Necklace',
    metalType: 'GOLD',
    purity: 'K22',
    approxBudget: '',
    approxWeight: '',
    quantity: '1',
    occasion: '',
    requiredDate: '',
    notes: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).slice(0, 5); // Limit 5
      setImages(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.jewelleryType) {
      alert('Please fill in your name, phone number, and jewellery type.');
      return;
    }

    try {
      setSubmitting(true);

      const body = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (val) body.append(key, val);
      });

      images.forEach((file) => body.append('images', file));

      const response = await fetch('/api/custom-requests', {
        method: 'POST',
        body,
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.message || 'Failed to submit request');
      }

      setSuccessData(res.data);
    } catch (err: any) {
      alert(err.message || 'An error occurred while submitting design.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
          Request Submitted Successfully
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-luxury-charcoal">
          Request Reference: {successData.requestNumber}
        </h1>
        <p className="text-xs text-luxury-gray max-w-md mx-auto leading-relaxed">
          Thank you, <strong>{successData.name}</strong>! Our master artisan craftsmen are evaluating your reference photos and weight parameters. You will receive an official versioned quotation estimate via WhatsApp & email within 24 hours.
        </p>

        <div className="p-4 bg-luxury-beige/50 rounded-xl border border-luxury-gold/30 text-left max-w-md mx-auto space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Jewellery Type:</span>
            <strong>{successData.jewelleryType}</strong>
          </div>
          <div className="flex justify-between">
            <span>Metal & Purity:</span>
            <strong>{successData.purity} {successData.metalType}</strong>
          </div>
          <div className="flex justify-between">
            <span>Est. Budget:</span>
            <strong>{successData.approxBudget ? `₹${Number(successData.approxBudget).toLocaleString('en-IN')}` : 'Flexible'}</strong>
          </div>
        </div>

        <button
          onClick={() => (window.location.href = '/')}
          className="px-8 py-3 rounded-full bg-luxury-gold text-white font-semibold text-xs uppercase tracking-widest hover:bg-luxury-gold-dark transition-all"
        >
          Return To Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-luxury-gold/20 text-luxury-gold text-xs font-semibold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" /> Bespoke Custom Jewellery Atelier
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-luxury-charcoal">
          Create Jewellery That Is Uniquely Yours
        </h1>
        <p className="text-xs sm:text-sm text-luxury-gray leading-relaxed font-light">
          Have a sketch, Pinterest pin, or magazine reference? Upload your design photos and our master craftsmen will calculate gold weight, wastage, making charges, and send a custom versioned quotation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-10 border border-luxury-border shadow-card space-y-8">
        {/* Section 1: Customer Contact */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-luxury-charcoal border-b border-luxury-border pb-2">
            1. Your Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Sunita Mehta"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">WhatsApp Number (For Quotations)</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Email Address</label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Jewellery Parameters */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-luxury-charcoal border-b border-luxury-border pb-2">
            2. Jewellery Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Jewellery Type *</label>
              <select
                value={formData.jewelleryType}
                onChange={(e) => setFormData({ ...formData, jewelleryType: e.target.value })}
                className="w-full py-2.5 px-3 rounded-md border border-luxury-border bg-white"
              >
                <option value="Necklace">Necklace / Haram / Choker</option>
                <option value="Ring">Solitaire / Cocktail Ring</option>
                <option value="Earrings">Jhumkas / Chandbalis / Studs</option>
                <option value="Bangle">Kangan / Kadha / Bangles</option>
                <option value="Bracelet">Delicate Bracelet</option>
                <option value="Chain">Chain & Mangalsutra</option>
                <option value="Pendant">Deity / Diamond Pendant</option>
                <option value="Anklet">Silver Payal / Anklet</option>
                <option value="Other">Other Custom Craft</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Metal</label>
              <select
                value={formData.metalType}
                onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                className="w-full py-2.5 px-3 rounded-md border border-luxury-border bg-white"
              >
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Purity</label>
              <select
                value={formData.purity}
                onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                className="w-full py-2.5 px-3 rounded-md border border-luxury-border bg-white"
              >
                <option value="K22">22K Gold (91.6% BIS)</option>
                <option value="K18">18K Gold (75.0% Diamond Set)</option>
                <option value="K24">24K Pure Bullion</option>
                <option value="SILVER_925">925 Sterling Silver</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Approx. Budget (₹)</label>
              <input
                type="number"
                placeholder="e.g. 250000"
                value={formData.approxBudget}
                onChange={(e) => setFormData({ ...formData, approxBudget: e.target.value })}
                className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Target Weight (Grams)</label>
              <input
                type="number"
                placeholder="e.g. 35.5"
                value={formData.approxWeight}
                onChange={(e) => setFormData({ ...formData, approxWeight: e.target.value })}
                className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Required Date</label>
              <input
                type="date"
                value={formData.requiredDate}
                onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Reference Image Upload */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-luxury-charcoal border-b border-luxury-border pb-2">
            3. Upload Reference Design Images
          </h3>

          <div className="border-2 border-dashed border-luxury-gold/40 rounded-xl p-6 text-center bg-luxury-beige/30 relative">
            <Upload className="w-8 h-8 text-luxury-gold mx-auto mb-2" />
            <p className="text-xs font-semibold text-luxury-charcoal">
              Drag & drop up to 5 design photos or click to browse
            </p>
            <p className="text-[10px] text-luxury-gray mt-1">
              Supports JPG, JPEG, PNG, WEBP (Max 10MB per image)
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {images.map((f, idx) => (
                <span key={idx} className="px-3 py-1 bg-luxury-beige rounded-full border border-luxury-gold/30 text-luxury-charcoal">
                  📷 {f.name}
                </span>
              ))}
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-xs">Additional Custom Instructions</label>
            <textarea
              rows={3}
              placeholder="Describe gemstone preferences, antique polish finish, chain length, or engraving text..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full py-2.5 px-3 text-xs rounded-md border border-luxury-border"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury"
        >
          {submitting ? 'Submitting Design Request...' : 'Submit Design Request'}
        </button>
      </form>
    </div>
  );
};

