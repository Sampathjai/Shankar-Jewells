import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/useCartStore';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { isOpen, closeCart, items, removeItem, updateQuantity } = useCartStore();
  const navigate = useNavigate();

  const subtotal = items.reduce((acc, item) => {
    const price = item.product.displayPrice || item.product.sellingPrice;
    return acc + price * item.quantity;
  }, 0);

  const gstTax = subtotal * 0.03; // 3% GST
  const grandTotal = subtotal + gstTax;

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-luxury-ivory shadow-2xl z-50 flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-luxury-border flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-luxury-gold" />
                <h2 className="font-serif text-xl font-bold tracking-wide text-luxury-charcoal">
                  Your Vault Bag ({items.length})
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 text-luxury-gray hover:text-luxury-charcoal transition-colors"
                aria-label="Close Bag"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-luxury-beige flex items-center justify-center mb-4 text-luxury-gold">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-luxury-charcoal">Your bag is empty</h3>
                  <p className="text-xs text-luxury-gray mt-1 max-w-xs">
                    Discover our handcrafted gold and silver collection to add timeless elegance to your bag.
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-6 px-6 py-2.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-wider uppercase hover:bg-luxury-gold-dark transition-all"
                  >
                    Explore Catalogue
                  </button>
                </div>
              ) : (
                items.map(({ product, quantity }) => {
                  const unitPrice = product.displayPrice || product.sellingPrice;
                  return (
                    <div
                      key={product.id}
                      className="p-3 bg-white rounded-lg border border-luxury-border flex gap-3 shadow-card"
                    >
                      <img
                        src={product.images[0]?.url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300'}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-md border border-luxury-border/50"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="text-xs font-semibold text-luxury-charcoal line-clamp-1">
                              {product.name}
                            </h4>
                            <button
                              onClick={() => removeItem(product.id)}
                              className="text-luxury-gray hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[10px] text-luxury-gold font-medium uppercase">
                            {product.purity} {product.metalType} • {product.netWeight}g Net
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-luxury-border rounded-md">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="px-2 py-0.5 text-xs text-luxury-gray hover:text-luxury-charcoal"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-semibold">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="px-2 py-0.5 text-xs text-luxury-gray hover:text-luxury-charcoal"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs font-bold text-luxury-charcoal">
                            ₹{(unitPrice * quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Checkout CTA */}
            {items.length > 0 && (
              <div className="p-4 sm:p-6 bg-white border-t border-luxury-border space-y-3">
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-md border border-amber-200/60 flex items-start gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Price confirmed at checkout based on live bullion rate. 100% BIS Hallmarked guarantee.
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-luxury-gray">
                    <span>Subtotal</span>
                    <span>₹{Math.round(subtotal).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-luxury-gray">
                    <span>GST (3%)</span>
                    <span>₹{Math.round(gstTax).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-luxury-charcoal pt-1 border-t border-luxury-border">
                    <span>Estimated Total</span>
                    <span className="text-luxury-gold font-serif text-lg">
                      ₹{Math.round(grandTotal).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury"
                >
                  Proceed To Checkout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

