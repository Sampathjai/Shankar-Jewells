import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { fetchApi } from '../../api/client';
import { SmartImage } from '../../components/common/SmartImage';
import {
  Search,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  User,
  CreditCard,
  ShieldCheck,
  Package,
  Sparkles,
  Calculator,
  X,
  FileText,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface BillItem {
  id: string;
  product?: Product;
  isCustom?: boolean;
  name: string;
  sku: string;
  metalType: string;
  purity: string;
  grossWeight: number;
  netWeight: number;
  ratePerGram: number;
  makingChargeType: string;
  makingChargeValue: number;
  wastagePercent: number;
  stoneCharge: number;
  otherCharges: number;
  discount: number;
  quantity: number;
  gstRate: number;
  lineTotal: number;
}

export const AdminPOSBillingPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedMetalFilter, setSelectedMetalFilter] = useState('ALL');

  // Customer Management
  const [customerSearch, setCustomerSearch] = useState('');
  const [foundCustomers, setFoundCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: 'Walk-in Customer',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  // Custom Item State
  const [customItem, setCustomItem] = useState({
    name: 'Custom Crafted Jewellery',
    metalType: 'GOLD',
    purity: 'K22',
    grossWeight: 10,
    netWeight: 10,
    ratePerGram: 14145,
    makingChargeType: 'PER_GRAM',
    makingChargeValue: 400,
    wastagePercent: 3.5,
    stoneCharge: 0,
    otherCharges: 0,
    discount: 0,
    quantity: 1,
    gstRate: 3.0,
  });

  // Payment & Finalize
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  async function loadCatalog() {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetchApi<{ data: Product[] }>('/products'),
        fetchApi<{ data: any[] }>('/categories'),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Failed to load catalogue:', err);
    } finally {
      setLoading(false);
    }
  }

  // Customer Live Search
  useEffect(() => {
    if (!customerSearch.trim() || customerSearch.length < 3) {
      setFoundCustomers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetchApi<{ data: any[] }>(`/billing/customers/search?q=${encodeURIComponent(customerSearch.trim())}`);
        setFoundCustomers(res.data || []);
      } catch (err) {
        console.error('Customer search failed:', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const addProductToBill = (p: Product) => {
    const existingIndex = billItems.findIndex((item) => item.product?.id === p.id);
    if (existingIndex > -1) {
      const copy = [...billItems];
      if (copy[existingIndex].quantity < p.stockQuantity) {
        copy[existingIndex].quantity += 1;
        recalculateLineItem(copy[existingIndex]);
        setBillItems(copy);
      } else {
        alert(`Cannot add more than available stock (${p.stockQuantity}) for ${p.name}`);
      }
    } else {
      const rate = p.calculatedPricing?.metalRate || 14145;
      const newItem: BillItem = {
        id: `bill-${p.id}-${Date.now()}`,
        product: p,
        isCustom: false,
        name: p.name,
        sku: p.sku,
        metalType: p.metalType,
        purity: p.purity,
        grossWeight: p.grossWeight,
        netWeight: p.netWeight,
        ratePerGram: rate,
        makingChargeType: p.makingChargeType,
        makingChargeValue: p.makingChargeValue,
        wastagePercent: p.wastageValue,
        stoneCharge: p.stoneCharge,
        otherCharges: p.otherCharges,
        discount: 0,
        quantity: 1,
        gstRate: p.gstRate || 3.0,
        lineTotal: p.displayPrice || p.sellingPrice,
      };
      recalculateLineItem(newItem);
      setBillItems([...billItems, newItem]);
    }
    setIsSearchOpen(false);
  };

  const addCustomItemToBill = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = customItem.ratePerGram || (customItem.metalType === 'SILVER' ? 255 : 14145);
    const newItem: BillItem = {
      id: `custom-${Date.now()}`,
      isCustom: true,
      name: customItem.name,
      sku: `CUST-${Date.now().toString().slice(-4)}`,
      metalType: customItem.metalType,
      purity: customItem.purity,
      grossWeight: Number(customItem.grossWeight) || 0,
      netWeight: Number(customItem.netWeight) || 0,
      ratePerGram: rate,
      makingChargeType: customItem.makingChargeType,
      makingChargeValue: Number(customItem.makingChargeValue) || 0,
      wastagePercent: Number(customItem.wastagePercent) || 0,
      stoneCharge: Number(customItem.stoneCharge) || 0,
      otherCharges: Number(customItem.otherCharges) || 0,
      discount: Number(customItem.discount) || 0,
      quantity: Number(customItem.quantity) || 1,
      gstRate: Number(customItem.gstRate) || 3.0,
      lineTotal: 0,
    };
    recalculateLineItem(newItem);
    setBillItems([...billItems, newItem]);
    setIsCustomOpen(false);
  };

  const recalculateLineItem = (item: BillItem) => {
    const rawMetalValue = item.netWeight * item.ratePerGram;
    const wastageGrams = item.netWeight * (item.wastagePercent / 100);
    const baseMetalCost = (item.netWeight + wastageGrams) * item.ratePerGram;

    let making = 0;
    if (item.makingChargeType === 'FIXED') {
      making = item.makingChargeValue;
    } else if (item.makingChargeType === 'PER_GRAM') {
      making = item.netWeight * item.makingChargeValue;
    } else {
      making = baseMetalCost * (item.makingChargeValue / 100);
    }

    const subtotal = baseMetalCost + making + item.stoneCharge + item.otherCharges;
    const taxable = Math.max(0, subtotal - item.discount);
    const gst = taxable * (item.gstRate / 100);
    item.lineTotal = Math.round((taxable + gst) * item.quantity);
  };

  const updateItemQty = (index: number, delta: number) => {
    const copy = [...billItems];
    const item = copy[index];
    const maxQty = item.product ? item.product.stockQuantity : 999;
    const newQty = item.quantity + delta;

    if (newQty > 0 && newQty <= maxQty) {
      item.quantity = newQty;
      recalculateLineItem(item);
      setBillItems(copy);
    } else if (newQty > maxQty) {
      alert(`Max available stock is ${maxQty}`);
    }
  };

  const updateItemDiscount = (index: number, discountVal: number) => {
    const copy = [...billItems];
    copy[index].discount = Math.max(0, discountVal);
    recalculateLineItem(copy[index]);
    setBillItems(copy);
  };

  const removeBillItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  // Calculations Summary
  const billSummary = billItems.reduce(
    (acc, item) => {
      const rawMetal = item.netWeight * item.ratePerGram * item.quantity;
      const wastageGrams = item.netWeight * (item.wastagePercent / 100) * item.quantity;
      const wastageVal = wastageGrams * item.ratePerGram;
      const baseMetal = rawMetal + wastageVal;

      let making = 0;
      if (item.makingChargeType === 'FIXED') making = item.makingChargeValue * item.quantity;
      else if (item.makingChargeType === 'PER_GRAM') making = item.netWeight * item.makingChargeValue * item.quantity;
      else making = baseMetal * (item.makingChargeValue / 100);

      const stone = item.stoneCharge * item.quantity;
      const other = item.otherCharges * item.quantity;
      const discount = item.discount * item.quantity;

      const subtotal = baseMetal + making + stone + other;
      const taxable = Math.max(0, subtotal - discount);
      const gst = taxable * (item.gstRate / 100);

      acc.metalValue += rawMetal;
      acc.wastageValue += wastageVal;
      acc.makingCharges += making;
      acc.stoneCharges += stone;
      acc.otherCharges += other;
      acc.discount += discount;
      acc.subtotal += subtotal;
      acc.taxableAmount += taxable;
      acc.gstAmount += gst;
      acc.grandTotal += taxable + gst;
      return acc;
    },
    {
      metalValue: 0,
      wastageValue: 0,
      makingCharges: 0,
      stoneCharges: 0,
      otherCharges: 0,
      discount: 0,
      subtotal: 0,
      taxableAmount: 0,
      gstAmount: 0,
      grandTotal: 0,
    }
  );

  const handleFinalizeBill = async () => {
    if (billItems.length === 0) {
      alert('Please add at least one product to the bill.');
      return;
    }
    if (!customerForm.phone || customerForm.phone.length < 10) {
      alert('Please enter a valid 10-digit mobile number for customer invoice records.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerId: selectedCustomer?.id || undefined,
        customerName: customerForm.name || 'Walk-in Customer',
        customerPhone: customerForm.phone,
        customerEmail: customerForm.email,
        customerAddress: customerForm.address,
        customerGstin: customerForm.gstin,
        items: billItems.map((i) => ({
          productId: i.product ? i.product.id : products[0]?.id,
          quantity: i.quantity,
          customDiscount: i.discount,
          customMakingOverride: i.makingChargeValue,
        })),
        paymentMethod,
        notes,
      };

      const res = await fetchApi<{ success: boolean; message: string; data: any }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setLastInvoice(res.data.invoice);
      setBillItems([]);
      setIsPrintModalOpen(true);
    } catch (err: any) {
      console.error('Checkout failed:', err);
      alert(err.message || 'Billing error occurred. Please verify stock & customer details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered catalogue products for modal
  const filteredProducts = products.filter((p) => {
    if (!p.active) return false;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.metalType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.purity.toLowerCase().includes(searchQuery.toLowerCase());

    const matchMetal = selectedMetalFilter === 'ALL' || p.metalType === selectedMetalFilter;
    const matchCat = selectedCategoryFilter === 'ALL' || p.category?.slug === selectedCategoryFilter;
    return matchSearch && matchMetal && matchCat;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 select-none">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-luxury-border pb-4">
        <div>
          <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-luxury-gold" /> Shanker Jewells • Billing & POS Atelier
          </span>
          <h1 className="font-serif text-3xl font-bold text-luxury-charcoal mt-0.5">
            Jewellery Billing & Invoice Desk
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCustomOpen(true)}
            className="px-4 py-2.5 rounded-full border border-luxury-gold text-luxury-gold font-semibold text-xs uppercase hover:bg-luxury-gold hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Custom Item
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-5 py-2.5 rounded-full bg-luxury-gold text-white font-semibold text-xs uppercase hover:bg-luxury-gold-dark transition-all flex items-center gap-1.5 shadow-luxury"
          >
            <Search className="w-4 h-4" /> Browse & Add Product
          </button>
        </div>
      </div>

      {/* Category Quick Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card space-y-2">
        <span className="text-[10px] font-bold text-luxury-gold uppercase tracking-widest block">
          Quick Category Selection (Click to Search & Add):
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { label: 'ALL PRODUCTS', metal: 'ALL', cat: 'ALL' },
            { label: 'GOLD JEWELLERY', metal: 'GOLD', cat: 'ALL' },
            { label: 'SILVER ORNAMENTS', metal: 'SILVER', cat: 'ALL' },
            { label: 'NECKLACES', metal: 'GOLD', cat: 'gold-jewellery' },
            { label: 'RINGS', metal: 'GOLD', cat: 'gold-jewellery' },
            { label: 'EARRINGS & JHUMKA', metal: 'GOLD', cat: 'gold-jewellery' },
            { label: 'SILVER PAYAL', metal: 'SILVER', cat: 'silver-jewellery' },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedMetalFilter(btn.metal);
                setSelectedCategoryFilter(btn.cat);
                setIsSearchOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-luxury-beige/60 hover:bg-luxury-gold hover:text-white text-luxury-charcoal font-semibold text-xs transition-all border border-luxury-gold/20 shrink-0"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Items Table / Right Customer & Finalize */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Bill Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-luxury-border shadow-card overflow-hidden">
            <div className="p-4 bg-luxury-beige/30 border-b border-luxury-border flex justify-between items-center">
              <h3 className="font-serif text-base font-bold text-luxury-charcoal flex items-center gap-2">
                <Package className="w-4 h-4 text-luxury-gold" /> Selected Jewellery Items ({billItems.length})
              </h3>
              {billItems.length > 0 && (
                <button
                  onClick={() => setBillItems([])}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  Clear All Items
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-luxury-border text-luxury-gold font-semibold uppercase tracking-wider bg-white">
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Net Wt</th>
                    <th className="py-3 px-4">Rate/g</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4">Discount (₹)</th>
                    <th className="py-3 px-4">Line Total</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-border/50 text-luxury-charcoal">
                  {billItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-luxury-gray space-y-3">
                        <Package className="w-12 h-12 text-luxury-gold/40 mx-auto" />
                        <p className="font-serif text-lg font-bold text-luxury-charcoal">No items added to current bill</p>
                        <p className="text-xs max-w-sm mx-auto">
                          Click <strong>Browse & Add Product</strong> or <strong>Add Custom Item</strong> above to populate the bill.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    billItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-luxury-beige/10 transition-colors">
                        <td className="py-3.5 px-4">
                          <strong className="text-luxury-charcoal block">{item.name}</strong>
                          <span className="text-[10px] text-luxury-gold font-mono uppercase font-semibold">
                            {item.sku} • {item.purity} {item.metalType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold">{item.netWeight}g</td>
                        <td className="py-3.5 px-4 font-mono">₹{item.ratePerGram.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center border border-luxury-border rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateItemQty(idx, -1)}
                              className="px-2 py-1 bg-luxury-beige/50 hover:bg-luxury-gold hover:text-white transition-colors"
                            >
                              -
                            </button>
                            <span className="px-3 font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateItemQty(idx, 1)}
                              className="px-2 py-1 bg-luxury-beige/50 hover:bg-luxury-gold hover:text-white transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) => updateItemDiscount(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 py-1 px-2 border rounded-md text-xs font-semibold focus:outline-none focus:border-luxury-gold"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-serif text-sm font-bold text-luxury-gold">
                          ₹{item.lineTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => removeBillItem(idx)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Final Valuation Summary */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-luxury-border shadow-card space-y-4 text-xs">
            <h3 className="font-serif text-lg font-bold text-luxury-charcoal border-b pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-luxury-gold" /> Customer Profile
              </span>
              {selectedCustomer && (
                <span className="text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded font-bold uppercase">
                  Existing Customer
                </span>
              )}
            </h3>

            {/* Customer Search Auto-complete */}
            <div className="relative">
              <label className="font-semibold block mb-1 text-luxury-gray">Search Existing Customer (Phone/Name)</label>
              <input
                type="text"
                placeholder="Type phone or name..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-luxury-border text-xs focus:ring-1 focus:ring-luxury-gold focus:outline-none"
              />
              {foundCustomers.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-luxury-border rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y">
                  {foundCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerForm({
                          name: c.name,
                          phone: c.phone,
                          email: c.email || '',
                          address: c.address || '',
                          gstin: c.gstin || '',
                        });
                        setCustomerSearch('');
                        setFoundCustomers([]);
                      }}
                      className="w-full p-2.5 text-left hover:bg-luxury-beige/50 transition-colors flex justify-between items-center text-xs"
                    >
                      <div>
                        <strong className="block text-luxury-charcoal">{c.name}</strong>
                        <span className="text-[10px] text-luxury-gray">{c.phone}</span>
                      </div>
                      <span className="text-[10px] text-luxury-gold font-bold">{c.totalOrders} Orders</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="font-semibold block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Walk-in Customer"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-luxury-border focus:ring-1 focus:ring-luxury-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-luxury-border focus:ring-1 focus:ring-luxury-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-luxury-border bg-white font-semibold focus:ring-1 focus:ring-luxury-gold focus:outline-none"
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="UPI">UPI / QR Code Scan</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="CREDIT">Store Credit / Due Account</option>
                </select>
              </div>
            </div>

            {/* Bill Breakdown Summary */}
            <div className="border-t border-luxury-border pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-luxury-gray">
                <span>Metal Subtotal:</span>
                <span>₹{Math.round(billSummary.metalValue).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>Wastage Allowance:</span>
                <span>₹{Math.round(billSummary.wastageValue).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-luxury-gray">
                <span>Making Charges:</span>
                <span>₹{Math.round(billSummary.makingCharges).toLocaleString('en-IN')}</span>
              </div>
              {billSummary.stoneCharges > 0 && (
                <div className="flex justify-between text-luxury-gray">
                  <span>Gemstones / Diamonds:</span>
                  <span>₹{Math.round(billSummary.stoneCharges).toLocaleString('en-IN')}</span>
                </div>
              )}
              {billSummary.discount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Total Discount:</span>
                  <span>- ₹{Math.round(billSummary.discount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-luxury-gray border-t pt-2">
                <span>GST (3%):</span>
                <span>₹{Math.round(billSummary.gstAmount).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between font-bold text-sm pt-3 border-t text-luxury-charcoal items-center">
                <span>Grand Total:</span>
                <span className="font-serif text-3xl text-luxury-gold">
                  ₹{Math.round(billSummary.grandTotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinalizeBill}
              disabled={submitting || billItems.length === 0}
              className="w-full py-4 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> {submitting ? 'Finalizing Bill...' : 'Finalize Bill & Generate Invoice'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Selection Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-luxury-gold/30">
            <div className="p-4 border-b border-luxury-border flex justify-between items-center bg-luxury-beige/30">
              <h3 className="font-serif text-lg font-bold text-luxury-charcoal flex items-center gap-2">
                <Search className="w-5 h-5 text-luxury-gold" /> Select Jewellery Product From Inventory
              </h3>
              <button onClick={() => setIsSearchOpen(false)} className="p-1 hover:bg-luxury-beige rounded-lg">
                <X className="w-5 h-5 text-luxury-gray" />
              </button>
            </div>

            <div className="p-4 space-y-3 border-b border-luxury-border">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by product name, SKU, metal or purity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-luxury-border text-xs focus:outline-none focus:border-luxury-gold"
                  autoFocus
                />
                <Search className="w-4 h-4 text-luxury-gray absolute left-3 top-3" />
              </div>

              <div className="flex gap-2 text-xs">
                <select
                  value={selectedMetalFilter}
                  onChange={(e) => setSelectedMetalFilter(e.target.value)}
                  className="py-1.5 px-3 rounded-lg border border-luxury-border bg-white font-semibold"
                >
                  <option value="ALL">All Metals</option>
                  <option value="GOLD">Gold Only</option>
                  <option value="SILVER">Silver Only</option>
                </select>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="py-1.5 px-3 rounded-lg border border-luxury-border bg-white font-semibold"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-luxury-gray text-xs">
                  No matching jewellery items found in inventory.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white rounded-xl border border-luxury-border hover:border-luxury-gold shadow-sm flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <SmartImage
                          src={p.images?.[0]?.url}
                          alt={p.name}
                          className="w-12 h-12 rounded-lg object-cover border border-luxury-border shrink-0"
                        />
                        <div className="text-xs">
                          <strong className="text-luxury-charcoal block line-clamp-1">{p.name}</strong>
                          <span className="text-[10px] text-luxury-gold font-mono uppercase">
                            {p.sku} • {p.purity} {p.metalType} • {p.netWeight}g
                          </span>
                          <span className="block text-[10px] text-luxury-gray mt-0.5">
                            Stock: {p.stockQuantity} units • Est. ₹{(p.displayPrice || p.sellingPrice).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => addProductToBill(p)}
                        className="px-3 py-1.5 rounded-lg bg-luxury-gold text-white font-semibold text-xs uppercase hover:bg-luxury-gold-dark shrink-0 transition-all shadow-sm"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Uncatalogued Item Modal */}
      {isCustomOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={addCustomItemToBill} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-luxury-gold/30 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-serif text-lg font-bold text-luxury-charcoal flex items-center gap-2">
                <Plus className="w-5 h-5 text-luxury-gold" /> Add Custom Billing Item
              </h3>
              <button type="button" onClick={() => setIsCustomOpen(false)} className="p-1 hover:bg-luxury-beige rounded-lg">
                <X className="w-5 h-5 text-luxury-gray" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Item Name / Description *</label>
                <input
                  type="text"
                  required
                  value={customItem.name}
                  onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Metal</label>
                  <select
                    value={customItem.metalType}
                    onChange={(e) => setCustomItem({ ...customItem, metalType: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Purity</label>
                  <select
                    value={customItem.purity}
                    onChange={(e) => setCustomItem({ ...customItem, purity: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    {customItem.metalType === 'GOLD' ? (
                      <>
                        <option value="K22">22K Gold</option>
                        <option value="K18">18K Gold</option>
                        <option value="80">80 Gold</option>
                        <option value="70">70 Gold</option>
                        <option value="K24">24K Pure</option>
                      </>
                    ) : (
                      <>
                        <option value="SILVER_999">999 Silver</option>
                        <option value="SILVER_925">925 Silver</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Net Weight (g) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={customItem.netWeight}
                    onChange={(e) => setCustomItem({ ...customItem, netWeight: parseFloat(e.target.value) || 0, grossWeight: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Rate / Gram (₹)</label>
                  <input
                    type="number"
                    required
                    value={customItem.ratePerGram}
                    onChange={(e) => setCustomItem({ ...customItem, ratePerGram: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Making Charge / g (₹)</label>
                  <input
                    type="number"
                    value={customItem.makingChargeValue}
                    onChange={(e) => setCustomItem({ ...customItem, makingChargeValue: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Wastage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customItem.wastagePercent}
                    onChange={(e) => setCustomItem({ ...customItem, wastagePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Stone / Diamond (₹)</label>
                  <input
                    type="number"
                    value={customItem.stoneCharge}
                    onChange={(e) => setCustomItem({ ...customItem, stoneCharge: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={customItem.quantity}
                    onChange={(e) => setCustomItem({ ...customItem, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all shadow-luxury"
            >
              Add To Current Bill
            </button>
          </form>
        </div>
      )}

      {/* Printable Invoice Modal / Window */}
      {isPrintModalOpen && lastInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 space-y-6 shadow-2xl border border-luxury-gold/30">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="text-xs font-bold text-green-700 uppercase tracking-widest block">
                  ✓ Invoice Created Successfully
                </span>
                <h2 className="font-serif text-2xl font-bold text-luxury-charcoal">
                  Invoice {lastInvoice.invoiceNumber}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-full bg-luxury-gold text-white text-xs font-semibold uppercase flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print A4 Invoice
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 rounded-full border text-xs font-semibold uppercase"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable A4 Document Content */}
            <div className="printable-invoice p-8 border border-luxury-border rounded-xl space-y-6 bg-white">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b border-luxury-charcoal pb-4">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-luxury-charcoal uppercase tracking-wider">
                    SHANKER JEWELLS
                  </h1>
                  <p className="text-[10px] text-luxury-gold font-semibold uppercase tracking-widest">
                    TRICHY • SINCE 2000 • BIS 100% HALLMARKED
                  </p>
                  <p className="text-xs text-luxury-gray mt-1">
                    No.4 sandhukadai, bigbazzar street, trichy - 620008<br />
                    Phone: +91 9443949192 • Email: contact@shankarjewels.com
                  </p>
                </div>
                <div className="text-right text-xs">
                  <h3 className="font-serif text-xl font-bold text-luxury-gold uppercase">TAX INVOICE</h3>
                  <p className="font-mono text-xs font-bold">{lastInvoice.invoiceNumber}</p>
                  <p className="text-luxury-gray">Date: {new Date(lastInvoice.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Customer Section */}
              <div className="text-xs space-y-1 bg-luxury-beige/20 p-3 rounded-lg border border-luxury-border">
                <strong className="block text-luxury-gold uppercase font-bold text-[10px] tracking-wider">
                  Billed To:
                </strong>
                <div className="font-bold text-luxury-charcoal">{lastInvoice.customer?.name || customerForm.name}</div>
                <div>Mobile: {lastInvoice.customer?.phone || customerForm.phone}</div>
                {customerForm.address && <div>Address: {customerForm.address}</div>}
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse border border-luxury-border">
                <thead>
                  <tr className="bg-luxury-beige/50 text-luxury-gold font-bold uppercase text-[10px] tracking-wider border-b border-luxury-border">
                    <th className="p-2 border-r">S.No</th>
                    <th className="p-2 border-r">Item Description</th>
                    <th className="p-2 border-r">SKU</th>
                    <th className="p-2 border-r">Net Wt</th>
                    <th className="p-2 border-r">Rate/g</th>
                    <th className="p-2 border-r text-center">Qty</th>
                    <th className="p-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-border">
                  {lastInvoice.items?.map((item: any, i: number) => (
                    <tr key={item.id}>
                      <td className="p-2 border-r text-center">{i + 1}</td>
                      <td className="p-2 border-r font-semibold">{item.description}</td>
                      <td className="p-2 border-r font-mono">{item.sku}</td>
                      <td className="p-2 border-r">{item.netWeight}g</td>
                      <td className="p-2 border-r">₹{item.metalRate?.toLocaleString('en-IN')}</td>
                      <td className="p-2 border-r text-center">{item.quantity}</td>
                      <td className="p-2 font-bold">₹{item.total?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Summary */}
              <div className="flex justify-between items-end text-xs border-t pt-4">
                <div className="max-w-xs text-[10px] text-luxury-gray space-y-1">
                  <p className="font-semibold uppercase text-luxury-charcoal">Terms & Conditions:</p>
                  <p>1. Certified 100% BIS Hallmarked Gold & Silver.</p>
                  <p>2. Subject to Trichy jurisdiction.</p>
                  <p>3. This is a computer generated tax invoice.</p>
                </div>

                <div className="w-64 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{lastInvoice.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (3%):</span>
                    <span>₹{lastInvoice.tax?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm border-t pt-1 text-luxury-gold">
                    <span>Grand Total:</span>
                    <span>₹{lastInvoice.grandTotal?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
