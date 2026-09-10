import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../api/client';
import { Product } from '../../../types';
import { useToast } from '../../../components/common/Toast';
import { CustomerPhotoPreview } from '../../../components/common/CustomerPhotoPreview';
import { WholesalePaymentReceiptModal } from '../../../components/wholesale/WholesalePaymentReceiptModal';
import { WhatsAppShareButton } from '../../../components/common/WhatsAppShareButton';
import { formatCurrency } from '../../../utils/formatters';
import { calculateInvoiceGoldEquivalent, formatGoldGrams, roundGoldGrams } from '../../../utils/goldEquivalent';
import { buildWholesaleInvoiceMessage } from '../../../utils/whatsapp';
import {
  Building2,
  Plus,
  Search,
  Trash2,
  AlertCircle,
  AlertTriangle,
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
  Coins,
  Calculator,
} from 'lucide-react';

interface WholesaleCustomer {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  gstRegistered?: boolean;
  gstin?: string;
  creditLimit: number;
  creditLimitGoldGrams: number;
  outstandingBalance: number;
  outstandingGoldGrams: number;
  availableCreditGoldGrams?: number;
  currentCreditLimitInr?: number;
  currentOutstandingInr?: number;
  currentAvailableCreditInr?: number;
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
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [activeRate24K, setActiveRate24K] = useState<number>(6830);
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
        const custRes = await fetchApi<{
          success: boolean;
          activeRate24K?: number;
          data: WholesaleCustomer[];
        }>('/wholesale/customers');
        setCustomers(custRes.data || []);
        if (custRes.activeRate24K) setActiveRate24K(custRes.activeRate24K);

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
          metalRate: product.calculatedPricing?.metalRate || activeRate24K,
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

  // Billing Math Calculations
  const rawSubtotal = billItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxableTotal = Math.max(0, rawSubtotal - discountAmount);
  const gstTax = gstEnabled ? taxableTotal * (gstRate / 100) : 0;
  const grandTotal = Math.round((taxableTotal + gstTax) * 100) / 100;
  const netCreditRequiredInr = Math.max(0, grandTotal - immediatePayment);

  // Gold Equivalent Calculations
  const invoiceGoldEqGrams = calculateInvoiceGoldEquivalent(grandTotal, activeRate24K);
  const netCreditRequiredGoldGrams = calculateInvoiceGoldEquivalent(netCreditRequiredInr, activeRate24K);

  const customerLimitGrams = selectedCustomer
    ? selectedCustomer.creditLimitGoldGrams || (selectedCustomer.creditLimit / activeRate24K)
    : 0;
  const customerOutstandingGrams = selectedCustomer
    ? selectedCustomer.outstandingGoldGrams || (selectedCustomer.outstandingBalance / activeRate24K)
    : 0;
  const customerAvailableGrams = Math.max(0, customerLimitGrams - customerOutstandingGrams);
  const projectedOutstandingGrams = roundGoldGrams(customerOutstandingGrams + netCreditRequiredGoldGrams, 4);

  const isCreditExceeded = selectedCustomer ? projectedOutstandingGrams > customerLimitGrams : false;

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
        referenceNo: referenceNo || undefined,
        notes: notes || undefined,
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
        showToast('Wholesale invoice created successfully.', 'success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to finalize wholesale invoice.');
      showToast(err.message || 'Failed to finalize wholesale invoice.', 'error');
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

