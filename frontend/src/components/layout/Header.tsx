import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Search, Heart, ShoppingBag, User as UserIcon, Menu, X, Sparkles, Gem } from 'lucide-react';
import { AnnouncementBar } from './AnnouncementBar';
import { MobileSearchModal } from '../common/MobileSearchModal';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { items, openCart, wishlist } = useCartStore();
  const { user } = useAuthStore();

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-luxury-ivory/95 backdrop-blur-md border-b border-luxury-gold/15 transition-all">
      <AnnouncementBar />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-luxury-charcoal hover:text-luxury-gold transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-luxury-gold/50 flex items-center justify-center bg-luxury-charcoal text-luxury-gold group-hover:scale-105 transition-transform">
            <Gem className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-base sm:text-2xl font-bold tracking-widest text-luxury-charcoal uppercase leading-none">
              SHANKER JEWELLS
            </span>
            <span className="text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.25em] text-luxury-gold uppercase font-medium mt-0.5">
              TRICHY • SINCE 2000
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium tracking-wide">
          <Link to="/" className="hover:text-luxury-gold transition-colors">
            Home
          </Link>
          <Link to="/shop" className="hover:text-luxury-gold transition-colors">
            Catalogue
          </Link>
          <Link to="/shop?category=gold-jewellery" className="hover:text-luxury-gold transition-colors">
            Gold
          </Link>
          <Link to="/shop?category=silver-jewellery" className="hover:text-luxury-gold transition-colors">
            Silver
          </Link>
          <Link to="/gold-silver-rate" className="hover:text-luxury-gold transition-colors">
            Live Rates
          </Link>
          <Link to="/gold-calculator" className="hover:text-luxury-gold transition-colors">
            Calculator
          </Link>

          {/* Prominent Custom Jewellery CTA */}
          <Link
            to="/custom-jewellery"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-luxury-gold text-white hover:bg-luxury-gold-dark transition-all shadow-sm font-semibold text-xs tracking-wider uppercase"
          >
            <Sparkles className="w-3.5 h-3.5 animate-bounce" /> Custom Design
          </Link>
        </nav>

        {/* Right Header Action Icons */}
        <div className="flex items-center gap-1 sm:gap-4">
          {/* Mobile Search Button */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="sm:hidden p-2 text-luxury-charcoal hover:text-luxury-gold min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Mobile Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Desktop Search Form */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative">
            <input
              type="text"
              placeholder="Search necklace, ring, 22K..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 md:w-52 text-xs py-1.5 pl-3 pr-8 rounded-full border border-luxury-border bg-white/80 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold"
            />
            <button type="submit" className="absolute right-2.5 text-luxury-gray hover:text-luxury-gold">
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          <Link to="/account/wishlist" className="p-2 text-luxury-charcoal hover:text-luxury-gold relative min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-luxury-gold text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link
            to={user ? (user.role === 'CUSTOMER' ? '/account' : '/admin') : '/admin/login'}
            className="p-2 text-luxury-charcoal hover:text-luxury-gold transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={user ? `${user.name} (${user.role})` : 'Account Login'}
          >
            <UserIcon className="w-5 h-5" />
          </Link>

          <button
            onClick={openCart}
            className="p-2 text-luxury-charcoal hover:text-luxury-gold relative transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-luxury-gold text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-luxury-charcoal text-luxury-ivory p-5 space-y-4 border-t border-luxury-gold/30 animate-in fade-in duration-200">
          <nav className="flex flex-col space-y-3 font-medium text-sm">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-luxury-gold/15 hover:text-luxury-gold font-bold"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-luxury-gold/15 hover:text-luxury-gold"
            >
              All Jewellery Catalogue
            </Link>
            <Link
              to="/shop?category=gold-jewellery"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-luxury-gold/15 hover:text-luxury-gold"
            >
              Gold Jewellery Collection
            </Link>
            <Link
              to="/shop?category=silver-jewellery"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-luxury-gold/15 hover:text-luxury-gold"
            >
              Silver Ornaments Collection
            </Link>
            <Link
              to="/gold-silver-rate"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-luxury-gold/15 hover:text-luxury-gold"
            >
              Live Bullion Rates Today
            </Link>
            <Link
              to="/gold-calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-luxury-gold/15 hover:text-luxury-gold"
            >
              Gold Price Calculator
            </Link>
            <Link
              to="/custom-jewellery"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 rounded-xl bg-luxury-gold text-white font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> Custom Design Studio
            </Link>
          </nav>
        </div>
      )}

      {/* Mobile Search Modal */}
      <MobileSearchModal isOpen={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />
    </header>
  );
};
