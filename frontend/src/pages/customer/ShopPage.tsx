import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Product } from '../../types';
import { fetchApi } from '../../api/client';
import { useCartStore } from '../../store/useCartStore';
import { Search, Filter, Heart, ShoppingBag, Eye, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { SmartImage } from '../../components/common/SmartImage';
import { MobileFilterBottomSheet } from '../../components/common/MobileFilterBottomSheet';
import { formatCurrency } from '../../utils/formatters';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const { addItem, toggleWishlist, isInWishlist } = useCartStore();

  const category = searchParams.get('category') || '';
  const metalType = searchParams.get('metalType') || '';
  const purity = searchParams.get('purity') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        if (category) query.append('category', category);
        if (metalType) query.append('metalType', metalType);
        if (purity) query.append('purity', purity);
        if (search) query.append('search', search);
        if (sortBy) query.append('sortBy', sortBy);

        const res = await fetchApi<{ data: Product[] }>(`/products?${query.toString()}`);
        setProducts(res.data || []);
      } catch (err) {
        console.error('Failed to load catalogue:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [category, metalType, purity, search, sortBy]);

  const handleApplyMobileFilters = (filters: { category: string; metal: string; purity: string }) => {
    if (filters.category && filters.category !== 'ALL') {
      searchParams.set('category', filters.category);
    } else {
      searchParams.delete('category');
    }

    if (filters.metal && filters.metal !== 'ALL') {
      searchParams.set('metalType', filters.metal);
    } else {
      searchParams.delete('metalType');
    }

    if (filters.purity && filters.purity !== 'ALL') {
      searchParams.set('purity', filters.purity);
    } else {
      searchParams.delete('purity');
    }

    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-luxury-border pb-4 sm:pb-6">
        <div>
          <span className="text-[10px] sm:text-xs font-semibold text-luxury-gold uppercase tracking-widest">
            Exquisite Jewellery Collection
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-luxury-charcoal">
            {category ? category.replace('-', ' ').toUpperCase() : search ? `RESULTS FOR "${search.toUpperCase()}"` : 'ALL JEWELLERY'}
          </h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="sm:hidden px-4 py-2.5 bg-luxury-gold text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filter Catalogue
          </button>

          {/* Desktop Metal Filter Pills */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <button
              onClick={() => {
                searchParams.delete('metalType');
                setSearchParams(searchParams);
              }}
              className={`px-3 py-1.5 rounded-full border ${
                !metalType
                  ? 'bg-luxury-gold text-white border-luxury-gold'
                  : 'bg-white text-luxury-charcoal border-luxury-border'
              }`}
            >
              All Metals
            </button>
            <button
              onClick={() => {
                searchParams.set('metalType', 'GOLD');
                setSearchParams(searchParams);
              }}
              className={`px-3 py-1.5 rounded-full border ${
                metalType === 'GOLD'
                  ? 'bg-luxury-gold text-white border-luxury-gold'
                  : 'bg-white text-luxury-charcoal border-luxury-border'
              }`}
            >
              Gold
            </button>
            <button
              onClick={() => {
                searchParams.set('metalType', 'SILVER');
                setSearchParams(searchParams);
              }}
              className={`px-3 py-1.5 rounded-full border ${
                metalType === 'SILVER'
                  ? 'bg-luxury-gold text-white border-luxury-gold'
                  : 'bg-white text-luxury-charcoal border-luxury-border'
              }`}
            >
              Silver
            </button>
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              searchParams.set('sortBy', e.target.value);
              setSearchParams(searchParams);
            }}
            className="text-xs py-2 px-3 rounded-xl border border-luxury-border bg-white text-luxury-charcoal focus:outline-none focus:border-luxury-gold font-medium min-h-[44px]"
          >
            <option value="newest">Sort By: Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Product Grid (2-Column Mobile, 4-Column Desktop) */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 py-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-64 sm:h-80 bg-luxury-beige/50 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-luxury-border p-6">
          <h3 className="font-serif text-xl font-bold text-luxury-charcoal">No jewellery products found</h3>
          <p className="text-xs text-luxury-gray mt-1">Try resetting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {products.map((product) => {
            const displayPrice = product.displayPrice || product.sellingPrice;
            const wishlisted = isInWishlist(product.id);
            const isOutOfStock = product.stockQuantity === 0;
            const mainImgUrl = product.images && product.images.length > 0 ? product.images[0].url : null;

            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl overflow-hidden border border-luxury-border shadow-card flex flex-col justify-between hover:shadow-luxury transition-all duration-300 relative"
              >
                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-white/80 backdrop-blur-xs text-luxury-charcoal hover:text-red-500 transition-colors shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-luxury-beige">
                  <SmartImage
                    src={mainImgUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {isOutOfStock ? (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider shadow">
                      OUT OF STOCK
                    </span>
                  ) : product.hallmark ? (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-luxury-charcoal/85 text-[9px] text-luxury-gold font-semibold uppercase flex items-center gap-1 backdrop-blur-xs">
                      <ShieldCheck className="w-3 h-3 text-luxury-gold" /> BIS Hallmarked
                    </span>
                  ) : null}
                </div>

                {/* Product Details */}
                <div className="p-3 sm:p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-luxury-gold uppercase font-semibold tracking-wider block">
                      {product.purity} {product.metalType} • {product.netWeight}g
                    </span>
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="font-serif text-xs sm:text-base font-bold text-luxury-charcoal group-hover:text-luxury-gold transition-colors line-clamp-2 mt-0.5 leading-snug">
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  <div className="pt-2 border-t border-luxury-border/50 flex items-center justify-between gap-1">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-luxury-charcoal font-mono">
                        {formatCurrency(displayPrice)}
                      </div>
                      <span className="text-[9px] text-luxury-gray hidden sm:block">Incl. GST & Making</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="p-2 rounded-xl border border-luxury-border text-luxury-gray hover:text-luxury-gold hover:border-luxury-gold transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Quick View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => !isOutOfStock && addItem(product)}
                        disabled={isOutOfStock}
                        className={`p-2 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                          isOutOfStock
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-luxury-gold text-white hover:bg-luxury-gold/90 shadow-sm'
                        }`}
                        title={isOutOfStock ? 'Out of Stock' : 'Add To Bag'}
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative space-y-4 shadow-2xl animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-luxury-gray hover:text-luxury-charcoal p-1"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="aspect-square rounded-xl overflow-hidden border border-luxury-border">
                <SmartImage
                  src={selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images[0].url : null}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-luxury-gold font-bold uppercase tracking-wider block">
                    {selectedProduct.purity} {selectedProduct.metalType}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-luxury-charcoal mt-1">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-luxury-gray leading-relaxed mt-2 line-clamp-3">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="p-3 bg-luxury-ivory/60 rounded-xl text-xs space-y-1 border border-luxury-border font-mono">
                  <div>Gross Wt: <strong>{selectedProduct.grossWeight}g</strong></div>
                  <div>Net Wt: <strong>{selectedProduct.netWeight}g</strong></div>
                  <div>Certification: <strong>{selectedProduct.certification || 'BIS Hallmarked'}</strong></div>
                </div>

                <div>
                  <div className="font-serif text-2xl font-bold text-luxury-gold font-mono">
                    {formatCurrency(selectedProduct.displayPrice || selectedProduct.sellingPrice)}
                  </div>
                  <button
                    onClick={() => {
                      addItem(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="w-full mt-3 py-3 rounded-xl bg-luxury-gold text-white font-bold text-xs uppercase tracking-wider hover:bg-luxury-gold/90 transition-all min-h-[48px] shadow-sm"
                  >
                    Add To Bag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Bottom Sheet */}
      <MobileFilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        selectedCategory={category || 'ALL'}
        selectedMetal={metalType || 'ALL'}
        selectedPurity={purity || 'ALL'}
        onApplyFilters={handleApplyMobileFilters}
      />
    </div>
  );
};

export default ShopPage;
