import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Search, Heart, ShoppingBag, User as UserIcon, Menu, X, Sparkles, Gem } from 'lucide-react';
import { AnnouncementBar } from './AnnouncementBar';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-luxury-charcoal hover:text-luxury-gold transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-luxury-gold/50 flex items-center justify-center bg-luxury-charcoal text-luxury-gold group-hover:scale-105 transition-transform">
            <Gem className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-luxury-charcoal uppercase leading-none">
              SHANKER JEWELLS
            </span>
            <span className="text-[9px] tracking-[0.25em] text-luxury-gold uppercase font-medium mt-0.5">
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
          <Link to="/shop?collection=royal-heritage-bridal" className="hover:text-luxury-gold transition-colors">
            Bridal
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
        <div className="flex items-center gap-3 sm:gap-4">
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

          <Link to="/account/wishlist" className="p-2 text-luxury-charcoal hover:text-luxury-gold relative">
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-luxury-gold text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link
            to={user ? (user.role === 'CUSTOMER' ? '/account' : '/admin') : '/admin/login'}
            className="p-2 text-luxury-charcoal hover:text-luxury-gold transition-colors"
            title={user ? `${user.name} (${user.role})` : 'Account Login'}
          >
            <UserIcon className="w-5 h-5" />
          </Link>

          <button
            onClick={openCart}
            className="p-2 text-luxury-charcoal hover:text-luxury-gold relative transition-colors"
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
    </header>
  );
};
