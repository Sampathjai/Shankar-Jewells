import React from 'react';
import { Link } from 'react-router-dom';
import { Gem, ShieldCheck, Award, Truck, Lock, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-luxury-charcoal text-luxury-ivory pt-16 pb-8 border-t border-luxury-gold/30">
      {/* Value Proposition Highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-luxury-gold/20 text-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-base font-bold text-luxury-gold">100% BIS Hallmarked</h4>
          <p className="text-xs text-luxury-ivory/70 mt-1">Certified purity on all gold & silver items</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-base font-bold text-luxury-gold">Custom Design Atelier</h4>
          <p className="text-xs text-luxury-ivory/70 mt-1">Upload reference photo & get artisan quotes</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-base font-bold text-luxury-gold">Insured Transit</h4>
          <p className="text-xs text-luxury-ivory/70 mt-1">Dispatched in tamper-proof security box</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-base font-bold text-luxury-gold">Transparent Pricing</h4>
          <p className="text-xs text-luxury-ivory/70 mt-1">Live market rate + itemized weight breakdown</p>
        </div>
      </div>

      {/* Footer Links & Brand Story */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border border-luxury-gold flex items-center justify-center bg-luxury-gold text-luxury-charcoal">
              <Gem className="w-4 h-4" />
            </div>
            <span className="font-serif text-xl font-bold tracking-widest text-luxury-ivory">SHANKER JEWELLS</span>
          </div>
          <p className="text-xs text-luxury-ivory/70 leading-relaxed">
            Crafting timeless heritage gold and modern sterling silver jewellery since 2000. Every piece is hallmarked, certified, and engineered with precision.
          </p>
          <div className="space-y-1.5 text-xs text-luxury-ivory/80">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-luxury-gold mt-0.5 shrink-0" />
              <span>No.4 sandhukadai, bigbazzar street, trichy - 620008</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-luxury-gold shrink-0" />
              <a href="tel:+919443949192" className="hover:text-luxury-gold">+91 9443949192</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-luxury-gold shrink-0" />
              <a href="mailto:contact@shankarjewels.com" className="hover:text-luxury-gold">contact@shankarjewels.com</a>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-serif text-base font-bold text-luxury-gold uppercase tracking-wider mb-4">
            Collections
          </h4>
          <ul className="space-y-2 text-xs text-luxury-ivory/80">
            <li><Link to="/shop?category=gold-jewellery" className="hover:text-luxury-gold transition-colors">22K Gold Jewellery</Link></li>
            <li><Link to="/shop?category=silver-jewellery" className="hover:text-luxury-gold transition-colors">925 Sterling Silver</Link></li>
            <li><Link to="/shop?collection=royal-heritage-bridal" className="hover:text-luxury-gold transition-colors">Bridal Heritage Collection</Link></li>
            <li><Link to="/gold-calculator" className="hover:text-luxury-gold transition-colors">Purity Calculator (70 / 80 / 22K)</Link></li>
            <li><Link to="/custom-jewellery" className="hover:text-luxury-gold transition-colors">Custom Design Studio</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-base font-bold text-luxury-gold uppercase tracking-wider mb-4">
            Customer Services
          </h4>
          <ul className="space-y-2 text-xs text-luxury-ivory/80">
            <li><Link to="/gold-silver-rate" className="hover:text-luxury-gold transition-colors">Live Bullion Rates</Link></li>
            <li><Link to="/gold-calculator" className="hover:text-luxury-gold transition-colors">Gold Calculator</Link></li>
            <li><Link to="/account/orders" className="hover:text-luxury-gold transition-colors">Track Orders</Link></li>
            <li><Link to="/admin/login" className="hover:text-luxury-gold transition-colors">Staff Portal Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-base font-bold text-luxury-gold uppercase tracking-wider mb-4">
            Shanker Jewells Privileges
          </h4>
          <p className="text-xs text-luxury-ivory/70 mb-3">
            Get daily live Trichy gold rate alerts & new design additions via email.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full text-xs py-2 px-3 rounded-md bg-white/10 border border-luxury-gold/30 text-white placeholder-white/40 focus:outline-none focus:border-luxury-gold"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-md bg-luxury-gold text-luxury-charcoal font-semibold text-xs uppercase tracking-wider hover:bg-luxury-gold-light transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-luxury-gold/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-luxury-ivory/50">
        <p>© 2000-2026 Shanker Jewells. All rights reserved. Registered BIS Hallmark License - Trichy.</p>
        <div className="flex gap-4">
          <Link to="/admin/login" className="text-luxury-gold hover:underline font-semibold">Staff Portal</Link>
        </div>
      </div>
    </footer>
  );
};
