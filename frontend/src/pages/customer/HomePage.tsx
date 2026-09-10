import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Award, Upload, ChevronRight, Search, Layers } from 'lucide-react';
import { useMetalRateStore } from '../../store/useMetalRateStore';
import { SmartImage } from '../../components/common/SmartImage';
import { fetchApi } from '../../api/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  description?: string | null;
}

export const HomePage: React.FC = () => {
  const { getRate } = useMetalRateStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const k24 = getRate('GOLD', 'K24');
  const k22 = getRate('GOLD', 'K22');
  const k18 = getRate('GOLD', 'K18');
  const silver = getRate('SILVER', 'SILVER_999');

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetchApi<{ success: boolean; data: Category[] }>('/categories');
        if (res.success && res.data && res.data.length > 0) {
          setCategories(res.data);
        } else {
          // Default categories fallback
          setCategories([
            { id: '1', name: 'Gold Necklaces', slug: 'gold-jewellery', imageUrl: null },
            { id: '2', name: 'Solitaire Rings', slug: 'gold-jewellery', imageUrl: null },
            { id: '3', name: 'Jhumka Earrings', slug: 'gold-jewellery', imageUrl: null },
            { id: '4', name: 'Silver Ornaments', slug: 'silver-jewellery', imageUrl: null },
          ]);
        }
      } catch (err) {
        console.warn('Using default category placeholders:', err);
        setCategories([
          { id: '1', name: 'Gold Necklaces', slug: 'gold-jewellery', imageUrl: null },
          { id: '2', name: 'Solitaire Rings', slug: 'gold-jewellery', imageUrl: null },
          { id: '3', name: 'Jhumka Earrings', slug: 'gold-jewellery', imageUrl: null },
          { id: '4', name: 'Silver Ornaments', slug: 'silver-jewellery', imageUrl: null },
        ]);
      } finally {
        setLoadingCats(false);
      }
    }
    loadCategories();
  }, []);

  return (
    <div className="space-y-12 sm:space-y-24 pb-16">
      {/* HERO EDITORIAL SECTION */}
      <section className="relative overflow-hidden bg-luxury-charcoal text-luxury-ivory py-16 sm:py-32 lg:py-40">
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <SmartImage
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1920"
            alt="Jewellery Editorial Background"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-luxury-gold/20 border border-luxury-gold/40 text-luxury-gold text-xs font-semibold uppercase tracking-widest"
          >
            <Sparkles className="w-3.5 h-3.5" /> Handcrafted Heritage Bullion & Jewels
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-3xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight max-w-4xl mx-auto"
          >
            Jewellery That Becomes Part Of Your Story
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xs sm:text-lg text-luxury-ivory/80 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Discover timeless 22K gold and 925 sterling silver jewellery crafted with 100% BIS hallmark purity for life's most precious celebrations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <Link
              to="/shop"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all shadow-luxury flex items-center justify-center gap-2 min-h-[48px]"
            >
              Shop Gold Collection <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/custom-jewellery"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-luxury-gold text-luxury-gold font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold/10 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              Design Your Jewellery <Sparkles className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* MOBILE QUICK CATEGORY HORIZONTAL RAIL */}
      <section className="sm:hidden px-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-luxury-gold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Quick Categories
          </span>
          <Link to="/shop" className="text-[10px] text-luxury-gray hover:text-luxury-gold font-semibold uppercase">
            View All →
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 custom-admin-scrollbar">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="flex-none w-28 p-2 bg-white border border-luxury-border rounded-xl flex flex-col items-center text-center shadow-card hover:border-luxury-gold transition-all"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border border-luxury-gold/30">
                <SmartImage src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
              </div>
              <span className="font-serif font-bold text-[11px] text-luxury-charcoal line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CURATED CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs font-semibold tracking-widest text-luxury-gold uppercase">
            Curated Collections
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-luxury-charcoal mt-1">
            Browse By Category
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden shadow-card aspect-[4/5] bg-luxury-beige border border-luxury-border"
            >
              <SmartImage
                src={cat.imageUrl}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-charcoal/85 via-transparent to-transparent flex items-end p-4">
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-white group-hover:text-luxury-gold transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-luxury-gold uppercase tracking-widest flex items-center gap-1 font-semibold mt-0.5">
                    Explore Collection <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CUSTOM JEWELLERY HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-luxury-charcoal text-luxury-ivory rounded-2xl p-6 sm:p-12 lg:p-16 border border-luxury-gold/30 relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 sm:space-y-6 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-luxury-gold/20 text-luxury-gold text-xs font-semibold uppercase tracking-widest border border-luxury-gold/40">
              <Sparkles className="w-3.5 h-3.5" /> Custom Jewellery Studio
            </span>

            <h2 className="font-serif text-2xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Have A Custom Design In Mind?
            </h2>

            <p className="text-xs sm:text-base text-luxury-ivory/80 leading-relaxed font-light">
              Turn your reference photos, Pinterest pins, or hand-drawn sketches into a 100% hallmarked custom gold masterpiece. Our master craftsmen calculate exact weight, wastage, making charges, and issue instant versioned estimates.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <Link
                to="/custom-jewellery"
                className="px-8 py-3.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury min-h-[48px]"
              >
                <Upload className="w-4 h-4" /> Upload Reference Photo
              </Link>
            </div>
          </div>

          <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-luxury-gold/30 shadow-2xl">
            <SmartImage
              src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000"
              alt="Custom Jewellery Craftsmanship"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* LIVE GOLD & SILVER RATES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-luxury-border shadow-card">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
                Bullion Rates Today
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-luxury-charcoal">
                Live Gold & Silver Pricing
              </h2>
            </div>
            <Link
              to="/gold-silver-rate"
              className="px-5 py-2 rounded-full border border-luxury-gold text-luxury-gold text-xs font-semibold uppercase tracking-wider hover:bg-luxury-gold hover:text-white transition-all"
            >
              View Rate History & Charts
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-luxury-beige/50 rounded-xl border border-luxury-gold/20 text-center">
              <span className="text-xs text-luxury-gray uppercase font-semibold">24K Gold</span>
              <div className="font-serif text-xl sm:text-2xl font-bold text-luxury-gold mt-1">
                ₹{k24.toLocaleString('en-IN')}/g
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">99.9% Purity</span>
            </div>

            <div className="p-4 bg-luxury-beige/50 rounded-xl border border-luxury-gold/20 text-center">
              <span className="text-xs text-luxury-gray uppercase font-semibold">22K Gold</span>
              <div className="font-serif text-xl sm:text-2xl font-bold text-luxury-gold mt-1">
                ₹{k22.toLocaleString('en-IN')}/g
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">91.6% BIS Hallmark</span>
            </div>

            <div className="p-4 bg-luxury-beige/50 rounded-xl border border-luxury-gold/20 text-center">
              <span className="text-xs text-luxury-gray uppercase font-semibold">18K Gold</span>
              <div className="font-serif text-xl sm:text-2xl font-bold text-luxury-gold mt-1">
                ₹{k18.toLocaleString('en-IN')}/g
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">75.0% Hallmarked</span>
            </div>

            <div className="p-4 bg-luxury-beige/50 rounded-xl border border-luxury-gold/20 text-center">
              <span className="text-xs text-luxury-gray uppercase font-semibold">Sterling Silver</span>
              <div className="font-serif text-xl sm:text-2xl font-bold text-luxury-gold mt-1">
                ₹{silver.toLocaleString('en-IN')}/g
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">99.9% Fine Silver</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
