import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../api/client';
import { Product } from '../../../types';
import { useToast } from '../../../components/common/Toast';
import { CustomerPhotoPreview } from '../../../components/common/CustomerPhotoPreview';
import { formatCurrency } from '../../../utils/formatters';
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
  User,
  X,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';

interface WholesaleCustomer {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  gstRegistered?: boolean;
  gstin?: string;
  creditLimit: number;
  outstandingBalance: number;
  paymentTerms: string;
  dueDays: number;
  photoUrl?: string;
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
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'GOLD' | 'SILVER'>('ALL');
  const [selectedPurity, setSelectedPurity] = useState<string>('ALL');

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [gstEnabled, setGstEnabled] = useState<boolean>(false);
  const [gstRate, setGstRate] = useState<number>(3.0);
  const [immediatePayment, setImmediatePayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdInvoice, setCreatedInvoice] = useState<any | null>(null);

  // Photo Lightbox State
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{
    isOpen: boolean;
    photoUrl?: string;
    businessName?: string;
    contactPerson?: string;
    mobile?: string;
  }>({ isOpen: false });

  // Credit Limit Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const custRes = await fetchApi<{ success: boolean; data: WholesaleCustomer[] }>('/wholesale/customers');
        setCustomers(custRes.data || []);

        const prodRes = await fetchApi<{ data: Product[] }>('/products');
        setProducts(prodRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load wholesale billing data');
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
      if (found) {
        setGstEnabled(!!(found.gstRegistered || found.gstin));
      }
    } else {
      setSelectedCustomer(null);
      setGstEnabled(false);
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

  const rawSubtotal = billItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxableTotal = Math.max(0, rawSubtotal - discountAmount);
  const gstTax = gstEnabled ? taxableTotal * (gstRate / 100) : 0;
  const grandTotal = taxableTotal + gstTax;
  const netCreditRequired = Math.max(0, grandTotal - immediatePayment);

  const availableCredit = selectedCustomer
    ? Math.max(0, selectedCustomer.creditLimit - selectedCustomer.outstandingBalance)
    : 0;

  const isCreditExceeded = selectedCustomer
    ? selectedCustomer.outstandingBalance + netCreditRequired > selectedCustomer.creditLimit
    : false;

  const { showToast } = useToast();

  const handleCheckout = async (isAuthorizedOverride = false) => {
    if (!selectedCustomer) {
      showToast('Please select a wholesale retailer customer.', 'error');
      return;
    }
    if (billItems.length === 0) {
      showToast('Please add at least one product item to the wholesale bill.', 'error');
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
        discount: discountAmount,
        gstEnabled,
        gstRate,
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
    const matchesPurity = selectedPurity === 'ALL' || p.purity === selectedPurity;
    return matchesSearch && matchesCat && matchesPurity;
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.businessName.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.mobile.includes(customerSearchQuery) ||
      (c.gstin && c.gstin.toLowerCase().includes(customerSearchQuery.toLowerCase()))
  );

  // If created invoice, render A4 Printable Invoice View
  if (createdInvoice) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 bg-luxury-ivory min-h-screen">
        <div className="flex items-center justify-between no-print border-b border-luxury-border pb-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-luxury-charcoal flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              Wholesale Tax Invoice Issued
            </h2>
            <p className="text-xs text-luxury-gray">Invoice #{createdInvoice.invoiceNumber} recorded in wholesale ledger.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-luxury-gold text-white font-bold rounded-xl text-xs shadow-sm hover:bg-luxury-gold/90 transition-all"
            >
              <Printer className="w-4 h-4" /> Print Tax Invoice
            </button>
            <button
              onClick={() => {
                setCreatedInvoice(null);
                setBillItems([]);
                setSelectedCustomerId('');
                setSelectedCustomer(null);
                setImmediatePayment(0);
                setNotes('');
                setReferenceNo('');
              }}
              className="px-4 py-2 bg-white text-luxury-charcoal border border-luxury-border font-bold rounded-xl text-xs hover:bg-luxury-ivory transition-all shadow-sm"
            >
              Create Next Bill
            </button>
          </div>
        </div>

        {/* Printable A4 Container */}
        <div className="bg-white border border-luxury-border p-8 rounded-2xl shadow-card space-y-6 text-xs text-luxury-charcoal printable-area">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-luxury-border pb-6">
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-wider text-luxury-charcoal">SHANKER JEWELLS</h1>
              <p className="text-[11px] text-luxury-gray">No. 4, Sandhukadai, Big Bazzar Street, Trichy - 620008</p>
              <p className="text-[11px] text-luxury-gray">Phone: +91 944394912</p>
              <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Wholesale B2B Billing Invoice
              </span>
            </div>
            <div className="text-right space-y-1">
              <div className="text-base font-serif font-bold text-luxury-gold">INVOICE #{createdInvoice.invoiceNumber}</div>
              <div className="text-luxury-gray">Date: {new Date(createdInvoice.invoiceDate || Date.now()).toLocaleDateString('en-IN')}</div>
              <div className="text-luxury-gray">Due Date: {new Date(createdInvoice.dueDate || Date.now()).toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          {/* Customer & Credit Details */}
          <div className="grid grid-cols-2 gap-6 bg-luxury-ivory/60 p-4 rounded-xl border border-luxury-border items-center">
            <div className="flex items-center gap-3">
              {createdInvoice.customer?.photoUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewPhotoModal({
                      isOpen: true,
                      photoUrl: createdInvoice.customer?.photoUrl,
                      businessName: createdInvoice.customer?.businessName,
                      contactPerson: createdInvoice.customer?.contactPerson,
                      mobile: createdInvoice.customer?.mobile,
                    })
                  }
                  className="w-12 h-12 rounded-full border border-luxury-border overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  title="Click to view full photo lightbox"
                >
                  <img src={createdInvoice.customer.photoUrl} alt="" className="w-full h-full object-cover" />
                </button>
              )}
              <div>
                <span className="text-[10px] uppercase font-bold text-luxury-gray tracking-wider">Billed To (Retailer)</span>
                <div className="font-bold text-sm text-luxury-charcoal mt-0.5">{createdInvoice.customer?.businessName}</div>
                <div>Contact: {createdInvoice.customer?.contactPerson || 'N/A'} ({createdInvoice.customer?.mobile})</div>
                <div>
                  GST Status: {createdInvoice.customer?.gstRegistered || createdInvoice.customer?.gstin ? (
                    <span className="font-bold font-mono text-emerald-700">{createdInvoice.customer?.gstin || 'Registered'}</span>
                  ) : (
                    <span className="text-slate-500 font-medium">Not Registered</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="text-[10px] uppercase font-bold text-luxury-gray tracking-wider">Credit Account Summary</span>
              <div>Payment Terms: <span className="font-bold">{createdInvoice.customer?.paymentTerms || 'NET 30'}</span></div>
              <div>Previous Dues: {formatCurrency(createdInvoice.customer?.outstandingBalance || 0)}</div>
              <div>New Net Balance: <span className="font-bold text-amber-700">{formatCurrency((createdInvoice.customer?.outstandingBalance || 0) + createdInvoice.netCreditAdded)}</span></div>
            </div>
          </div>

          {/* Item Table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-luxury-border text-luxury-gray uppercase text-[10px] font-bold text-left bg-luxury-ivory/50">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Item Description</th>
                <th className="py-2.5 px-2 text-right">Qty</th>
                <th className="py-2.5 px-2 text-right">Gross Wt</th>
                <th className="py-2.5 px-2 text-right">Net Wt</th>
                <th className="py-2.5 px-2 text-right">Unit Price</th>
                <th className="py-2.5 px-2 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/60">
              {createdInvoice.items?.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="py-2.5 px-2">{idx + 1}</td>
                  <td className="py-2.5 px-2 font-semibold">
                    {item.product?.name || item.name || 'Jewellery Item'}
                    <span className="block text-[10px] text-luxury-gray font-mono">{item.product?.sku}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono">{item.quantity}</td>
                  <td className="py-2.5 px-2 text-right font-mono">{item.grossWeight || item.product?.grossWeight || 0}g</td>
                  <td className="py-2.5 px-2 text-right font-mono">{item.netWeight || item.product?.netWeight || 0}g</td>
                  <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold">{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="flex justify-end pt-4 border-t border-luxury-border">
            <div className="w-80 space-y-2 text-right text-xs">
              <div className="flex justify-between text-luxury-gray">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-luxury-charcoal">{formatCurrency(createdInvoice.subtotal)}</span>
              </div>

              {createdInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-luxury-gray">
                  <span>Discount:</span>
                  <span className="font-mono font-bold text-rose-600">-{formatCurrency(createdInvoice.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-luxury-gray">
                <span>Taxable Amount:</span>
                <span className="font-mono font-bold text-luxury-charcoal">{formatCurrency(createdInvoice.taxableAmount ?? createdInvoice.subtotal)}</span>
              </div>

              <div className="flex justify-between text-luxury-gray">
                <span>GST Tax ({createdInvoice.gstEnabled ? `${createdInvoice.gstRate ?? 3}%` : 'OFF'}):</span>
                <span className="font-mono font-bold text-luxury-charcoal">
                  {createdInvoice.gstEnabled ? formatCurrency(createdInvoice.gstAmount ?? createdInvoice.tax) : '₹0.00 (Disabled)'}
                </span>
              </div>

              <div className="flex justify-between font-serif text-sm font-bold text-luxury-charcoal pt-2 border-t border-luxury-border">
                <span>Grand Total:</span>
                <span className="font-mono text-luxury-gold">{formatCurrency(createdInvoice.grandTotal)}</span>
              </div>

              <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                <span>Upfront Paid:</span>
                <span className="font-mono font-bold">{formatCurrency(createdInvoice.immediatePayment || 0)}</span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded">
                <span>Net Credit Added:</span>
                <span className="font-mono">{formatCurrency(createdInvoice.netCreditAdded || 0)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-12 flex justify-between items-end text-[10px] text-luxury-gray">
            <div className="text-center w-48 border-t border-luxury-border pt-2">
              Customer Signature
            </div>
            <div className="text-center w-48 border-t border-luxury-border pt-2 font-bold text-luxury-charcoal">
              For SHANKER JEWELLS
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-luxury-ivory min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-border pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-charcoal font-bold flex items-center gap-3">
            <Building2 className="w-7 h-7 text-luxury-gold" />
            Wholesale B2B Billing & Credit Workspace
          </h1>
          <p className="text-xs text-luxury-gray mt-1">
            Issue wholesale invoices to registered retailers, enforce credit limit checks, and process partial payments.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          {error}
        </div>
      )}

      {/* Main 2-Column Desktop Grid (~65% Left / ~35% Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Customer Selection & Product Search (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Selection Card */}
          <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-luxury-gold" /> 1. Wholesale Retailer Account
              </h3>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="text-xs text-luxury-gold font-bold flex items-center gap-1 hover:underline"
              >
                <Search className="w-3.5 h-3.5" /> Search Customer Directory
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-white border border-luxury-border rounded-xl px-4 py-3 text-luxury-charcoal font-medium focus:outline-none focus:border-luxury-gold shadow-sm"
                >
                  <option value="">-- Select Wholesale Retailer Business --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} ({c.mobile}) - Outstanding: ₹{c.outstandingBalance.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <>
                  <div className="p-3.5 bg-luxury-ivory/60 rounded-xl border border-luxury-border">
                    <span className="text-[10px] text-luxury-gray uppercase font-bold tracking-wider">Approved Credit Limit</span>
                    <div className="text-base font-serif font-bold text-luxury-charcoal mt-0.5">
                      ₹{selectedCustomer.creditLimit.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-3.5 bg-luxury-ivory/60 rounded-xl border border-luxury-border">
                    <span className="text-[10px] text-luxury-gray uppercase font-bold tracking-wider">Current Outstanding Dues</span>
                    <div className="text-base font-serif font-bold text-amber-700 mt-0.5">
                      ₹{selectedCustomer.outstandingBalance.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-3.5 bg-luxury-ivory/60 rounded-xl border border-luxury-border sm:col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-luxury-gray uppercase font-bold tracking-wider">Available Credit Line</span>
                      <div
                        className={`text-lg font-serif font-bold ${
                          availableCredit > 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        ₹{availableCredit.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span className="text-[10px] bg-luxury-gold/10 text-luxury-gold px-3 py-1 rounded-full font-bold uppercase border border-luxury-gold/20">
                      Terms: {selectedCustomer.paymentTerms} ({selectedCustomer.dueDays} Days)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product Manual Selection Grid */}
          <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-luxury-gold" /> 2. Inventory Product Search & Quick Add
              </h3>
              <div className="flex gap-1 text-[11px]">
                {(['ALL', 'GOLD', 'SILVER'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold uppercase transition-all ${
                      selectedCategory === cat
                        ? 'bg-luxury-gold text-white shadow-sm'
                        : 'bg-luxury-ivory text-luxury-gray hover:text-luxury-charcoal'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input & Purity Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-luxury-gray" />
                <input
                  type="text"
                  placeholder="Search by SKU, product name, or barcode..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-white border border-luxury-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                />
              </div>

              <select
                value={selectedPurity}
                onChange={(e) => setSelectedPurity(e.target.value)}
                className="bg-white border border-luxury-border rounded-xl px-3 py-2.5 text-xs text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
              >
                <option value="ALL">All Purities</option>
                <option value="K24">24K Gold</option>
                <option value="K22">22K Gold</option>
                <option value="K18">18K Gold</option>
                <option value="SILVER_925">925 Silver</option>
                <option value="SILVER_999">999 Silver</option>
              </select>
            </div>

            {/* Product Cards List */}
            <div className="max-h-[420px] overflow-y-auto pr-1 space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-10 text-luxury-gray text-xs">
                  No inventory products found matching search filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredProducts.map((prod) => {
                    const price = prod.displayPrice || prod.sellingPrice;
                    const imageUrl = prod.images && prod.images.length > 0 ? prod.images[0].url : null;

                    return (
                      <div
                        key={prod.id}
                        className="p-3.5 bg-luxury-ivory/40 hover:bg-luxury-ivory border border-luxury-border rounded-xl transition-all flex gap-3 group"
                      >
                        <div className="w-16 h-16 rounded-lg bg-white border border-luxury-border flex items-center justify-center overflow-hidden shrink-0">
                          {imageUrl ? (
                            <img src={imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <Sparkles className="w-6 h-6 text-luxury-gold/40" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="font-bold text-xs text-luxury-charcoal truncate">{prod.name}</div>
                          <div className="text-[10px] text-luxury-gray flex items-center gap-2 font-mono">
                            <span>SKU: {prod.sku}</span>
                            <span>•</span>
                            <span className="text-luxury-gold font-semibold">{prod.purity}</span>
                          </div>
                          <div className="text-[10px] text-luxury-gray">
                            Net Wt: <span className="font-semibold text-luxury-charcoal">{prod.netWeight}g</span> | Gross: {prod.grossWeight}g
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="font-bold font-mono text-xs text-luxury-charcoal">
                              ₹{price.toLocaleString('en-IN')}
                            </span>
                            <button
                              onClick={() => addProductToBill(prod)}
                              className="px-2.5 py-1 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Wholesale Bill Summary Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-5 sticky top-6">
            <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center justify-between border-b border-luxury-border pb-3">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-luxury-gold" /> Wholesale Invoice Summary
              </span>
              <span className="text-xs text-luxury-gray font-mono">{billItems.length} Items</span>
            </h3>

            {/* Selected Customer Header Banner */}
            {selectedCustomer ? (
              <div className="p-3 bg-luxury-ivory/80 rounded-xl border border-luxury-border flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-luxury-charcoal">{selectedCustomer.businessName}</div>
                  <div className="text-[10px] text-luxury-gray">GSTIN: {selectedCustomer.gstin || 'Unregistered'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-luxury-gray">Available Credit</div>
                  <div className={`font-mono font-bold ${availableCredit > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    ₹{availableCredit.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                Select a wholesale retailer account to proceed.
              </div>
            )}

            {/* Bill Items List Table */}
            <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
              {billItems.length === 0 ? (
                <div className="text-center py-8 text-luxury-gray text-xs">
                  No items added to invoice yet. Click "+ Add" on inventory products.
                </div>
              ) : (
                billItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-luxury-ivory/40 rounded-xl border border-luxury-border space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-luxury-charcoal">{item.product.name}</div>
                        <div className="text-[10px] text-luxury-gray font-mono">
                          SKU: {item.product.sku} | Wt: {item.product.netWeight}g
                        </div>
                      </div>
                      <button
                        onClick={() => removeBillItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-luxury-border/60">
                      <div>
                        <span className="text-[9px] text-luxury-gray uppercase font-bold">Qty</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQty(idx, parseInt(e.target.value) || 1)}
                          className="w-full bg-white border border-luxury-border rounded-md px-2 py-1 font-mono text-xs font-bold text-luxury-charcoal"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-luxury-gray uppercase font-bold">Unit Price (₹)</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItemUnitPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-luxury-border rounded-md px-2 py-1 font-mono text-xs font-bold text-luxury-charcoal text-right"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Financial Calculations */}
            <div className="space-y-2.5 pt-3 border-t border-luxury-border text-xs">
              <div className="flex justify-between text-luxury-gray">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-luxury-charcoal">{formatCurrency(rawSubtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-luxury-gray">
                <span>Wholesale Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-28 bg-white border border-luxury-border rounded-md px-2 py-1 font-mono text-xs text-right font-bold text-luxury-charcoal"
                />
              </div>

              <div className="flex justify-between text-luxury-gray">
                <span>Taxable Amount:</span>
                <span className="font-mono font-bold text-luxury-charcoal">{formatCurrency(taxableTotal)}</span>
              </div>

              {/* GST Toggle & Rate Config */}
              <div className="flex items-center justify-between p-2 bg-luxury-ivory/80 rounded-xl border border-luxury-border">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-luxury-charcoal">GST Tax:</span>
                  <button
                    type="button"
                    onClick={() => setGstEnabled(!gstEnabled)}
                    className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase transition-all ${
                      gstEnabled
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    GST {gstEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {gstEnabled ? (
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[10px] text-luxury-gray font-sans font-bold">Rate:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={gstRate}
                      onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                      className="w-12 bg-white border border-luxury-border rounded px-1 py-0.5 font-mono text-xs text-center font-bold"
                    />
                    <span className="text-xs font-bold">%</span>
                    <span className="font-bold text-luxury-charcoal ml-2">{formatCurrency(gstTax)}</span>
                  </div>
                ) : (
                  <span className="font-mono text-xs text-slate-500 font-medium">₹0.00 (Disabled)</span>
                )}
              </div>

              <div className="flex justify-between text-base font-serif font-bold text-luxury-charcoal pt-2 border-t border-luxury-border">
                <span>Grand Total:</span>
                <span className="font-mono text-luxury-gold">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Upfront Payment & Net Credit */}
              <div className="p-3 bg-luxury-ivory/80 rounded-xl border border-luxury-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-luxury-charcoal">Upfront Deposit / Payment (₹):</span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={immediatePayment}
                    onChange={(e) => setImmediatePayment(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-32 bg-white border border-luxury-border rounded-md px-2.5 py-1.5 font-mono text-xs text-right font-bold text-emerald-700 shadow-sm"
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-luxury-border">
                  <span className="text-luxury-gray">Net Credit Added to Ledger:</span>
                  <span className="font-mono font-bold text-amber-700">{formatCurrency(netCreditRequired)}</span>
                </div>
              </div>
            </div>

            {/* Credit Limit Exceeded Warning Banner */}
            {isCreditExceeded && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Credit Limit Exceeded Warning
                </div>
                <p className="text-[11px] text-rose-700">
                  This transaction requires {formatCurrency(netCreditRequired)} credit line, exceeding the available {formatCurrency(availableCredit)}. Requires Manager Override.
                </p>
              </div>
            )}

            {/* Action Checkout Button */}
            <button
              onClick={() => handleCheckout(false)}
              disabled={loading || billItems.length === 0 || !selectedCustomer}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 ${
                isCreditExceeded
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-luxury-gold hover:bg-luxury-gold/90 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <span>Processing Invoice...</span>
              ) : isCreditExceeded ? (
                <>
                  <ShieldCheck className="w-4 h-4" /> Request Manager Credit Override
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Finalize Wholesale Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Directory Search Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-luxury-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-luxury-border rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-luxury-border pb-3">
              <h3 className="font-serif text-base font-bold text-luxury-charcoal flex items-center gap-2">
                <Building2 className="w-5 h-5 text-luxury-gold" /> Select Wholesale Retailer Directory
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-luxury-gray hover:text-luxury-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-luxury-gray" />
              <input
                type="text"
                placeholder="Search business name, phone number, or GSTIN..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="w-full bg-white border border-luxury-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
              />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-luxury-gray text-xs">No retailer customer found.</div>
              ) : (
                filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomerId(c.id);
                      setShowCustomerModal(false);
                    }}
                    className="p-3 bg-luxury-ivory/60 hover:bg-luxury-ivory border border-luxury-border rounded-xl cursor-pointer transition-all flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-luxury-charcoal text-sm">{c.businessName}</div>
                      <div className="text-luxury-gray text-[11px]">
                        Contact: {c.contactPerson || 'N/A'} ({c.mobile}) | GST: {c.gstin || 'Unregistered'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-700">₹{c.outstandingBalance.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-luxury-gray">Limit: ₹{c.creditLimit.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Credit Limit Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-luxury-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-luxury-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-luxury-border pb-3">
              <h3 className="font-serif text-base font-bold text-amber-700 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" /> Manager Credit Override
              </h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-luxury-gray hover:text-luxury-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-luxury-gray">
              The invoice net credit required exceeds <span className="font-bold text-luxury-charcoal">{selectedCustomer?.businessName}</span>'s credit limit. Provide an override reason to authorize this B2B billing.
            </p>

            <div>
              <label className="block text-xs font-bold text-luxury-charcoal mb-1">Override Reason / Authorization Notes *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Special festive stock clearance approved by Store Owner"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full bg-white border border-luxury-border rounded-xl p-3 text-xs text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="flex-1 py-2.5 bg-white text-luxury-charcoal border border-luxury-border rounded-xl font-bold text-xs hover:bg-luxury-ivory transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCheckout(true)}
                disabled={loading || !overrideReason.trim()}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? 'Authorizing...' : 'Authorize & Issue Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Photo Preview Lightbox */}
      <CustomerPhotoPreview
        isOpen={previewPhotoModal.isOpen}
        onClose={() => setPreviewPhotoModal({ ...previewPhotoModal, isOpen: false })}
        photoUrl={previewPhotoModal.photoUrl}
        businessName={previewPhotoModal.businessName}
        contactPerson={previewPhotoModal.contactPerson}
        mobile={previewPhotoModal.mobile}
      />
    </div>
  );
};

export default AdminWholesaleBillingPage;
