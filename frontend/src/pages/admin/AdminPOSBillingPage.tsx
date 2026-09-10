import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { fetchApi } from '../../api/client';
import { Search, Barcode, Trash2, Printer, CheckCircle2, User, CreditCard, ShieldCheck } from 'lucide-react';

export const AdminPOSBillingPage: React.FC = () => {
  const [skuSearch, setSkuSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [billItems, setBillItems] = useState<{ product: Product; quantity: number; customDiscount: number; customMakingOverride?: number }[]>([]);

  const [customer, setCustomer] = useState({
    name: 'Walk-in Customer',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const res = await fetchApi<{ data: Product[] }>('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load catalogue:', err);
    }
  }

  const handleAddProductBySku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuSearch.trim()) return;

    const matched = products.find(
      (p) => p.sku.toLowerCase() === skuSearch.trim().toLowerCase() || p.barcode === skuSearch.trim()
    );

    if (matched) {
      addItemToBill(matched);
      setSkuSearch('');
    } else {
      alert(`No product found with SKU/Barcode: ${skuSearch}`);
    }
  };

  const addItemToBill = (product: Product) => {
    const existing = billItems.findIndex((i) => i.product.id === product.id);
    if (existing > -1) {
      const copy = [...billItems];
      copy[existing].quantity += 1;
      setBillItems(copy);
    } else {
      setBillItems([...billItems, { product, quantity: 1, customDiscount: 0 }]);
    }
  };

  const removeItem = (productId: string) => {
    setBillItems(billItems.filter((i) => i.product.id !== productId));
  };

  const subtotal = billItems.reduce((acc, item) => {
    const unitPrice = item.product.displayPrice || item.product.sellingPrice;
    return acc + (unitPrice - item.customDiscount) * item.quantity;
  }, 0);

  const gstTax = subtotal * 0.03;
  const grandTotal = subtotal + gstTax;

  const handleFinalizeBill = async () => {
    if (billItems.length === 0) return;

    try {
      setSubmitting(true);
      const res = await fetchApi<{ success: boolean; data: any }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({
          customerName: customer.name,
          customerPhone: customer.phone || '9999999999',
          customerEmail: customer.email,
          customerAddress: customer.address,
          customerGstin: customer.gstin,
          items: billItems.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            customDiscount: i.customDiscount,
            customMakingOverride: i.customMakingOverride,
          })),
          paymentMethod,
        }),
      });

      setLastInvoice(res.data.invoice);
      setBillItems([]);
      alert(`Invoice ${res.data.invoice.invoiceNumber} generated!`);
    } catch (err: any) {
      alert(err.message || 'Billing error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-center border-b border-luxury-border pb-4">
        <div>
          <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
            High-Speed Counter POS Terminal
          </span>
          <h1 className="font-serif text-3xl font-bold text-luxury-charcoal">
            Jewellery Billing & Invoice Desk
          </h1>
        </div>

        {lastInvoice && (
          <a
            href={`/api/billing/invoices/${lastInvoice.invoiceNumber}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold uppercase flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Invoice {lastInvoice.invoiceNumber}
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Product Scan & Bill Items Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barcode / SKU Scanner Input */}
          <form onSubmit={handleAddProductBySku} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Scan barcode or enter SKU (e.g. GLD-NCK-001)..."
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                className="w-full text-sm py-3 pl-10 pr-4 rounded-xl border border-luxury-gold focus:ring-2 focus:ring-luxury-gold"
                autoFocus
              />
              <Barcode className="w-5 h-5 text-luxury-gold absolute left-3 top-3.5" />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-luxury-gold text-white font-semibold text-xs uppercase"
            >
              Add Item
            </button>
          </form>

          {/* Quick Catalogue Picker */}
          <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card space-y-2">
            <span className="text-[10px] font-semibold text-luxury-gold uppercase tracking-widest block">
              Quick Vault Select
            </span>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => addItemToBill(p)}
                  className="px-3 py-2 rounded-lg bg-luxury-beige/50 border border-luxury-border text-left shrink-0 hover:border-luxury-gold text-xs"
                >
                  <strong className="block text-luxury-charcoal line-clamp-1">{p.name}</strong>
                  <span className="text-[10px] text-luxury-gold font-mono">{p.sku} • {p.netWeight}g</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bill Items Table */}
          <div className="bg-white rounded-2xl border border-luxury-border shadow-card overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-luxury-border bg-luxury-beige/40 text-luxury-gold font-semibold uppercase">
                  <th className="py-3 px-4">Item SKU / Name</th>
                  <th className="py-3 px-4">Net Wt</th>
                  <th className="py-3 px-4">Rate/g</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Discount (₹)</th>
                  <th className="py-3 px-4">Line Total</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/50">
                {billItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-luxury-gray">
                      No items scanned into current bill. Use barcode scanner or quick vault select.
                    </td>
                  </tr>
                ) : (
                  billItems.map((item, idx) => {
                    const unitPrice = item.product.displayPrice || item.product.sellingPrice;
                    const lineTotal = (unitPrice - item.customDiscount) * item.quantity;
                    return (
                      <tr key={item.product.id} className="hover:bg-luxury-beige/20">
                        <td className="py-3 px-4">
                          <strong className="text-luxury-charcoal block">{item.product.name}</strong>
                          <span className="text-[10px] text-luxury-gray font-mono">{item.product.sku}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold">{item.product.netWeight}g</td>
                        <td className="py-3 px-4">₹{item.product.calculatedPricing?.metalRate || 6830}</td>
                        <td className="py-3 px-4">{item.quantity}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={item.customDiscount}
                            onChange={(e) => {
                              const copy = [...billItems];
                              copy[idx].customDiscount = parseFloat(e.target.value) || 0;
                              setBillItems(copy);
                            }}
                            className="w-16 p-1 border rounded text-xs"
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-luxury-gold">
                          ₹{Math.round(lineTotal).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => removeItem(item.product.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Customer Info & Payment Finalization */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-luxury-border shadow-card space-y-4 text-xs">
            <h3 className="font-serif text-lg font-bold text-luxury-charcoal border-b pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-luxury-gold" /> Customer Profile
            </h3>

            <div className="space-y-2">
              <div>
                <label className="font-semibold block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded bg-white font-semibold"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="border-t border-luxury-border pt-4 space-y-2">
              <div className="flex justify-between text-luxury-gray">
                <span>Subtotal:</span>
                <span>₹{Math.round(subtotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>GST (3%):</span>
                <span>₹{Math.round(gstTax).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 border-t text-luxury-charcoal">
                <span>Grand Total:</span>
                <span className="font-serif text-2xl text-luxury-gold">
                  ₹{Math.round(grandTotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinalizeBill}
              disabled={submitting || billItems.length === 0}
              className="w-full py-4 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury"
            >
              <Printer className="w-4 h-4" /> {submitting ? 'Finalizing Bill...' : 'Finalize Bill & Generate PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

