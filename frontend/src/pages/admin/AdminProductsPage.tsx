import React, { useEffect, useState } from 'react';
import { Product } from '../../types';
import { fetchApi } from '../../api/client';
import {
  Plus,
  Search,
  Upload,
  X,
  Star,
  Package,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle,
} from 'lucide-react';

interface ProductImageInput {
  url: string;
  isPrimary: boolean;
}

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMetal, setSelectedMetal] = useState<'ALL' | 'GOLD' | 'SILVER'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    categoryId: '',
    metalType: 'GOLD',
    purity: 'K22',
    grossWeight: '15.5',
    netWeight: '14.2',
    stoneType: '',
    stoneWeight: '0',
    makingChargeType: 'PER_GRAM',
    makingChargeValue: '400',
    wastageType: 'PERCENTAGE',
    wastageValue: '3.5',
    stoneCharge: '0',
    gstRate: '3.0',
    stockQuantity: '2',
    certification: 'BIS 916 Hallmarked',
    images: [] as ProductImageInput[],
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [search]);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await fetchApi<{ data: Product[] }>(`/products?search=${encodeURIComponent(search)}`);
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetchApi<{ data: any[] }>('/categories');
      setCategories(res.data || []);
      if (res.data && res.data[0]) {
        setFormData((prev) => ({ ...prev, categoryId: res.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = new FormData();
        data.append('image', file);

        const result = await fetchApi<{ success: boolean; url: string }>('/upload/image', {
          method: 'POST',
          body: data,
        });

        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => {
          const existing = [...prev.images];
          const newImages = uploadedUrls.map((url, idx) => ({
            url,
            isPrimary: existing.length === 0 && idx === 0,
          }));
          return {
            ...prev,
            images: [...existing, ...newImages],
          };
        });
      }
    } catch (err: any) {
      alert(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => {
      const updated = prev.images.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return { ...prev, images: updated };
    });
  };

  const setPrimaryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      })),
    }));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const skuVal = formData.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`;
      const barcodeVal = formData.barcode.trim() || `BC-${Date.now().toString().slice(-8)}`;

      const payload = {
        ...formData,
        sku: skuVal,
        barcode: barcodeVal,
        grossWeight: parseFloat(formData.grossWeight) || 0,
        netWeight: parseFloat(formData.netWeight) || 0,
        stoneWeight: parseFloat(formData.stoneWeight) || 0,
        makingChargeValue: parseFloat(formData.makingChargeValue) || 0,
        wastageValue: parseFloat(formData.wastageValue) || 0,
        stoneCharge: parseFloat(formData.stoneCharge) || 0,
        gstRate: parseFloat(formData.gstRate) || 3,
        stockQuantity: parseInt(formData.stockQuantity) || 1,
        images: formData.images.length > 0
          ? formData.images
          : [{ url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800', isPrimary: true }],
      };

      await fetchApi('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setShowModal(false);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesMetal = selectedMetal === 'ALL' || p.metalType === selectedMetal;
    return matchesMetal;
  });

  return (
    <div className="p-8 space-y-6 bg-luxury-ivory min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-luxury-border pb-4">
        <div>
          <span className="text-xs font-bold text-luxury-gold uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-luxury-gold" /> Shanker Jewells Inventory
          </span>
          <h1 className="font-serif text-3xl font-bold text-luxury-charcoal mt-0.5">
            Vault Product Catalogue
          </h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Item To Vault
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-luxury-gray" />
          <input
            type="text"
            placeholder="Search by SKU, barcode, item name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-luxury-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-luxury-gray font-semibold">Metal Filter:</span>
          {(['ALL', 'GOLD', 'SILVER'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMetal(m)}
              className={`px-3 py-1 rounded-lg font-bold uppercase transition-all ${
                selectedMetal === m
                  ? 'bg-luxury-gold text-white shadow-sm'
                  : 'bg-luxury-ivory text-luxury-gray hover:text-luxury-charcoal'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-luxury-border shadow-card overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-xs text-luxury-gray">
            Loading product catalogue...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-xs text-luxury-gray">
            No products found matching search query.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-luxury-border bg-luxury-ivory/50 text-luxury-gray font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Metal & Purity</th>
                <th className="py-3 px-4 text-right">Net Wt / Gross Wt</th>
                <th className="py-3 px-4 text-center">Vault Stock</th>
                <th className="py-3 px-4 text-right font-bold">Dynamic Metal Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/60">
              {filteredProducts.map((p) => {
                const primaryImg = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;

                return (
                  <tr key={p.id} className="hover:bg-luxury-ivory/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-luxury-ivory border border-luxury-border overflow-hidden shrink-0 flex items-center justify-center">
                          {primaryImg ? (
                            <img src={primaryImg} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-luxury-gold/50" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-luxury-charcoal text-xs">{p.name}</div>
                          {p.certification && (
                            <span className="text-[10px] text-luxury-gold font-semibold">{p.certification}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <strong className="text-luxury-charcoal block">{p.sku}</strong>
                      <span className="text-[10px] text-luxury-gray">{p.barcode}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          p.metalType === 'GOLD'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {p.purity} {p.metalType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <strong className="text-luxury-charcoal">{p.netWeight}g Net</strong>
                      <span className="block text-[10px] text-luxury-gray">{p.grossWeight}g Gross</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                          p.stockQuantity <= (p.lowStockThreshold || 1)
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {p.stockQuantity} Units
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-serif text-base font-bold text-luxury-gold font-mono">
                      ₹{(p.displayPrice || p.sellingPrice).toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-luxury-charcoal/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCreateProduct} className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 text-xs shadow-2xl border border-luxury-border my-8">
            <div className="flex justify-between items-center border-b border-luxury-border pb-3">
              <h3 className="font-serif text-lg font-bold text-luxury-charcoal flex items-center gap-2">
                <Package className="w-5 h-5 text-luxury-gold" /> Add New Item To Vault Inventory
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-luxury-gray hover:text-luxury-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-luxury-charcoal block mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 22K Gold Antique Choker Necklace"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                />
              </div>

              <div>
                <label className="font-bold text-luxury-charcoal block mb-1">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.metalType || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-luxury-charcoal block mb-1">Metal Type *</label>
                <select
                  value={formData.metalType}
                  onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                  className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                >
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-luxury-charcoal block mb-1">Purity Grade *</label>
                <select
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                  className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                >
                  <option value="K24">24K Pure Gold (999)</option>
                  <option value="K22">22K Gold (916)</option>
                  <option value="K18">18K Gold (750)</option>
                  <option value="K14">14K Gold (585)</option>
                  <option value="SILVER_925">925 Sterling Silver</option>
                  <option value="SILVER_999">999 Pure Silver</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-luxury-charcoal block mb-1">Gross Weight (grams) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.grossWeight}
                  onChange={(e) => setFormData({ ...formData, grossWeight: e.target.value })}
                  className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 font-mono text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                />
              </div>

              <div>
                <label className="font-bold text-luxury-charcoal block mb-1">Net Metal Weight (grams) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.netWeight}
                  onChange={(e) => setFormData({ ...formData, netWeight: e.target.value })}
                  className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 font-mono text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                />
              </div>

              <div>
                <label className="font-bold text-luxury-charcoal block mb-1">Making Charge / gram (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.makingChargeValue}
                  onChange={(e) => setFormData({ ...formData, makingChargeValue: e.target.value })}
                  className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 font-mono text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                />
              </div>

              <div>
                <label className="font-bold text-luxury-charcoal block mb-1">Vault Stock Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 font-mono text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                />
              </div>

              {/* Multi-Image File Upload & Gallery Section */}
              <div className="sm:col-span-2 space-y-2 pt-2 border-t border-luxury-border">
                <label className="font-bold text-luxury-charcoal block">Product Multi-Image Gallery</label>

                {/* Uploaded Thumbnails Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl border border-luxury-border overflow-hidden h-24 bg-luxury-ivory group">
                        <img src={img.url} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-luxury-charcoal/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(idx)}
                            className={`p-1 rounded-full ${img.isPrimary ? 'bg-amber-500 text-white' : 'bg-white text-luxury-charcoal'}`}
                            title={img.isPrimary ? 'Primary Image' : 'Set as Primary'}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-1 rounded-full bg-rose-600 text-white"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {img.isPrimary && (
                          <span className="absolute bottom-1 left-1 bg-luxury-gold text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload File Input */}
                <label className="border-2 border-dashed border-luxury-border hover:border-luxury-gold rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-luxury-ivory/50">
                  <Upload className="w-6 h-6 text-luxury-gold mb-1" />
                  <span className="text-xs font-bold text-luxury-charcoal">
                    {uploadingImage ? 'Uploading Image Files...' : 'Click or Drag & Drop Product Images'}
                  </span>
                  <span className="text-[10px] text-luxury-gray mt-0.5">Select multiple images (JPG, PNG, WEBP up to 5MB)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-luxury-border">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-white text-luxury-charcoal border border-luxury-border rounded-xl font-bold hover:bg-luxury-ivory transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="px-6 py-2 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Product To Vault'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
