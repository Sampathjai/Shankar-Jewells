import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Layers, Sparkles, Flame, Percent } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { items, openCart } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Hide bottom nav on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    { to: '/shop', label: 'Catalogue', icon: Layers },
    { to: '/shop?category=gold-jewellery', label: 'Gold', icon: Flame, isGold: true },
    { to: '/shop?category=silver-jewellery', label: 'Silver', icon: Percent },
    { to: '/custom-jewellery', label: 'Custom', icon: Sparkles, isSpecial: true },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-luxury-charcoal text-luxury-ivory border-t border-luxury-gold/30 shadow-2xl pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === '/' && !location.search
            : location.pathname + location.search === item.to ||
              (item.to.includes('?') && location.search.includes(item.to.split('?')[1]));

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 transition-all min-h-[48px] ${
                isActive
                  ? 'text-luxury-gold font-bold scale-105'
                  : 'text-luxury-ivory/70 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${
                    item.isSpecial
                      ? 'text-luxury-gold animate-pulse'
                      : isActive
                      ? 'text-luxury-gold'
                      : ''
                  }`}
                />
              </div>
              <span className="text-[10px] tracking-tight mt-1 font-medium leading-none">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
