import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { fetchApi } from '../../api/client';
import { useCartStore } from '../../store/useCartStore';
import { ShieldCheck, Heart, ShoppingBag, MessageCircle, Truck, RefreshCw } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);

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

  const handleWhatsAppEnquiry = () => {
    const text = encodeURIComponent(
      `Hi Royal Jewels, I am interested in ${product.name} (SKU: ${product.sku}, Price: ₹${finalPrice.toLocaleString('en-IN')}). Could you please share more details? Link: ${window.location.href}`
    );
    window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  };

  const handleBuyNow = () => {
    addItem(product, 1);
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left Column: Image Gallery & Zoom */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-luxury-border bg-white shadow-card">
            <img
              src={product.images[selectedImg]?.url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => toggleWishlist(product)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/80 backdrop-blur-xs text-luxury-charcoal hover:text-red-500 shadow-md"
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImg(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImg === idx ? 'border-luxury-gold shadow-md' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Specifications & Transparent Pricing */}
        <div className="space-y-6">
          <div>
            <span className="text-xs text-luxury-gold font-semibold uppercase tracking-widest">
              {product.purity} {product.metalType} • {product.netWeight}g Net Gold
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-luxury-charcoal mt-1">
              {product.name}
            </h1>
            <p className="text-xs text-luxury-gray mt-1">SKU: {product.sku}</p>
          </div>

          {/* Dynamic Final Price */}
          <div className="p-4 bg-luxury-beige/50 rounded-xl border border-luxury-gold/30 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-luxury-gold">
                ₹{finalPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-luxury-gray">Incl. GST (3%) & Making Charges</span>
            </div>

            <div className="text-[11px] text-green-800 flex items-center gap-1 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Calculated dynamically with live {product.metalType} rate (₹{pricing?.metalRate || 6830}/g)
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-luxury-charcoal/80 leading-relaxed">
            {product.description}
          </p>

          {/* Transparent Jewellery Specifications & Breakdown Table */}
          <div className="border border-luxury-border rounded-xl p-4 bg-white space-y-3">
            <h3 className="font-serif text-base font-bold text-luxury-charcoal border-b border-luxury-border pb-2">
              Itemized Weight & Pricing Breakdown
            </h3>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex justify-between text-luxury-gray">
                <span>Metal Purity:</span>
                <strong className="text-luxury-charcoal">{product.purity} ({product.metalType})</strong>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>Gross Weight:</span>
                <strong className="text-luxury-charcoal">{product.grossWeight} grams</strong>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>Net Gold Weight:</span>
                <strong className="text-luxury-charcoal">{product.netWeight} grams</strong>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>Live Gold Rate:</span>
                <strong className="text-luxury-charcoal">₹{pricing?.metalRate || 6830}/g</strong>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>Raw Metal Value:</span>
                <strong className="text-luxury-charcoal">₹{pricing?.rawMetalValue.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>Craftsmanship / Making:</span>
                <strong className="text-luxury-charcoal">₹{pricing?.makingCharges.toLocaleString('en-IN')}</strong>
              </div>
              {pricing?.stoneCharge ? (
                <div className="flex justify-between text-luxury-gray">
                  <span>Gemstones / Diamonds:</span>
                  <strong className="text-luxury-charcoal">₹{pricing.stoneCharge.toLocaleString('en-IN')}</strong>
                </div>
              ) : null}
              <div className="flex justify-between text-luxury-gray">
                <span>GST (3%):</span>
                <strong className="text-luxury-charcoal">₹{pricing?.gstAmount.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => addItem(product, 1)}
                className="flex-1 py-3.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury"
              >
                <ShoppingBag className="w-4 h-4" /> Add To Bag
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3.5 rounded-full bg-luxury-charcoal text-white font-semibold text-xs tracking-widest uppercase hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                Buy Now
              </button>
            </div>

            <button
              onClick={handleWhatsAppEnquiry}
              className="w-full py-3 rounded-full bg-emerald-600 text-white font-semibold text-xs tracking-wider uppercase hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
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
    </div>
  );
};

