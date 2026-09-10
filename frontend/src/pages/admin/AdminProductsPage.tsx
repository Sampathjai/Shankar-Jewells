import React, { useEffect, useState } from 'react';
import { Product } from '../../types';
import { fetchApi } from '../../api/client';
import { Plus, Search, Edit2, ShieldCheck, Trash2 } from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

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
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800',
  });

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [search]);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await fetchApi<{ data: Product[] }>(`/products?search=${encodeURIComponent(search)}`);
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetchApi<{ data: any[] }>('/categories');
      setCategories(res.data);
      if (res.data[0]) setFormData((prev) => ({ ...prev, categoryId: res.data[0].id }));
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/products', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          images: [{ url: formData.imageUrl }],
        }),
      });

      setShowModal(false);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to create product.');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
            Vault Stock Catalogue
          </span>
          <h1 className="font-serif text-3xl font-bold text-luxury-charcoal">
            Product Management
          </h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center gap-2 shadow-luxury"
        >
          <Plus className="w-4 h-4" /> Add New Item To Vault
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by SKU, barcode, name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs py-2.5 pl-3 pr-9 rounded-lg border border-luxury-border"
        />
        <Search className="w-4 h-4 text-luxury-gray absolute right-3 top-3" />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-luxury-border shadow-card overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-luxury-border bg-luxury-beige/40 text-luxury-gold font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">SKU / Barcode</th>
              <th className="py-3 px-4">Item Name</th>
              <th className="py-3 px-4">Metal & Purity</th>
              <th className="py-3 px-4">Net Wt / Gross Wt</th>
              <th className="py-3 px-4">Stock Qty</th>
              <th className="py-3 px-4">Live Dynamic Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxury-border/50">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-luxury-beige/20 transition-colors">
                <td className="py-3 px-4 font-mono text-[11px]">
                  <strong className="text-luxury-charcoal block">{p.sku}</strong>
                  <span className="text-[10px] text-luxury-gray">{p.barcode}</span>
                </td>
                <td className="py-3 px-4 font-semibold text-luxury-charcoal flex items-center gap-2">
                  <img src={p.images[0]?.url} alt="" className="w-8 h-8 rounded object-cover border" />
                  {p.name}
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-luxury-beige text-luxury-gold font-bold">
                    {p.purity} {p.metalType}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <strong>{p.netWeight}g Net</strong> / {p.grossWeight}g Gross
                </td>
                <td className="py-3 px-4 font-bold">
                  <span className={p.stockQuantity <= 1 ? 'text-red-600 font-bold' : 'text-emerald-700'}>
                    {p.stockQuantity} units
                  </span>
                </td>
                <td className="py-3 px-4 font-serif text-base font-bold text-luxury-gold">
                  ₹{(p.displayPrice || p.sellingPrice).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCreateProduct} className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 text-xs">
            <h3 className="font-serif text-xl font-bold border-b pb-2">Add New Jewellery Item</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">SKU *</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Metal</label>
                <select
                  value={formData.metalType}
                  onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Purity</label>
                <select
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="K22">22K Gold</option>
                  <option value="K18">18K Gold</option>
                  <option value="K24">24K Pure</option>
                  <option value="SILVER_925">925 Silver</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Gross Weight (g)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.grossWeight}
                  onChange={(e) => setFormData({ ...formData, grossWeight: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Net Weight (g)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.netWeight}
                  onChange={(e) => setFormData({ ...formData, netWeight: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Making Charge / g (₹)</label>
                <input
                  type="number"
                  value={formData.makingChargeValue}
                  onChange={(e) => setFormData({ ...formData, makingChargeValue: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-luxury-gold text-white font-semibold rounded"
              >
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

