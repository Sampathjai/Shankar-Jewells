import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../api/client';
import { Product } from '../../../types';
import {
  Building2,
  Plus,
  Search,
  Trash2,
  AlertCircle,
  Printer,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
} from 'lucide-react';

interface WholesaleCustomer {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  gstin?: string;
  creditLimit: number;
  outstandingBalance: number;
  paymentTerms: string;
  dueDays: number;
}

interface BillItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  metalRate: number;
  makingCharge: number;
}

export const AdminWholesaleBillingPage: React.FC = () => {
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<WholesaleCustomer | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [immediatePayment, setImmediatePayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdInvoice, setCreatedInvoice] = useState<any | null>(null);

  // Credit Limit Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const custRes = await fetchApi<{ success: boolean; data: WholesaleCustomer[] }>('/wholesale/customers');
        setCustomers(custRes.data);

        const prodRes = await fetchApi<{ data: Product[] }>('/products');
        setProducts(prodRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load billing data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      const found = customers.find((c) => c.id === selectedCustomerId) || null;
      setSelectedCustomer(found);
    } else {
      setSelectedCustomer(null);
    }
  }, [selectedCustomerId, customers]);

  const addProductToBill = (product: Product) => {
    const existingIndex = billItems.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...billItems];
      updated[existingIndex].quantity += 1;
      setBillItems(updated);
    } else {
      setBillItems([
        ...billItems,
        {
          product,
          quantity: 1,
          unitPrice: product.displayPrice || product.sellingPrice,
          metalRate: product.calculatedPricing?.metalRate || 0,
          makingCharge: product.makingChargeValue || 0,
        },
      ]);
    }
  };

  const removeBillItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const updateItemQty = (index: number, qty: number) => {
    if (qty <= 0) return;
    const updated = [...billItems];
    updated[index].quantity = qty;
    setBillItems(updated);
  };

  const updateItemUnitPrice = (index: number, price: number) => {
    if (price < 0) return;
    const updated = [...billItems];
    updated[index].unitPrice = price;
    setBillItems(updated);
  };

  const subtotal = billItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * 0.03; // 3% GST
  const grandTotal = subtotal + tax;
  const netCreditRequired = Math.max(0, grandTotal - immediatePayment);

  const availableCredit = selectedCustomer
    ? Math.max(0, selectedCustomer.creditLimit - selectedCustomer.outstandingBalance)
    : 0;

  const isCreditExceeded = selectedCustomer
    ? selectedCustomer.outstandingBalance + netCreditRequired > selectedCustomer.creditLimit
    : false;

  const handleCheckout = async (isAuthorizedOverride = false) => {
    if (!selectedCustomer) {
      alert('Please select a wholesale customer.');
      return;
    }
    if (billItems.length === 0) {
      alert('Please add at least one product to the wholesale bill.');
      return;
    }

    if (isCreditExceeded && !isAuthorizedOverride) {
      setShowOverrideModal(true);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        customerId: selectedCustomer.id,
        immediatePayment,
        paymentMethod,
        referenceNo,
        notes,
        items: billItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          metalRate: item.metalRate,
          makingCharge: item.makingCharge,
        })),
        creditOverride: isAuthorizedOverride
          ? {
              reason: overrideReason || 'Authorized Manager Credit Limit Override',
            }
          : undefined,
      };

      const res = await fetchApi<{ success: boolean; data: any }>('/wholesale/invoices', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setCreatedInvoice(res.data);
        setShowOverrideModal(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to finalize wholesale invoice.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat =
      selectedCategory === 'ALL' ||
      (selectedCategory === 'GOLD' && p.metalType === 'GOLD') ||
      (selectedCategory === 'SILVER' && p.metalType === 'SILVER');
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-gold/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-gold font-bold flex items-center gap-3">
            <Building2 className="w-7 h-7 text-luxury-gold" />
            Wholesale B2B Billing & Credit Invoicing
          </h1>
          <p className="text-xs text-luxury-ivory/60 mt-1">
            Generate dedicated wholesale invoices, check business credit limits & record partial payments
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Grid: Left Selection / Right Bill */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Customer Select & Product Search (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Selection Card */}
          <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4" /> 1. Select Wholesale Retailer / Customer
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-luxury-gold"
                >
                  <option value="">-- Choose Wholesale Business --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} ({c.mobile}) - Outstanding: ₹{c.outstandingBalance.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <>
                  <div className="p-3 bg-white/5 rounded-xl border border-luxury-gold/20">
                    <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Credit Limit</span>
                    <div className="text-sm font-bold text-white">
                      ₹{selectedCustomer.creditLimit.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-luxury-gold/20">
                    <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Current Outstanding</span>
                    <div className="text-sm font-bold text-amber-400">
                      ₹{selectedCustomer.outstandingBalance.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-luxury-gold/20 sm:col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Available Credit Line</span>
                      <div
                        className={`text-base font-serif font-bold ${
                          availableCredit > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        ₹{availableCredit.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span className="text-[10px] bg-luxury-gold/20 text-luxury-gold px-2.5 py-1 rounded-full font-bold uppercase">
                      Terms: {selectedCustomer.paymentTerms}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product Manual Selection Grid */}
          <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" /> 2. Manual Product Search & Quick Add
              </h3>
              <div className="flex gap-1 text-[11px]">
                {(['ALL', 'GOLD', 'SILVER'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-semibold uppercase ${
                      selectedCategory === cat ? 'bg-luxury-gold text-luxury-charcoal' : 'bg-white/5 text-luxury-ivory/70'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-luxury-ivory/40" />
              <input
                type="text"
                placeholder="Search jewellery by product name or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-luxury-gold/10 transition-all text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-[10px] text-luxury-ivory/50 font-mono">
                      SKU: {p.sku} • {p.purity} {p.metalType} • {p.netWeight}g Net
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-luxury-gold">
                        ₹{(p.displayPrice || p.sellingPrice).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-luxury-ivory/40">Stock: {p.stockQuantity}</div>
                    </div>
                    <button
                      onClick={() => addProductToBill(p)}
                      className="p-1.5 rounded-lg bg-luxury-gold text-luxury-charcoal font-bold hover:bg-luxury-goldHover transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Invoice Items, Payment & Finalize (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center justify-between border-b border-luxury-gold/20 pb-3">
              <span>Wholesale Items Summary</span>
              <span className="text-xs text-luxury-ivory/70">{billItems.length} Items</span>
            </h3>

            {/* Itemized Table */}
            <div className="space-y-3 max-h-64 overflow-y-auto text-xs">
              {billItems.length === 0 ? (
                <div className="text-center py-10 text-luxury-ivory/40">
                  No items added yet. Click (+) on left to add stock.
                </div>
              ) : (
                billItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-xl border border-luxury-gold/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white">{item.product.name}</div>
                      <button
                        onClick={() => removeBillItem(idx)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-luxury-ivory/60">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQty(idx, parseInt(e.target.value) || 1)}
                          className="w-12 bg-luxury-charcoal border border-luxury-gold/30 rounded px-1.5 py-0.5 text-center text-white font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-luxury-ivory/60">Price:</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItemUnitPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-20 bg-luxury-charcoal border border-luxury-gold/30 rounded px-1.5 py-0.5 text-right text-white font-bold"
                        />
                      </div>

                      <div className="font-bold text-luxury-gold text-right">
                        ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-luxury-gold/20 pt-4 space-y-2 text-xs text-luxury-ivory/80">
              <div className="flex justify-between">
                <span>Subtotal (Net Wholesale):</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (3%):</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-serif font-bold text-white border-t border-luxury-gold/10 pt-2">
                <span>Grand Total:</span>
                <span className="text-luxury-gold">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Immediate Payment & Credit Options */}
            <div className="space-y-3 pt-2 border-t border-luxury-gold/20 text-xs">
              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">
                  Immediate Upfront Payment (Optional)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={immediatePayment || ''}
                  onChange={(e) => setImmediatePayment(parseFloat(e.target.value) || 0)}
                  className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-luxury-gold"
                />
              </div>

              {immediatePayment > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-luxury-ivory/70 text-[10px] mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-lg px-2 py-1.5 text-white"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="UPI">UPI / GPay</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-luxury-ivory/70 text-[10px] mb-1">Reference No / Txn ID</label>
                    <input
                      type="text"
                      placeholder="Ref #..."
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-lg px-2 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="p-3 bg-white/5 rounded-xl border border-luxury-gold/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Net Credit Added To Balance</span>
                  <div className="text-sm font-bold text-amber-400">
                    ₹{netCreditRequired.toLocaleString('en-IN')}
                  </div>
                </div>
                {isCreditExceeded && (
                  <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase">
                    Exceeds Credit Limit!
                  </span>
                )}
              </div>

              <button
                onClick={() => handleCheckout(false)}
                disabled={loading || billItems.length === 0 || !selectedCustomer}
                className="w-full py-3.5 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-bold rounded-xl shadow-luxury text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {loading ? 'Processing Wholesale Invoice...' : 'Generate Wholesale Invoice'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Limit Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-luxury-charcoal border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-rose-500/20 pb-3">
              <AlertCircle className="w-7 h-7 text-rose-400" />
              <div>
                <h3 className="font-serif text-lg font-bold text-rose-400">Credit Limit Exceeded</h3>
                <p className="text-[10px] text-luxury-ivory/60">Manager Authorization Required</p>
              </div>
            </div>

            <p className="text-xs text-luxury-ivory/80 leading-relaxed">
              This invoice requires <strong>₹{netCreditRequired.toLocaleString('en-IN')}</strong> credit, which will increase <strong>{selectedCustomer?.businessName}</strong>'s balance to <strong>₹{((selectedCustomer?.outstandingBalance || 0) + netCreditRequired).toLocaleString('en-IN')}</strong> (Credit Limit: ₹{selectedCustomer?.creditLimit.toLocaleString('en-IN')}).
            </p>

            <div className="space-y-2 text-xs">
              <label className="block text-luxury-ivory/70 font-semibold">
                Reason for Credit Limit Override *
              </label>
              <textarea
                rows={3}
                placeholder="State justification for authorizing credit extension..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full bg-luxury-charcoal border border-rose-500/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-luxury-gold/20 text-xs">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-luxury-ivory/70 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCheckout(true)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow"
              >
                Authorize & Generate Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Wholesale Invoice Modal with A4 Print Layout */}
      {createdInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-white text-luxury-charcoal rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" /> Wholesale Invoice Generated Successfully!
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-luxury-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black"
                >
                  <Printer className="w-4 h-4" /> Print A4 Invoice
                </button>
                <button
                  onClick={() => setCreatedInvoice(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable A4 Wholesale Invoice Layout */}
            <div className="p-6 border border-gray-300 rounded-xl space-y-6 text-xs bg-white text-black">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-amber-500 pb-4">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-amber-800">SHANKER JEWELLS</h1>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                    WHOLESALE & B2B JEWELLERY DIVISION • TRICHY
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    No.4 Sandhukadai, Bigbazzar Street, Trichy - 620008 | GSTIN: 33AAAAA0000A1Z5
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded uppercase tracking-wider">
                    WHOLESALE INVOICE
                  </span>
                  <div className="font-mono font-bold text-sm text-gray-800 mt-2">
                    #{createdInvoice.invoiceNumber}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Date: {new Date(createdInvoice.invoiceDate).toLocaleDateString()}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Due Date: {new Date(createdInvoice.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Billed To (Retailer)</span>
                  <div className="font-bold text-sm text-gray-900">{createdInvoice.customer?.businessName}</div>
                  <div className="text-gray-600">Phone: {createdInvoice.customer?.mobile}</div>
                  {createdInvoice.customer?.gstin && <div>GSTIN: {createdInvoice.customer?.gstin}</div>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Credit Terms</span>
                  <div className="font-semibold">{selectedCustomer?.paymentTerms}</div>
                  <div className="text-[10px] text-gray-600 mt-1">
                    Payment Status: <strong className="uppercase">{createdInvoice.paymentStatus}</strong>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300 text-[10px] uppercase text-gray-700 bg-gray-100">
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2">Item Description</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Unit Price</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {createdInvoice.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-2 px-2 font-mono text-[10px]">{item.sku}</td>
                      <td className="py-2 px-2 font-medium">{item.description}</td>
                      <td className="py-2 px-2 text-right font-bold">{item.quantity}</td>
                      <td className="py-2 px-2 text-right">₹{item.total / item.quantity}</td>
                      <td className="py-2 px-2 text-right font-bold">₹{item.total.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end border-t border-gray-200 pt-3">
                <div className="w-64 space-y-1 text-right text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{createdInvoice.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (3%):</span>
                    <span>₹{createdInvoice.tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-300 pt-1">
                    <span>Grand Total:</span>
                    <span>₹{createdInvoice.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 pt-1">
                    <span>Amount Paid:</span>
                    <span className="text-emerald-700 font-semibold">₹{createdInvoice.amountPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-800 border-t border-gray-300 pt-1">
                    <span>Net Outstanding Credit:</span>
                    <span>₹{createdInvoice.outstandingAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Footer Terms & Authorization */}
              <div className="pt-8 flex justify-between items-end text-[10px] text-gray-500 border-t border-gray-200">
                <div>
                  <p className="font-bold text-gray-700">Terms & Conditions:</p>
                  <p>1. Outstanding dues subject to interest if unpaid past credit due date.</p>
                  <p>2. BIS Hallmarked quality guaranteed by Shanker Jewells.</p>
                </div>
                <div className="text-center">
                  <div className="h-10 border-b border-gray-400 w-36 mb-1" />
                  <p className="font-bold text-gray-800">Authorized Signature</p>
                  <p className="text-[9px]">Shanker Jewells Trichy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWholesaleBillingPage;