  // If created invoice, render Printable Invoice View
  if (createdInvoice) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 bg-luxury-ivory min-h-screen">
        <div className="flex items-center justify-between no-print border-b border-luxury-border pb-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-luxury-charcoal flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              Wholesale Tax Invoice Issued
            </h2>
            <p className="text-xs text-luxury-gray">Invoice #{createdInvoice.invoiceNumber} recorded in 24K Gold Equivalent ledger.</p>
          </div>
          <div className="flex gap-3 items-center">
            <WhatsAppShareButton
              phone={selectedCustomer?.mobile || createdInvoice.customer?.mobile}
              message={buildWholesaleInvoiceMessage({
                invoiceNumber: createdInvoice.invoiceNumber,
                customerName: selectedCustomer?.businessName || createdInvoice.customer?.businessName || 'Wholesale Customer',
                grandTotal: createdInvoice.grandTotal,
                goldEquivalentGrams: createdInvoice.goldEquivalentGrams || (createdInvoice.grandTotal / (createdInvoice.rate24K || activeRate24K)),
                rate24K: createdInvoice.rate24K || activeRate24K,
                gstRegistered: selectedCustomer?.gstRegistered,
                gstin: selectedCustomer?.gstin,
                outstandingGoldGrams: selectedCustomer?.outstandingGoldGrams,
              })}
              label="WhatsApp Invoice"
            />
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-luxury-gold text-white font-bold rounded-xl text-xs shadow-sm hover:bg-luxury-gold/90 transition-all min-h-[44px]"
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
              className="px-4 py-2 bg-white text-luxury-charcoal border border-luxury-border font-bold rounded-xl text-xs hover:bg-luxury-ivory transition-all shadow-sm min-h-[44px]"
            >
              Create Next Bill
            </button>
          </div>
        </div>

        {/* Printable A4 Container */}
        <div className="bg-white border border-luxury-border p-6 sm:p-8 rounded-2xl shadow-card space-y-6 text-xs text-luxury-charcoal print-container">
          <div className="flex justify-between items-start border-b border-luxury-border pb-6">
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-wider text-luxury-charcoal">SHANKER JEWELLS</h1>
              <p className="text-[11px] text-luxury-gray">No. 4, Sandhukadai, Big Bazzar Street, Trichy - 620008</p>
              <p className="text-[11px] text-luxury-gray">Phone: +91 944394912</p>
              <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Wholesale B2B Billing Invoice (24K Gold Equivalent)
              </span>
            </div>
            <div className="text-right space-y-1">
              <div className="text-base font-serif font-bold text-luxury-gold">INVOICE #{createdInvoice.invoiceNumber}</div>
              <div className="text-luxury-gray">Date: {new Date(createdInvoice.invoiceDate || Date.now()).toLocaleDateString('en-IN')}</div>
              <div className="text-luxury-gray">24K Rate: <strong className="font-mono text-luxury-charcoal">{formatCurrency(createdInvoice.rate24K || activeRate24K)}/g</strong></div>
            </div>
          </div>

