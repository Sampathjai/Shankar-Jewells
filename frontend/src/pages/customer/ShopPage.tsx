import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Product } from '../../types';
import { fetchApi } from '../../api/client';
import { useCartStore } from '../../store/useCartStore';
import { Search, Filter, Heart, ShoppingBag, Eye, ShieldCheck } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { addItem, toggleWishlist, isInWishlist } = useCartStore();

  const category = searchParams.get('category') || '';
  const metalType = searchParams.get('metalType') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        if (category) query.append('category', category);
        if (metalType) query.append('metalType', metalType);
        if (search) query.append('search', search);
        if (sortBy) query.append('sortBy', sortBy);

        const res = await fetchApi<{ data: Product[] }>(`/products?${query.toString()}`);
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to load catalogue:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [category, metalType, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-luxury-border pb-6">
        <div>
          <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
            Exquisite Jewellery Collection
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-luxury-charcoal">
            {category ? category.replace('-', ' ').toUpperCase() : 'ALL JEWELLERY'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Metal Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
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
            className="text-xs py-1.5 px-3 rounded-full border border-luxury-border bg-white text-luxury-charcoal focus:outline-none focus:border-luxury-gold"
          >
            <option value="newest">Sort By: Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-80 bg-luxury-beige/50 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-luxury-border">
          <h3 className="font-serif text-2xl font-bold text-luxury-charcoal">No products found</h3>
          <p className="text-xs text-luxury-gray mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => {
            const displayPrice = product.displayPrice || product.sellingPrice;
            const wishlisted = isInWishlist(product.id);

            return (
              <div
                key={product.id}
                className="group bg-white rounded-xl overflow-hidden border border-luxury-border shadow-card flex flex-col justify-between hover:shadow-luxury transition-all duration-300 relative"
              >
                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-xs text-luxury-charcoal hover:text-red-500 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-luxury-beige">
                  <img
                    src={product.images[0]?.url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.hallmark && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-luxury-charcoal/80 text-[9px] text-luxury-gold font-semibold uppercase flex items-center gap-1 backdrop-blur-xs">
                      <ShieldCheck className="w-3 h-3" /> BIS Hallmarked
                    </span>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-luxury-gold uppercase font-semibold tracking-wider">
                      {product.purity} {product.metalType} • {product.netWeight}g Net Wt
                    </span>
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="font-serif text-base font-bold text-luxury-charcoal group-hover:text-luxury-gold transition-colors line-clamp-1 mt-0.5">
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  <div className="pt-2 border-t border-luxury-border/50 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-luxury-charcoal">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[9px] text-luxury-gray">Incl. GST & Making</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="p-2 rounded-full border border-luxury-border text-luxury-gray hover:text-luxury-gold hover:border-luxury-gold transition-colors"
                        title="Quick View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => addItem(product)}
                        className="p-2 rounded-full bg-luxury-gold text-white hover:bg-luxury-gold-dark transition-colors"
                        title="Add To Bag"
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative space-y-4">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-luxury-gray hover:text-luxury-charcoal"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <img
                src={selectedProduct.images[0]?.url}
                alt={selectedProduct.name}
                className="w-full h-64 object-cover rounded-xl border border-luxury-border"
              />
              <div className="space-y-3">
                <span className="text-xs text-luxury-gold uppercase font-semibold">
                  {selectedProduct.purity} {selectedProduct.metalType}
                </span>
                <h3 className="font-serif text-2xl font-bold text-luxury-charcoal">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-luxury-gray leading-relaxed">
                  {selectedProduct.description}
                </p>
                <div className="p-3 bg-luxury-beige/50 rounded-lg text-xs space-y-1">
                  <div>Gross Weight: <strong>{selectedProduct.grossWeight}g</strong></div>
                  <div>Net Gold Weight: <strong>{selectedProduct.netWeight}g</strong></div>
                  <div>Certification: <strong>{selectedProduct.certification || 'BIS Hallmarked'}</strong></div>
                </div>
                <div className="font-serif text-2xl font-bold text-luxury-gold pt-2">
                  ₹{(selectedProduct.displayPrice || selectedProduct.sellingPrice).toLocaleString('en-IN')}
                </div>
                <button
                  onClick={() => {
                    addItem(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all"
                >
                  Add To Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

