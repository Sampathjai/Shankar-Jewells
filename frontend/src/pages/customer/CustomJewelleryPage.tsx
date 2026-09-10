import React, { useState, useRef } from 'react';
import { Sparkles, Upload, CheckCircle2, Camera, Trash2, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { fetchApi } from '../../api/client';
import { formatCurrency } from '../../utils/formatters';

export const CustomJewelleryPage: React.FC = () => {
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleFileAdd = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - images.length);
    const mapped = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...mapped].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.jewelleryType) {
      alert('Please fill in your name, phone number, and jewellery type.');
      return;
    }

    try {
      setSubmitting(true);

      const body = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (val) body.append(key, val);
      });

      images.forEach((item) => body.append('images', item.file));

      const response = await fetch('/api/custom-requests', {
        method: 'POST',
        body,
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.message || 'Failed to submit design request');
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
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
          Request Submitted Successfully
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-luxury-charcoal">
          Reference Number: {successData.requestNumber}
        </h1>
        <p className="text-xs text-luxury-gray max-w-md mx-auto leading-relaxed">
          Thank you, <strong>{successData.name}</strong>! Our master artisan craftsmen are reviewing your reference photos and weight specifications. You will receive an official estimate via WhatsApp & email within 24 hours.
        </p>

        <div className="p-4 bg-luxury-ivory/80 rounded-2xl border border-luxury-border text-left max-w-md mx-auto space-y-2 text-xs font-mono shadow-sm">
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
            <strong>{successData.approxBudget ? formatCurrency(successData.approxBudget) : 'Flexible'}</strong>
          </div>
        </div>

        <button
          onClick={() => (window.location.href = '/')}
          className="px-8 py-3.5 rounded-full bg-luxury-gold text-white font-bold text-xs uppercase tracking-widest hover:bg-luxury-gold/90 transition-all shadow-sm"
        >
          Return To Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-luxury-gold/20 text-luxury-gold text-xs font-bold uppercase tracking-widest border border-luxury-gold/40">
          <Sparkles className="w-3.5 h-3.5" /> Bespoke Custom Jewellery Studio
        </span>
        <h1 className="font-serif text-2xl sm:text-5xl font-bold text-luxury-charcoal">
          Create Jewellery That Is Uniquely Yours
        </h1>
        <p className="text-xs sm:text-sm text-luxury-gray leading-relaxed font-light">
          Upload reference photos, Pinterest pins, or hand-drawn sketches. Our master craftsmen calculate gold weight, wastage, making charges, and issue custom versioned estimates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-10 border border-luxury-border shadow-card space-y-8">
        {/* Section 1: Customer Contact */}
        <div className="space-y-4">
          <h3 className="font-serif text-base sm:text-lg font-bold text-luxury-charcoal uppercase tracking-wider border-b border-luxury-border pb-2">
            1. Your Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-luxury-charcoal mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Sunita Mehta"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border focus:outline-none focus:border-luxury-gold font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-luxury-charcoal mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 98424 12345"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border font-mono focus:outline-none focus:border-luxury-gold"
              />
            </div>
            <div>
              <label className="block font-semibold text-luxury-gray mb-1">WhatsApp Number (For Quotation)</label>
              <input
                type="tel"
                placeholder="+91 98424 12345"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border font-mono focus:outline-none focus:border-luxury-gold"
              />
            </div>
            <div>
              <label className="block font-semibold text-luxury-gray mb-1">Email Address</label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border focus:outline-none focus:border-luxury-gold"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Jewellery Parameters */}
        <div className="space-y-4">
          <h3 className="font-serif text-base sm:text-lg font-bold text-luxury-charcoal uppercase tracking-wider border-b border-luxury-border pb-2">
            2. Jewellery Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-luxury-charcoal mb-1">Jewellery Type *</label>
              <select
                value={formData.jewelleryType}
                onChange={(e) => setFormData({ ...formData, jewelleryType: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border bg-white font-medium focus:outline-none focus:border-luxury-gold"
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
              <label className="block font-bold text-luxury-charcoal mb-1">Metal</label>
              <select
                value={formData.metalType}
                onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border bg-white font-medium focus:outline-none focus:border-luxury-gold"
              >
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-luxury-charcoal mb-1">Purity</label>
              <select
                value={formData.purity}
                onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border bg-white font-medium focus:outline-none focus:border-luxury-gold"
              >
                <option value="K22">22K Gold (91.6% BIS Hallmark)</option>
                <option value="K18">18K Gold (75.0% Diamond Set)</option>
                <option value="K24">24K Pure Bullion</option>
                <option value="SILVER_925">925 Sterling Silver</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-luxury-charcoal mb-1">Approx. Budget (₹)</label>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={formData.approxBudget}
                onChange={(e) => setFormData({ ...formData, approxBudget: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border font-mono focus:outline-none focus:border-luxury-gold"
              />
            </div>

            <div>
              <label className="block font-bold text-luxury-charcoal mb-1">Target Weight (Grams)</label>
              <input
                type="number"
                placeholder="e.g. 24.5"
                value={formData.approxWeight}
                onChange={(e) => setFormData({ ...formData, approxWeight: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border font-mono focus:outline-none focus:border-luxury-gold"
              />
            </div>

            <div>
              <label className="block font-bold text-luxury-charcoal mb-1">Required Date</label>
              <input
                type="date"
                value={formData.requiredDate}
                onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border focus:outline-none focus:border-luxury-gold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Reference Image Upload & Mobile Camera */}
        <div className="space-y-4">
          <h3 className="font-serif text-base sm:text-lg font-bold text-luxury-charcoal uppercase tracking-wider border-b border-luxury-border pb-2">
            3. Reference Design Photos
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Camera Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="py-3 px-4 bg-luxury-gold text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm min-h-[48px]"
            >
              <Camera className="w-4 h-4" /> Take Photo With Camera
            </button>

            {/* Upload Gallery Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-4 bg-luxury-ivory hover:bg-white text-luxury-charcoal border border-luxury-border font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm min-h-[48px]"
            >
              <Upload className="w-4 h-4 text-luxury-gold" /> Upload From Photo Gallery
            </button>

            {/* Hidden File Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileAdd(e.target.files)}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileAdd(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Previews Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
              {images.map((item, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-luxury-border shadow-sm group">
                  <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block font-bold text-luxury-charcoal mb-1 text-xs">Custom Crafting Instructions</label>
            <textarea
              rows={3}
              placeholder="Describe gemstone preferences, antique polish finish, chain length, or custom engraving text..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full py-2.5 px-3 text-xs rounded-xl border border-luxury-border focus:outline-none focus:border-luxury-gold"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-luxury-gold text-white font-bold text-xs uppercase tracking-widest hover:bg-luxury-gold/90 transition-all flex items-center justify-center gap-2 shadow-sm min-h-[48px]"
        >
          {submitting ? 'Submitting Design Request...' : 'Submit Design Request'}
        </button>
      </form>
    </div>
  );
};

export default CustomJewelleryPage;
