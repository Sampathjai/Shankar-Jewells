import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api/client';
import { SmartImage } from '../../components/common/SmartImage';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Package,
  Sparkles,
  Image as ImageIcon,
  Upload,
  X,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  metalType?: 'GOLD' | 'SILVER' | null;
  active: boolean;
  _count?: {
    products: number;
  };
}

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [metalFilter, setMetalFilter] = useState<'ALL' | 'GOLD' | 'SILVER'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    metalType: '' as '' | 'GOLD' | 'SILVER',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchApi<{ success: boolean; data: Category[] }>('/categories?admin=true');
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      metalType: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      metalType: (cat.metalType as any) || '',
    });
    setIsModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append('image', file);

      const res = await fetchApi<{ success: boolean; url: string }>('/upload/image', {
        method: 'POST',
        body: data,
      });

      if (res.success) {
        setFormData((prev) => ({ ...prev, imageUrl: res.url }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload category image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: formData.description || undefined,
        imageUrl: formData.imageUrl || undefined,
        metalType: formData.metalType || undefined,
      };

      if (editingCategory) {
        await fetchApi(`/categories/${editingCategory.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (cat: Category) => {
    try {
      await fetchApi(`/categories/${cat.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !cat.active }),
      });
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to update category status');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat._count && cat._count.products > 0) {
      if (!confirm(`This category contains ${cat._count.products} products. It will be deactivated rather than deleted. Proceed?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
        return;
      }
    }

    try {
      await fetchApi(`/categories/${cat.id}`, {
        method: 'DELETE',
      });
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMetal = metalFilter === 'ALL' || c.metalType === metalFilter;
    return matchesSearch && matchesMetal;
  });

  return (
    <div className="p-8 space-y-6 bg-luxury-ivory min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-border pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-charcoal font-bold flex items-center gap-3">
            <FolderTree className="w-7 h-7 text-luxury-gold" />
            Jewellery Category Manager
          </h1>
          <p className="text-xs text-luxury-gray mt-1">
            Organize Gold & Silver Jewellery product catalogue, category cover images, and navigation visibility.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Category
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-luxury-gray" />
          <input
            type="text"
            placeholder="Search category name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-luxury-border rounded-xl pl-9 pr-4 py-2 text-xs text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-luxury-gray font-semibold">Metal Type:</span>
          {(['ALL', 'GOLD', 'SILVER'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetalFilter(m)}
              className={`px-3 py-1 rounded-lg font-bold uppercase transition-all ${
                metalFilter === m
                  ? 'bg-luxury-gold text-white shadow-sm'
                  : 'bg-luxury-ivory text-luxury-gray hover:text-luxury-charcoal'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Category Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-luxury-gray">
          Loading jewellery categories...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-luxury-border shadow-card text-xs text-luxury-gray">
          No categories found matching filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-luxury-border rounded-2xl p-5 shadow-card flex flex-col justify-between space-y-4 hover:border-luxury-gold/50 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-16 h-16 rounded-xl bg-luxury-ivory border border-luxury-border flex items-center justify-center overflow-hidden shrink-0">
                    <SmartImage src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-base font-bold text-luxury-charcoal truncate">{cat.name}</h3>
                      {cat.metalType && (
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            cat.metalType === 'GOLD'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {cat.metalType}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-luxury-gray font-mono">slug: {cat.slug}</p>
                    {cat.description && (
                      <p className="text-xs text-luxury-gray line-clamp-2 mt-1">{cat.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-luxury-border/60">
                  <div className="flex items-center gap-1.5 text-luxury-gray">
                    <Package className="w-3.5 h-3.5 text-luxury-gold" />
                    <span className="font-bold text-luxury-charcoal">{cat._count?.products || 0}</span> Products
                  </div>

                  <button
                    onClick={() => toggleStatus(cat)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                      cat.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {cat.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-luxury-border flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(cat)}
                  className="px-3 py-1.5 bg-white border border-luxury-border text-luxury-charcoal rounded-lg font-bold text-xs hover:bg-luxury-ivory transition-all shadow-sm flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5 text-luxury-gold" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-lg font-bold text-xs hover:bg-rose-50 transition-all shadow-sm flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-luxury-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-luxury-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-luxury-border pb-3">
              <h3 className="font-serif text-lg font-bold text-luxury-charcoal">
                {editingCategory ? 'Edit Category' : 'Create Jewellery Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-luxury-gray hover:text-luxury-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-luxury-charcoal font-bold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold Necklaces"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                />
              </div>

              <div>
                <label className="block text-luxury-gray font-semibold mb-1">Metal Association</label>
                <select
                  value={formData.metalType}
                  onChange={(e) => setFormData({ ...formData, metalType: e.target.value as any })}
                  className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                >
                  <option value="">General (Gold & Silver)</option>
                  <option value="GOLD">Gold Jewellery Only</option>
                  <option value="SILVER">Silver Jewellery Only</option>
                </select>
              </div>

              <div>
                <label className="block text-luxury-gray font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description for category banner..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-luxury-border rounded-xl p-3 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                />
              </div>

              {/* Cover Image File Upload */}
              <div>
                <label className="block text-luxury-charcoal font-bold mb-1">Category Cover Image</label>
                {formData.imageUrl ? (
                  <div className="relative w-full h-32 rounded-xl border border-luxury-border overflow-hidden group">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-luxury-border hover:border-luxury-gold rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-luxury-ivory/50">
                    <Upload className="w-6 h-6 text-luxury-gold mb-1" />
                    <span className="text-xs font-bold text-luxury-charcoal">
                      {uploadingImage ? 'Uploading Image...' : 'Click to Upload Image File'}
                    </span>
                    <span className="text-[10px] text-luxury-gray mt-0.5">JPG, PNG, WEBP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                )}
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
                  disabled={saving || uploadingImage}
                  className="px-5 py-2 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
