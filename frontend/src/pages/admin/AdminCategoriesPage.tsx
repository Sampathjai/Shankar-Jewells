import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api/client';
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
  Layers,
  Image as ImageIcon,
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
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchApi<{ success: boolean; data: Category[] }>('/categories?admin=true');
      if (res.success) {
        setCategories(res.data);
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

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMetal =
      metalFilter === 'ALL' ||
      (metalFilter === 'GOLD' && cat.metalType === 'GOLD') ||
      (metalFilter === 'SILVER' && cat.metalType === 'SILVER');
    return matchesSearch && matchesMetal;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-gold font-bold flex items-center gap-3">
            <FolderTree className="w-7 h-7 text-luxury-gold" />
            Jewellery Category Management
          </h1>
          <p className="text-xs text-luxury-ivory/60 mt-1">
            Manage Gold, Silver, Bridal, and Fine Jewellery product categories & public catalog hierarchy
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-semibold rounded-xl text-xs transition-all shadow-luxury"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-luxury-charcoal/40 p-4 rounded-2xl border border-luxury-gold/20 backdrop-blur-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-luxury-ivory/40" />
          <input
            type="text"
            placeholder="Search categories by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-luxury-charcoal/80 border border-luxury-gold/20 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-luxury-ivory/60 font-semibold mr-1">Metal Filter:</span>
          {(['ALL', 'GOLD', 'SILVER'] as const).map((mf) => (
            <button
              key={mf}
              onClick={() => setMetalFilter(mf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                metalFilter === mf
                  ? 'bg-luxury-gold text-luxury-charcoal'
                  : 'bg-white/5 text-luxury-ivory/70 hover:bg-white/10'
              }`}
            >
              {mf}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="text-center py-16 bg-luxury-charcoal/30 rounded-2xl border border-luxury-gold/10">
          <Sparkles className="w-8 h-8 text-luxury-gold animate-spin mx-auto mb-3" />
          <p className="text-xs text-luxury-ivory/60">Loading Jewellery Categories...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
          {error}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 bg-luxury-charcoal/30 rounded-2xl border border-luxury-gold/10">
          <Layers className="w-10 h-10 text-luxury-ivory/30 mx-auto mb-2" />
          <p className="text-sm font-semibold text-luxury-ivory/60">No categories found</p>
        </div>
      ) : (
        <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-luxury-ivory/80">
              <thead className="bg-luxury-charcoal text-luxury-gold uppercase text-[10px] font-bold tracking-wider border-b border-luxury-gold/20">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Slug</th>
                  <th className="px-5 py-3.5">Metal Type</th>
                  <th className="px-5 py-3.5">Products Count</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-gold/10">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-luxury-charcoal border border-luxury-gold/30 overflow-hidden flex items-center justify-center shrink-0">
                          {cat.imageUrl ? (
                            <img
                              src={cat.imageUrl}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=100&auto=format&fit=crop';
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-luxury-gold/50" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{cat.name}</div>
                          {cat.description && (
                            <div className="text-[10px] text-luxury-ivory/50 line-clamp-1">
                              {cat.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-luxury-ivory/70">{cat.slug}</td>
                    <td className="px-5 py-4">
                      {cat.metalType ? (
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                            cat.metalType === 'GOLD'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-400/20 text-slate-200 border border-slate-400/30'
                          }`}
                        >
                          {cat.metalType}
                        </span>
                      ) : (
                        <span className="text-[10px] text-luxury-ivory/40">General</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <Package className="w-3.5 h-3.5 text-luxury-gold" />
                        {cat._count?.products || 0} Products
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleStatus(cat)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                          cat.active
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                        }`}
                      >
                        {cat.active ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-luxury-gold hover:text-luxury-charcoal text-luxury-ivory/70 transition-all"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-luxury-charcoal border border-luxury-gold/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-luxury-gold/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-luxury-gold">
                {editingCategory ? 'Edit Category' : 'Add New Jewellery Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold Necklaces, Silver Payal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">
                  Slug (URL Keyword)
                </label>
                <input
                  type="text"
                  placeholder="e.g. gold-necklaces"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-luxury-gold font-mono"
                />
              </div>

              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">Metal Type</label>
                <select
                  value={formData.metalType}
                  onChange={(e) =>
                    setFormData({ ...formData, metalType: e.target.value as any })
                  }
                  className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-luxury-gold"
                >
                  <option value="">General / All Metals</option>
                  <option value="GOLD">Gold Jewellery</option>
                  <option value="SILVER">Silver Jewellery</option>
                </select>
              </div>

              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief overview of items in this category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-luxury-gold"
                />
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
                  {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
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