          {/* Customer & Credit Summary */}
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
              <span className="text-[10px] uppercase font-bold text-luxury-gray tracking-wider">24K Gold Credit Accounting</span>
              <div>Invoice Gold Eq: <span className="font-mono font-bold text-luxury-gold">{formatGoldGrams(createdInvoice.goldEquivalentGrams)} 24K</span></div>
              <div>Payment Status: <span className="font-bold uppercase text-emerald-700">{createdInvoice.paymentStatus}</span></div>
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
                    {item.product?.name || item.description || 'Jewellery Item'}
                    <span className="block text-[10px] text-luxury-gray font-mono">{item.sku}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono">{item.quantity}</td>
                  <td className="py-2.5 px-2 text-right font-mono">{item.grossWeight}g</td>
                  <td className="py-2.5 px-2 text-right font-mono">{item.netWeight}g</td>
                  <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.total / item.quantity)}</td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold">{formatCurrency(item.total)}</td>
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

              {createdInvoice.discount > 0 && (
                <div className="flex justify-between text-luxury-gray">
                  <span>Discount:</span>
                  <span className="font-mono font-bold text-rose-600">-{formatCurrency(createdInvoice.discount)}</span>
                </div>
              )}

              <div className="flex justify-between font-serif text-sm font-bold text-luxury-charcoal pt-2 border-t border-luxury-border">
                <span>Grand Total:</span>
                <span className="font-mono text-luxury-gold">{formatCurrency(createdInvoice.grandTotal)}</span>
              </div>

              <div className="flex justify-between text-amber-900 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 font-bold">
                <span>24K Gold Equivalent:</span>
                <span className="font-mono">{formatGoldGrams(createdInvoice.goldEquivalentGrams)} 24K</span>
              </div>
            </div>
          </div>

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-luxury-ivory min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-border pb-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl text-luxury-charcoal font-bold flex items-center gap-3">
            <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-luxury-gold" />
            Wholesale B2B Billing & Gold-Credit Workspace
          </h1>
          <p className="text-xs text-luxury-gray mt-1">
            24K Gold-Equivalent Credit Sales • Benchmark 24K Rate: <strong className="text-luxury-gold font-mono">{formatCurrency(activeRate24K)}/g</strong>
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          {error}
        </div>
      )}

      {/* Selected Customer Gold Credit Banner (Part 24) */}
      {selectedCustomer && (
        <div className="bg-luxury-charcoal text-luxury-ivory p-4 sm:p-6 rounded-2xl border border-luxury-gold/40 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-luxury-gold/30 pb-4">
            <div className="flex items-center gap-3">
              {selectedCustomer.photoUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewPhotoModal({
                      isOpen: true,
                      photoUrl: selectedCustomer.photoUrl,
                      businessName: selectedCustomer.businessName,
                      contactPerson: selectedCustomer.contactPerson,
                      mobile: selectedCustomer.mobile,
                    })
                  }
                  className="w-12 h-12 rounded-full border-2 border-luxury-gold overflow-hidden shrink-0 cursor-pointer"
                >
                  <img src={selectedCustomer.photoUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ) : (
                <div className="w-12 h-12 rounded-full bg-luxury-gold/20 border border-luxury-gold text-luxury-gold font-serif font-bold text-lg flex items-center justify-center shrink-0">
                  {selectedCustomer.businessName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-[10px] text-luxury-gold font-bold uppercase tracking-widest block">WHOLESALE CUSTOMER ACCOUNT</span>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-white">{selectedCustomer.businessName}</h2>
                <p className="text-xs text-luxury-ivory/70">{selectedCustomer.contactPerson ? `${selectedCustomer.contactPerson} • ` : ''}{selectedCustomer.mobile}</p>
              </div>
            </div>

            <span className="text-xs font-mono bg-luxury-gold/20 text-luxury-gold px-3 py-1 rounded-full border border-luxury-gold/40">
              Terms: {selectedCustomer.paymentTerms} ({selectedCustomer.dueDays} Days)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-luxury-gold font-bold uppercase block">APPROVED CREDIT</span>
              <strong className="font-mono text-white text-sm block">{formatGoldGrams(customerLimitGrams)} 24K</strong>
              <span className="text-[10px] text-luxury-ivory/60 block">Valuation: {formatCurrency(customerLimitGrams * activeRate24K)}</span>
            </div>

            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">OUTSTANDING DUES</span>
              <strong className="font-mono text-amber-300 text-sm block">{formatGoldGrams(customerOutstandingGrams)} 24K</strong>
              <span className="text-[10px] text-luxury-ivory/60 block">Valuation: {formatCurrency(customerOutstandingGrams * activeRate24K)}</span>
            </div>

            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">AVAILABLE CREDIT</span>
              <strong className={`font-mono text-sm block ${customerAvailableGrams > 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                {formatGoldGrams(customerAvailableGrams)} 24K
              </strong>
              <span className="text-[10px] text-luxury-ivory/60 block">Valuation: {formatCurrency(customerAvailableGrams * activeRate24K)}</span>
            </div>

            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-luxury-gold font-bold uppercase block">CURRENT VALUE</span>
              <strong className="font-serif text-lg text-luxury-gold block">{formatCurrency(customerOutstandingGrams * activeRate24K)}</strong>
              <span className="text-[10px] text-luxury-ivory/60 block">@ {formatCurrency(activeRate24K)}/g 24K Rate</span>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Retailer Selection & Inventory Search (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-luxury-gold" /> 1. Select Wholesale Retailer Account
              </span>
            </h3>

            <div>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-white border border-luxury-border rounded-xl px-4 py-3 text-luxury-charcoal font-medium focus:outline-none focus:border-luxury-gold shadow-sm text-xs"
              >
                <option value="">-- Select Wholesale Retailer Business --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} ({c.mobile}) - Outstanding: {formatGoldGrams(c.outstandingGoldGrams)} 24K
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Manual Selection Grid */}
          <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-luxury-gold" /> 2. Product Search & Quick Add
              </h3>
              <div className="flex gap-1 text-[11px]">
                {(['ALL', 'GOLD', 'SILVER'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold uppercase transition-all min-h-[44px] ${
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

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-luxury-gray" />
                <input
                  type="text"
                  placeholder="Search by SKU, product name..."
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
                <option value="SILVER_999">999 Silver</option>
              </select>
            </div>

            {/* Product Grid */}
            <div className="max-h-[420px] overflow-y-auto pr-1 space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-10 text-luxury-gray text-xs">
                  No inventory products found matching filter.
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
                            Net Wt: <span className="font-semibold text-luxury-charcoal">{prod.netWeight}g</span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="font-bold font-mono text-xs text-luxury-charcoal">
                              {formatCurrency(price)}
                            </span>
                            <button
                              onClick={() => addProductToBill(prod)}
                              className="px-2.5 py-1 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all flex items-center gap-1 min-h-[44px]"
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
                <FileSpreadsheet className="w-4 h-4 text-luxury-gold" /> Invoice Valuation & Gold-Eq Summary
              </span>
              <span className="text-xs text-luxury-gray font-mono">{billItems.length} Items</span>
            </h3>

            {/* Selected Customer Status Banner */}
            {selectedCustomer ? (
              <div className="p-3 bg-luxury-ivory/80 rounded-xl border border-luxury-border flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-luxury-charcoal">{selectedCustomer.businessName}</div>
                  <div className="text-[10px] text-luxury-gray">Available: {formatGoldGrams(customerAvailableGrams)} 24K</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-luxury-gray font-bold uppercase">Current Outstanding</div>
                  <div className="font-mono font-bold text-amber-700">{formatGoldGrams(customerOutstandingGrams)} 24K</div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                Select a wholesale retailer account to calculate credit line limits.
              </div>
            )}

            {/* Selected Items */}
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
              {billItems.length === 0 ? (
                <div className="text-center py-6 text-luxury-gray text-xs">
                  No items added to invoice yet. Click "+ Add" on inventory products.
                </div>
              ) : (
                billItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-luxury-ivory/40 rounded-xl border border-luxury-border space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-luxury-charcoal">{item.product.name}</div>
                        <div className="text-[10px] text-luxury-gray font-mono">SKU: {item.product.sku}</div>
                      </div>
                      <button onClick={() => removeBillItem(idx)} className="text-rose-500 hover:text-rose-700 p-1">
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
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItemUnitPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-luxury-border rounded-md px-2 py-1 font-mono text-xs font-bold text-luxury-charcoal"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Financial Breakdown & Gold Equivalent Details (Part 24) */}
            <div className="border-t border-luxury-border pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-luxury-gray">
                <span>Subtotal Amount:</span>
                <span className="font-mono font-bold text-luxury-charcoal">{formatCurrency(rawSubtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-luxury-gray">
                <span>Wholesale Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-28 text-right bg-white border border-luxury-border rounded-lg px-2 py-1 font-mono text-xs font-bold text-luxury-charcoal"
                />
              </div>

              {/* GST Toggle */}
              <div className="flex justify-between items-center bg-luxury-ivory/60 p-2.5 rounded-xl border border-luxury-border">
                <span className="font-bold text-luxury-charcoal text-xs">GST Tax (Optional):</span>
                <button
                  type="button"
                  onClick={() => setGstEnabled(!gstEnabled)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    gstEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {gstEnabled ? `GST ON (${gstRate}%)` : 'GST OFF (No Tax)'}
                </button>
              </div>

              <div className="flex justify-between font-bold text-sm pt-2 border-t text-luxury-charcoal items-center">
                <span>INVOICE GRAND TOTAL:</span>
                <span className="font-serif text-xl text-luxury-gold">{formatCurrency(grandTotal)}</span>
              </div>

              {/* GOLD EQUIVALENT CALLOUT (Part 24) */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1 text-amber-900">
                <div className="flex justify-between items-center font-bold">
                  <span>24K GOLD RATE:</span>
                  <span className="font-mono">{formatCurrency(activeRate24K)}/g</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-amber-200/80">
                  <span>GOLD EQUIVALENT:</span>
                  <span className="font-serif text-lg text-luxury-gold font-mono">{formatGoldGrams(invoiceGoldEqGrams)} 24K</span>
                </div>
                {selectedCustomer && (
                  <div className="flex justify-between text-[11px] pt-1 text-amber-800">
                    <span>Credit After Invoice:</span>
                    <strong className="font-mono">{formatGoldGrams(projectedOutstandingGrams)} 24K</strong>
                  </div>
                )}
              </div>

              {/* Upfront Cash Payment */}
              <div className="space-y-1.5 pt-2">
                <label className="font-bold block text-luxury-charcoal text-[11px]">Upfront Cash / Token Paid (₹):</label>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  value={immediatePayment}
                  onChange={(e) => setImmediatePayment(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2 font-mono text-xs font-bold text-luxury-charcoal"
                />
              </div>
            </div>

            {/* Credit Exceeded Warning Banner */}
            {isCreditExceeded && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl space-y-2 text-xs">
                <div className="font-bold flex items-center gap-1.5 text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  24K GOLD CREDIT LIMIT EXCEEDED!
                </div>
                <p className="text-[11px] leading-tight">
                  Bill requires <strong>{formatGoldGrams(netCreditRequiredGoldGrams)} 24K</strong> credit. Total projected outstanding of <strong>{formatGoldGrams(projectedOutstandingGrams)} 24K</strong> exceeds approved limit of <strong>{formatGoldGrams(customerLimitGrams)} 24K</strong>.
                </p>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              onClick={() => handleCheckout(false)}
              disabled={loading || billItems.length === 0 || !selectedCustomer}
              className="w-full py-4 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury disabled:opacity-50 min-h-[48px]"
            >
              <Printer className="w-4 h-4" /> {loading ? 'Creating Invoice...' : 'Finalize Wholesale Invoice'}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Photo Lightbox */}
      <CustomerPhotoPreview
        isOpen={previewPhotoModal.isOpen}
        onClose={() => setPreviewPhotoModal({ isOpen: false })}
        photoUrl={previewPhotoModal.photoUrl}
        businessName={previewPhotoModal.businessName}
        contactPerson={previewPhotoModal.contactPerson}
        mobile={previewPhotoModal.mobile}
      />

      {/* Credit Limit Override Authorization Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-luxury-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-300 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs animate-slide-up">
            <div className="flex justify-between items-center border-b border-luxury-border pb-3">
              <h3 className="font-serif text-lg font-bold text-rose-700 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-600" /> Manager Credit Override
              </h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-luxury-gray hover:text-luxury-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
              <p className="font-bold">Gold Credit Limit Exceeded!</p>
              <p className="text-[11px]">
                Approved Limit: <strong>{formatGoldGrams(customerLimitGrams)} 24K</strong>
              </p>
              <p className="text-[11px]">
                Projected Dues: <strong>{formatGoldGrams(projectedOutstandingGrams)} 24K</strong>
              </p>
            </div>

            <div>
              <label className="block text-luxury-charcoal font-bold mb-1">Reason for Manager Credit Override *</label>
              <input
                type="text"
                required
                placeholder="e.g. Approved by Director for Diwali Bulk Procurement"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 text-luxury-charcoal focus:outline-none focus:border-luxury-gold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 rounded-xl border border-luxury-border text-luxury-charcoal font-bold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCheckout(true)}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl shadow-md min-h-[44px]"
              >
                Authorize & Issue Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWholesaleBillingPage;
