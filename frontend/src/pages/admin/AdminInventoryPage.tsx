import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../api/client';
import {
  Vault,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Package,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  TrendingUp,
  Image as ImageIcon,
  DollarSign,
} from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const [summary, setSummary] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetal, setSelectedMetal] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('New Vault Stock Receipt');

  // Add Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    metalType: 'GOLD',
    purity: 'K22',
    grossWeight: 10,
    stoneWeight: 0,
    netWeight: 10,
    makingChargeType: 'PER_GRAM',
    makingChargeValue: 400,
    wastageType: 'PERCENTAGE',
    wastageValue: 3.5,
    stoneCharge: 0,
    otherCharges: 0,
    gstRate: 3.0,
    stockQuantity: 1,
    lowStockThreshold: 1,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [invRes, txRes, catRes] = await Promise.all([
        fetchApi<{ summary: any; data: any[] }>('/inventory'),
        fetchApi<{ data: any[] }>('/inventory/transactions'),
        fetchApi<{ data: any[] }>('/categories'),
      ]);
      setSummary(invRes.summary);
      setProducts(invRes.data || []);
      setTransactions(txRes.data || []);
      setCategories(catRes.data || []);
      if (catRes.data && catRes.data.length > 0) {
        setProductForm((prev) => ({ ...prev, categoryId: catRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const generatedSku =
        productForm.sku.trim() ||
        `${productForm.metalType.slice(0, 3)}-${productForm.purity}-${Date.now().toString().slice(-4)}`;

      const payload = {
        ...productForm,
        sku: generatedSku,
        grossWeight: Number(productForm.grossWeight) || 0,
        netWeight: Number(productForm.netWeight) || 0,
        stoneWeight: Number(productForm.stoneWeight) || 0,
        makingChargeValue: Number(productForm.makingChargeValue) || 0,
        wastageValue: Number(productForm.wastageValue) || 0,
        stoneCharge: Number(productForm.stoneCharge) || 0,
        otherCharges: Number(productForm.otherCharges) || 0,
        stockQuantity: Number(productForm.stockQuantity) || 1,
        images: productForm.imageUrl ? [{ url: productForm.imageUrl, isPrimary: true }] : [],
      };

      await fetchApi('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert(`Product ${generatedSku} added successfully to inventory!`);
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create product.');
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;

    try {
      await fetchApi('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProductForAdjust.id,
          quantityDelta: adjustQty,
          notes: adjustReason,
        }),
      });

      alert(`Stock adjusted for ${selectedProductForAdjust.sku}!`);
      setIsAdjustModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock.');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMetal = selectedMetal === 'ALL' || p.metalType === selectedMetal;
    const matchCat = selectedCategory === 'ALL' || p.category?.slug === selectedCategory;

    let matchStock = true;
    if (selectedStockStatus === 'IN_STOCK') matchStock = p.stockQuantity > p.lowStockThreshold;
    if (selectedStockStatus === 'LOW_STOCK') matchStock = p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold;
    if (selectedStockStatus === 'OUT_OF_STOCK') matchStock = p.stockQuantity === 0;

    return matchSearch && matchMetal && matchCat && matchStock;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-luxury-border pb-4">
        <div>
          <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest flex items-center gap-1.5">
            <Vault className="w-4 h-4 text-luxury-gold" /> Physical Vault & Jewellery Inventory
          </span>
          <h1 className="font-serif text-3xl font-bold text-luxury-charcoal mt-0.5">
            Gold & Silver Stock Management
          </h1>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all shadow-luxury flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Jewellery Stock
        </button>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card text-center space-y-1">
            <span className="text-[10px] text-luxury-gray font-bold uppercase">Total Products</span>
            <div className="font-serif text-2xl font-bold text-luxury-charcoal">{summary.totalProducts || products.length}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card text-center space-y-1">
            <span className="text-[10px] text-luxury-gray font-bold uppercase">Gold Reserve Value</span>
            <div className="font-serif text-xl font-bold text-luxury-gold">₹{summary.goldStockValue?.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card text-center space-y-1">
            <span className="text-[10px] text-luxury-gray font-bold uppercase">Silver Reserve Value</span>
            <div className="font-serif text-xl font-bold text-luxury-gold">₹{summary.silverStockValue?.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card text-center space-y-1">
            <span className="text-[10px] text-luxury-gray font-bold uppercase">Low Stock Alerts</span>
            <div className="font-serif text-2xl font-bold text-amber-600">{summary.lowStockCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card text-center space-y-1">
            <span className="text-[10px] text-luxury-gray font-bold uppercase">Out of Stock</span>
            <div className="font-serif text-2xl font-bold text-red-600">{summary.outOfStockCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card text-center space-y-1 bg-luxury-gold/10 border-luxury-gold/40">
            <span className="text-[10px] text-luxury-gold font-bold uppercase">Total Vault Value</span>
            <div className="font-serif text-xl font-bold text-luxury-gold">₹{summary.totalInventoryValue?.toLocaleString('en-IN')}</div>
          </div>
        </div>
      )}

      {/* Inventory Filters & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-luxury-border text-xs focus:outline-none focus:border-luxury-gold"
            />
            <Search className="w-4 h-4 text-luxury-gray absolute left-3 top-3" />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto text-xs">
            <select
              value={selectedMetal}
              onChange={(e) => setSelectedMetal(e.target.value)}
              className="py-2 px-3 rounded-xl border border-luxury-border bg-white font-semibold"
            >
              <option value="ALL">All Metals</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 rounded-xl border border-luxury-border bg-white font-semibold"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="py-2 px-3 rounded-xl border border-luxury-border bg-white font-semibold"
            >
              <option value="ALL">All Stock Status</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jewellery Inventory Table */}
      <div className="bg-white rounded-2xl border border-luxury-border shadow-card overflow-hidden">
        <div className="p-4 bg-luxury-beige/30 border-b border-luxury-border flex justify-between items-center">
          <h3 className="font-serif text-base font-bold text-luxury-charcoal">
            Vault Items ({filteredProducts.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-luxury-border text-luxury-gold font-semibold uppercase tracking-wider bg-white">
                <th className="py-3 px-4">Jewellery Item</th>
                <th className="py-3 px-4">SKU / Purity</th>
                <th className="py-3 px-4">Gross / Net Wt</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4">Estimated Unit Price</th>
                <th className="py-3 px-4">Total Value</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50 text-luxury-charcoal">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-luxury-gray">
                    No jewellery products match the selected inventory filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-luxury-beige/10 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <img
                        src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300'}
                        alt={p.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300';
                        }}
                        className="w-10 h-10 rounded-lg object-cover border border-luxury-border shrink-0"
                      />
                      <div>
                        <strong className="text-luxury-charcoal block line-clamp-1">{p.name}</strong>
                        <span className="text-[10px] text-luxury-gray">{p.category?.name || 'Jewellery'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-luxury-gold block">{p.sku}</span>
                      <span className="text-[10px] text-luxury-gray uppercase font-semibold">
                        {p.purity} {p.metalType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="block font-semibold">Net: {p.netWeight}g</span>
                      <span className="text-[10px] text-luxury-gray">Gross: {p.grossWeight}g</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.stockQuantity === 0 ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold text-[10px] uppercase">
                          Out of Stock
                        </span>
                      ) : p.stockQuantity <= p.lowStockThreshold ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] uppercase">
                          Low Stock ({p.stockQuantity})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-bold text-[10px] uppercase">
                          In Stock ({p.stockQuantity})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-serif font-bold text-luxury-gold">
                      ₹{(p.displayPrice || p.sellingPrice).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-luxury-charcoal">
                      ₹{(p.totalInventoryValue || (p.displayPrice || p.sellingPrice) * p.stockQuantity).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedProductForAdjust(p);
                          setAdjustQty(0);
                          setIsAdjustModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-luxury-beige hover:bg-luxury-gold hover:text-white font-semibold text-[11px] transition-all border border-luxury-gold/30"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Jewellery Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProduct}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-luxury-gold/30 space-y-4 text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-serif text-lg font-bold text-luxury-charcoal flex items-center gap-2">
                <Plus className="w-5 h-5 text-luxury-gold" /> Add New Jewellery Stock
              </h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-luxury-beige rounded-lg">
                <X className="w-5 h-5 text-luxury-gray" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Mayura Kundan Haram"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-luxury-border focus:ring-1 focus:ring-luxury-gold"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold block mb-1">SKU (Leave blank to auto-generate)</label>
                  <input
                    type="text"
                    placeholder="e.g. GLD-NCK-005"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-luxury-border font-mono focus:ring-1 focus:ring-luxury-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Metal *</label>
                  <select
                    value={productForm.metalType}
                    onChange={(e) => {
                      const metal = e.target.value;
                      setProductForm({
                        ...productForm,
                        metalType: metal,
                        purity: metal === 'SILVER' ? 'SILVER_999' : 'K22',
                      });
                    }}
                    className="w-full p-2.5 rounded-lg border border-luxury-border bg-white font-semibold"
                  >
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Purity *</label>
                  <select
                    value={productForm.purity}
                    onChange={(e) => setProductForm({ ...productForm, purity: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-luxury-border bg-white font-semibold"
                  >
                    {productForm.metalType === 'GOLD' ? (
                      <>
                        <option value="K22">22K Gold (91.6% BIS)</option>
                        <option value="K18">18K Gold (75.0%)</option>
                        <option value="80">80 Gold (80.0%)</option>
                        <option value="70">70 Gold (70.0%)</option>
                        <option value="K24">24K Pure Gold (99.9%)</option>
                      </>
                    ) : (
                      <>
                        <option value="SILVER_999">999 Fine Silver</option>
                        <option value="SILVER_925">925 Sterling Silver</option>
                        <option value="80">80 Silver Purity</option>
                        <option value="70">70 Silver Purity</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Category *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-luxury-border bg-white font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Gross Weight (g) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.grossWeight}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        grossWeight: parseFloat(e.target.value) || 0,
                        netWeight: (parseFloat(e.target.value) || 0) - productForm.stoneWeight,
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-luxury-border"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Stone Weight (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.stoneWeight}
                    onChange={(e) => {
                      const st = parseFloat(e.target.value) || 0;
                      setProductForm({
                        ...productForm,
                        stoneWeight: st,
                        netWeight: Math.max(0, productForm.grossWeight - st),
                      });
                    }}
                    className="w-full p-2.5 rounded-lg border border-luxury-border"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Net Metal Weight (g) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.netWeight}
                    onChange={(e) => setProductForm({ ...productForm, netWeight: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-luxury-border font-bold text-luxury-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Making Charge / g (₹)</label>
                  <input
                    type="number"
                    value={productForm.makingChargeValue}
                    onChange={(e) => setProductForm({ ...productForm, makingChargeValue: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-luxury-border"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Wastage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={productForm.wastageValue}
                    onChange={(e) => setProductForm({ ...productForm, wastageValue: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-luxury-border"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Stone Charge (₹)</label>
                  <input
                    type="number"
                    value={productForm.stoneCharge}
                    onChange={(e) => setProductForm({ ...productForm, stoneCharge: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-luxury-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 rounded-lg border border-luxury-border"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Product Image URL</label>
                  <input
                    type="url"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-luxury-border"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all shadow-luxury"
            >
              Save Product & Add Stock
            </button>
          </form>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleStockAdjustment}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-luxury-gold/30 space-y-4 text-xs"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <strong className="text-luxury-gold font-mono block">{selectedProductForAdjust.sku}</strong>
                <h3 className="font-serif text-lg font-bold text-luxury-charcoal">{selectedProductForAdjust.name}</h3>
              </div>
              <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="p-1 hover:bg-luxury-beige rounded-lg">
                <X className="w-5 h-5 text-luxury-gray" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-luxury-beige/30 rounded-lg flex justify-between">
                <span>Current Stock:</span>
                <strong className="font-bold text-luxury-charcoal">{selectedProductForAdjust.stockQuantity} units</strong>
              </div>

              <div>
                <label className="font-semibold block mb-1">Stock Quantity Delta (+ or -) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. +5 or -1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 rounded-lg border border-luxury-border font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Reason for Adjustment *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-luxury-border bg-white"
                >
                  <option value="New Vault Stock Receipt">New Vault Stock Receipt</option>
                  <option value="Manual Inventory Reconciliation">Manual Inventory Reconciliation</option>
                  <option value="Damaged Item Removed">Damaged Item Removed</option>
                  <option value="Customer Return">Customer Return</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all shadow-luxury"
            >
              Confirm Stock Adjustment
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
