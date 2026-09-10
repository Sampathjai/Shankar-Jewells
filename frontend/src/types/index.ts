export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'BILLING_STAFF' | 'INVENTORY_STAFF' | 'DESIGNER' | 'CUSTOMER';
export type MetalType = 'GOLD' | 'SILVER' | 'PLATINUM';
export type MetalPurity = 'K24' | 'K22' | 'K18' | 'K14' | 'SILVER_925' | 'SILVER_999';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
}

export interface MetalRate {
  id: string;
  metalType: MetalType;
  purity: MetalPurity;
  ratePerGram: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  source: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  subcategoryId?: string;
  collectionId?: string;
  metalType: MetalType;
  purity: MetalPurity;
  grossWeight: number;
  netWeight: number;
  stoneType?: string;
  stoneWeight?: number;
  diamondWeight?: number;
  diamondQuality?: string;
  pricingMode: 'METAL_RATE_BASED' | 'FIXED_PRICE' | 'STARTING_PRICE';
  sellingPrice: number;
  makingChargeType: 'FIXED' | 'PER_GRAM' | 'PERCENTAGE';
  makingChargeValue: number;
  wastageType: 'FIXED_WEIGHT' | 'PERCENTAGE';
  wastageValue: number;
  stoneCharge: number;
  otherCharges: number;
  gstRate: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  certification?: string;
  hallmark: boolean;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  active?: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  images: ProductImage[];
  calculatedPricing?: {
    metalRate: number;
    rawMetalValue: number;
    wastageGrams: number;
    baseMetalCost: number;
    makingCharges: number;
    stoneCharge: number;
    gstAmount: number;
    finalPrice: number;
  };
  displayPrice?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customMakingOverride?: number;
  customDiscount?: number;
}

export interface CustomRequest {
  id: string;
  requestNumber: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  jewelleryType: string;
  metalType: MetalType;
  purity: MetalPurity;
  approxBudget?: number;
  approxWeight?: number;
  quantity: number;
  occasion?: string;
  notes?: string;
  status: string;
  images: { id: string; url: string }[];
  statusHistory?: { status: string; notes?: string; createdAt: string; changedBy?: string }[];
  createdAt: string;
}

export interface QuotationVersion {
  id: string;
  versionNumber: number;
  metalType: MetalType;
  purity: MetalPurity;
  metalRate: number;
  grossWeight: number;
  netWeight: number;
  wastage: number;
  makingCharges: number;
  stoneCharges: number;
  taxAmount: number;
  totalAmount: number;
  terms?: string;
  notes?: string;
  items?: any[];
  createdAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  secureToken: string;
  status: string;
  validUntil: string;
  customRequest?: CustomRequest;
  latestVersion?: QuotationVersion;
  versions?: QuotationVersion[];
}

