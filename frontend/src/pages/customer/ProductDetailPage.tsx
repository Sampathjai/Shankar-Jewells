import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product } from '../../types';
import { fetchApi } from '../../api/client';
import { useCartStore } from '../../store/useCartStore';
import { ShieldCheck, Heart, ShoppingBag, MessageCircle, Truck, RefreshCw, X, Maximize2, Sparkles } from 'lucide-react';
import { SmartImage } from '../../components/common/SmartImage';
import { formatCurrency } from '../../utils/formatters';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);

  const { addItem, toggleWishlist, isInWishlist } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await fetchApi<{ data: Product }>(`/products/${slug}`);
        setProduct(res.data);
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-luxury-gray">Loading hallmarked details...</p>
      </div>
    );
  }

  const pricing = product.calculatedPricing;
  const finalPrice = product.displayPrice || product.sellingPrice;
  const wishlisted = isInWishlist(product.id);
  const isOutOfStock = product.stockQuantity === 0;
  const images = product.images && product.images.length > 0 ? product.images : [{ id: '1', url: '', isPrimary: true, sortOrder: 0 }];

  const handleWhatsAppEnquiry = () => {
    const text = encodeURIComponent(
      `Hi Shanker Jewells, I am interested in ${product.name} (SKU: ${product.sku}, Price: ${formatCurrency(finalPrice)}). Could you please share more details? Link: ${window.location.href}`
    );
    window.open(`https://wa.me/91944394912?text=${text}`, '_blank');
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, 1);
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8 pb-28 sm:pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-luxury-border bg-white shadow-card group">
            <SmartImage
              src={images[selectedImg]?.url}
              alt={product.name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setIsFullscreenImage(true)}
            />
            {isOutOfStock && (
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg">
                OUT OF STOCK
              </span>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setIsFullscreenImage(true)}
                className="p-2.5 rounded-full bg-white/80 backdrop-blur-xs text-luxury-charcoal hover:text-luxury-gold shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Fullscreen Image"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className="p-2.5 rounded-full bg-white/80 backdrop-blur-xs text-luxury-charcoal hover:text-red-500 shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

            {/* Page Counter Badge for Mobile */}
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 text-white text-[10px] font-mono font-bold backdrop-blur-xs">
                {selectedImg + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 custom-admin-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImg(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImg === idx ? 'border-luxury-gold shadow-md scale-95' : 'border-transparent opacity-60'
                  }`}
                >
                  <SmartImage src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Specifications & Transparent Pricing */}
        <div className="space-y-6">
          <div>
            <span className="text-xs text-luxury-gold font-bold uppercase tracking-widest block">
              {product.purity} {product.metalType} • {product.netWeight}g Net Gold
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-luxury-charcoal mt-1">
              {product.name}
            </h1>
            <p className="text-xs text-luxury-gray font-mono mt-1">SKU: {product.sku}</p>
          </div>

          {/* Dynamic Final Price */}
          <div className="p-4 bg-luxury-ivory/80 rounded-2xl border border-luxury-gold/30 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-luxury-gold font-mono">
                {formatCurrency(finalPrice)}
              </span>
              <span className="text-xs text-luxury-gray">Incl. GST & Making Charges</span>
            </div>

            <div className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Calculated dynamically with live {product.metalType} rate ({formatCurrency(pricing?.metalRate || 6830)}/g)
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-luxury-charcoal/80 leading-relaxed">
            {product.description}
          </p>

          {/* Transparent Jewellery Specifications */}
          <div className="border border-luxury-border rounded-2xl p-4 bg-white space-y-3 shadow-card">
            <h3 className="font-serif text-sm font-bold text-luxury-charcoal uppercase tracking-wider border-b border-luxury-border pb-2">
              Itemized Weight & Pricing Breakdown
            </h3>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex justify-between text-luxury-gray">
                <span>Metal Purity:</span>
                <strong className="text-luxury-charcoal">{product.purity} ({product.metalType})</strong>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>Gross Weight:</span>
                <strong className="text-luxury-charcoal font-mono">{product.grossWeight}g</strong>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>Net Gold Weight:</span>
                <strong className="text-luxury-charcoal font-mono">{product.netWeight}g</strong>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>Live Metal Rate:</span>
                <strong className="text-luxury-charcoal font-mono">{formatCurrency(pricing?.metalRate || 6830)}/g</strong>
              </div>
              {pricing?.rawMetalValue ? (
                <div className="flex justify-between text-luxury-gray">
                  <span>Raw Metal Value:</span>
                  <strong className="text-luxury-charcoal font-mono">{formatCurrency(pricing.rawMetalValue)}</strong>
                </div>
              ) : null}
              {pricing?.makingCharges ? (
                <div className="flex justify-between text-luxury-gray">
                  <span>Making Charges:</span>
                  <strong className="text-luxury-charcoal font-mono">{formatCurrency(pricing.makingCharges)}</strong>
                </div>
              ) : null}
            </div>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden sm:space-y-3 pt-2">
            <div className="flex gap-3">
              <button
                onClick={() => !isOutOfStock && addItem(product, 1)}
                disabled={isOutOfStock}
                className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-h-[48px] ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-luxury-gold text-white hover:bg-luxury-gold/90 shadow-sm'
                }`}
              >
                <ShoppingBag className="w-4 h-4" /> {isOutOfStock ? 'OUT OF STOCK' : 'Add To Bag'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-luxury-charcoal text-white hover:bg-black transition-all min-h-[48px]"
              >
                Buy Now
              </button>
            </div>

            <button
              onClick={handleWhatsAppEnquiry}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <MessageCircle className="w-4 h-4" /> Enquire On WhatsApp
            </button>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-luxury-border text-center text-[10px] text-luxury-gray">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-luxury-gold mb-1" />
              <span>BIS 916 Hallmarked</span>
            </div>
            <div className="flex flex-col items-center">
              <Truck className="w-5 h-5 text-luxury-gold mb-1" />
              <span>Insured Transit</span>
            </div>
            <div className="flex flex-col items-center">
              <RefreshCw className="w-5 h-5 text-luxury-gold mb-1" />
              <span>Lifetime Exchange</span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR */}
      <div className="sm:hidden fixed bottom-16 left-0 right-0 z-40 bg-luxury-charcoal p-3 border-t border-luxury-gold/30 shadow-2xl flex items-center gap-2">
        <button
          onClick={handleWhatsAppEnquiry}
          className="p-3 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 min-h-[48px] min-w-[48px]"
          title="WhatsApp Enquiry"
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        <button
          onClick={() => !isOutOfStock && addItem(product, 1)}
          disabled={isOutOfStock}
          className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 min-h-[48px] ${
            isOutOfStock
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-luxury-gold text-white shadow-sm'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> {isOutOfStock ? 'OUT OF STOCK' : `ADD TO BAG • ${formatCurrency(finalPrice)}`}
        </button>
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsFullscreenImage(false)}
        >
          <button
            onClick={() => setIsFullscreenImage(false)}
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-slate-800 hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </button>

          <SmartImage
            src={images[selectedImg]?.url}
            alt={product.name}
            objectFit="contain"
            className="max-h-[85vh] max-w-full rounded-xl"
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
