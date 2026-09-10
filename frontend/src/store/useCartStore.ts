import { create } from 'zustand';
import { Product, CartItem } from '../types';

interface CartState {
  items: CartItem[];
  wishlist: Product[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: JSON.parse(localStorage.getItem('cart_items') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('wishlist_items') || '[]'),
  isOpen: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  addItem: (product, quantity = 1) => {
    const current = get().items;
    const existingIndex = current.findIndex((i) => i.product.id === product.id);
    let updated: CartItem[];

    if (existingIndex > -1) {
      updated = [...current];
      updated[existingIndex].quantity += quantity;
    } else {
      updated = [...current, { product, quantity }];
    }

    localStorage.setItem('cart_items', JSON.stringify(updated));
    set({ items: updated, isOpen: true });
  },
  removeItem: (productId) => {
    const updated = get().items.filter((i) => i.product.id !== productId);
    localStorage.setItem('cart_items', JSON.stringify(updated));
    set({ items: updated });
  },
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const updated = get().items.map((i) =>
      i.product.id === productId ? { ...i, quantity } : i
    );
    localStorage.setItem('cart_items', JSON.stringify(updated));
    set({ items: updated });
  },
  clearCart: () => {
    localStorage.removeItem('cart_items');
    set({ items: [] });
  },
  toggleWishlist: (product) => {
    const current = get().wishlist;
    const exists = current.some((p) => p.id === product.id);
    const updated = exists
      ? current.filter((p) => p.id !== product.id)
      : [...current, product];

    localStorage.setItem('wishlist_items', JSON.stringify(updated));
    set({ wishlist: updated });
  },
  isInWishlist: (productId) => get().wishlist.some((p) => p.id === productId),
}));

