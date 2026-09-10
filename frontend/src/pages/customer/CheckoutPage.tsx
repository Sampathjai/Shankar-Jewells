import React, { useState } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { fetchApi } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, CreditCard, Banknote, QrCode } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, clearCart } = useCartStore();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const subtotal = items.reduce((acc, item) => {
    const price = item.product.displayPrice || item.product.sellingPrice;
    return acc + price * item.quantity;
  }, 0);

  const gstTax = subtotal * 0.03;
  const grandTotal = subtotal + gstTax;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    try {
      setSubmitting(true);
      const res = await fetchApi<{ success: boolean; data: any }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          customerEmail: formData.email,
          customerAddress: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
          paymentMethod,
        }),
      });

      clearCart();
      navigate(`/order-success?inv=${res.data.invoice.invoiceNumber}`);
    } catch (err: any) {
      alert(err.message || 'Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-luxury-charcoal">Your bag is empty</h2>
        <button
          onClick={() => navigate('/shop')}
          className="px-6 py-2.5 rounded-full bg-luxury-gold text-white font-semibold text-xs uppercase tracking-widest"
        >
          Explore Catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-luxury-border pb-4">
        <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
          Secure Insured Checkout
        </span>
        <h1 className="font-serif text-3xl font-bold text-luxury-charcoal">
          Shipping & Payment Details
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 columns: Address & Payment */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Form */}
          <div className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-4 text-xs">
            <h3 className="font-serif text-lg font-bold text-luxury-charcoal border-b border-luxury-border pb-2">
              1. Delivery Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-md border border-luxury-border"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-4 text-xs">
            <h3 className="font-serif text-lg font-bold text-luxury-charcoal border-b border-luxury-border pb-2">
              2. Payment Option
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'CARD', label: 'Credit/Debit Card', icon: CreditCard },
                { id: 'UPI', label: 'UPI / Google Pay', icon: QrCode },
                { id: 'CASH', label: 'Cash On Delivery', icon: Banknote },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                      paymentMethod === m.id
                        ? 'border-luxury-gold bg-luxury-beige/50 text-luxury-gold font-bold shadow-sm'
                        : 'border-luxury-border text-luxury-gray hover:border-luxury-gold/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 column: Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-4 text-xs">
            <h3 className="font-serif text-lg font-bold text-luxury-charcoal border-b border-luxury-border pb-2">
              Order Summary ({items.length})
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-semibold text-luxury-charcoal line-clamp-1">{product.name}</h4>
                    <span className="text-[10px] text-luxury-gray">
                      Qty: {quantity} • {product.netWeight}g Net
                    </span>
                  </div>
                  <strong className="text-luxury-charcoal">
                    ₹{((product.displayPrice || product.sellingPrice) * quantity).toLocaleString('en-IN')}
                  </strong>
                </div>
              ))}
            </div>

            <div className="border-t border-luxury-border pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-luxury-gray">
                <span>Subtotal:</span>
                <span>₹{Math.round(subtotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>GST (3%):</span>
                <span>₹{Math.round(gstTax).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-luxury-charcoal pt-2 border-t border-luxury-border">
                <span>Grand Total:</span>
                <span className="font-serif text-xl text-luxury-gold">
                  ₹{Math.round(grandTotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury"
            >
              <Lock className="w-4 h-4" /> {submitting ? 'Processing...' : 'Place Order & Finalize Bill'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

