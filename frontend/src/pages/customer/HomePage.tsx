import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Award, Upload, CheckCircle2, ChevronRight } from 'lucide-react';
import { useMetalRateStore } from '../../store/useMetalRateStore';

export const HomePage: React.FC = () => {
  const { getRate } = useMetalRateStore();

  const k24 = getRate('GOLD', 'K24');
  const k22 = getRate('GOLD', 'K22');
  const k18 = getRate('GOLD', 'K18');
  const silver = getRate('SILVER', 'SILVER_999');

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* SECTION 2: HERO EDITORIAL SECTION */}
      <section className="relative overflow-hidden bg-luxury-charcoal text-luxury-ivory py-20 sm:py-32 lg:py-40">
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <motion.img
            initial={{ scale: 1.0 }}
            animate={{ scale: 1.05 }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
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
            className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight max-w-4xl mx-auto"
          >
            Jewellery That Becomes Part Of Your Story
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm sm:text-lg text-luxury-ivory/80 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Discover timeless 22K gold and 925 sterling silver jewellery crafted with 100% BIS hallmark purity for life's most precious celebrations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/shop"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all shadow-luxury flex items-center justify-center gap-2"
            >
              Shop Gold Collection <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/custom-jewellery"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-luxury-gold text-luxury-gold font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold/10 transition-all flex items-center justify-center gap-2"
            >
              Design Your Jewellery <Sparkles className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: JEWELLERY CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold tracking-widest text-luxury-gold uppercase">
            Curated Categories
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-luxury-charcoal mt-1">
            Browse By Category
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { name: 'Gold Necklaces', slug: 'gold-jewellery', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600' },
            { name: 'Solitaire Rings', slug: 'gold-jewellery', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600' },
            { name: 'Jhumka Earrings', slug: 'gold-jewellery', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600' },
            { name: 'Silver Ornaments', slug: 'silver-jewellery', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600' },
          ].map((cat, i) => (
            <Link
              key={i}
              to={`/shop?category=${cat.slug}`}
              className="group relative rounded-xl overflow-hidden shadow-card aspect-[4/5] bg-luxury-beige"
            >
              <img
                src={cat.img}
                alt={cat.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-charcoal/80 via-transparent to-transparent flex items-end p-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white group-hover:text-luxury-gold transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-luxury-gold uppercase tracking-widest flex items-center gap-1 font-semibold">
                    Explore <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 8: CUSTOM JEWELLERY HERO SECTION (MAJOR HIGHLIGHT) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-luxury-charcoal text-luxury-ivory rounded-2xl p-8 sm:p-12 lg:p-16 border border-luxury-gold/30 relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-luxury-gold/20 text-luxury-gold text-xs font-semibold uppercase tracking-widest border border-luxury-gold/40">
              <Sparkles className="w-3.5 h-3.5" /> Custom Jewellery Studio
            </span>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Have A Design In Mind?
            </h2>

            <p className="text-sm sm:text-base text-luxury-ivory/80 leading-relaxed font-light">
              Turn your reference photos, Pinterest pins, or hand-drawn sketches into a 100% hallmarked custom gold masterpiece. Our master craftsmen calculate exact weight, wastage, making charges, and issue instant versioned estimates.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <Link
                to="/custom-jewellery"
                className="px-8 py-3.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury"
              >
                <Upload className="w-4 h-4" /> Upload Your Design
              </Link>
            </div>
          </div>

          <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-luxury-gold/30 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000"
              alt="Custom Jewellery Craftsmanship"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* SECTION 9: LIVE GOLD & SILVER RATES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-luxury-border shadow-card">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-luxury-beige/50 rounded-xl border border-luxury-gold/20 text-center">
              <span className="text-xs text-luxury-gray uppercase font-semibold">24K Gold</span>
              <div className="font-serif text-2xl font-bold text-luxury-gold mt-1">
                ₹{k24.toLocaleString('en-IN')}/g
              </div>
              <span className="text-[10px] text-green-700 font-medium">99.9% Purity</span>
            </div>

            <div className="p-4 bg-luxury-beige/50 rounded-xl border border-luxury-gold/20 text-center">
              <span className="text-xs text-luxury-gray uppercase font-semibold">22K Gold</span>
              <div className="font-serif text-2xl font-bold text-luxury-gold mt-1">
                ₹{k22.toLocaleString('en-IN')}/g
              </div>
              <span className="text-[10px] text-green-700 font-medium">91.6% BIS Hallmark</span>
            </div>

            <div className="p-4 bg-luxury-beige/50 rounded-xl border border-luxury-gold/20 text-center">
              <span className="text-xs text-luxury-gray uppercase font-semibold">18K Gold</span>
              <div className="font-serif text-2xl font-bold text-luxury-gold mt-1">
                ₹{k18.toLocaleString('en-IN')}/g
              </div>
              <span className="text-[10px] text-green-700 font-medium">75.0% Hallmarked</span>
            </div>

            <div className="p-4 bg-luxury-beige/50 rounded-xl border border-luxury-gold/20 text-center">
              <span className="text-xs text-luxury-gray uppercase font-semibold">Sterling Silver</span>
              <div className="font-serif text-2xl font-bold text-luxury-gold mt-1">
                ₹{silver.toLocaleString('en-IN')}/g
              </div>
              <span className="text-[10px] text-green-700 font-medium">99.9% Fine Silver</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

