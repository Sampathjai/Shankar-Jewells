import React, { useState, useEffect } from 'react';
import { X, Check, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface MobileFilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  selectedMetal: string;
  selectedPurity: string;
  onApplyFilters: (filters: { category: string; metal: string; purity: string }) => void;
}

export const MobileFilterBottomSheet: React.FC<MobileFilterBottomSheetProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  selectedMetal,
  selectedPurity,
  onApplyFilters,
}) => {
  const [cat, setCat] = useState(selectedCategory);
  const [metal, setMetal] = useState(selectedMetal);
  const [purity, setPurity] = useState(selectedPurity);

  useEffect(() => {
    setCat(selectedCategory);
    setMetal(selectedMetal);
    setPurity(selectedPurity);
  }, [selectedCategory, selectedMetal, selectedPurity, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters({ category: cat, metal, purity });
    onClose();
  };

  const handleReset = () => {
    setCat('ALL');
    setMetal('ALL');
    setPurity('ALL');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl border-t border-luxury-border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Sticky Header */}
        <div className="p-4 border-b border-luxury-border flex items-center justify-between bg-luxury-ivory/80">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-luxury-gold" />
            <h3 className="font-serif font-bold text-sm text-luxury-charcoal uppercase tracking-wider">
              Filter Jewellery Catalogue
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-luxury-gray hover:text-luxury-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-luxury-charcoal custom-admin-scrollbar">
          {/* Category Filter */}
          <div>
            <label className="font-bold text-xs uppercase tracking-wider block text-luxury-charcoal mb-2.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'All Categories', value: 'ALL' },
                { label: 'Gold Jewellery', value: 'gold-jewellery' },
                { label: 'Silver Ornaments', value: 'silver-jewellery' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCat(item.value)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    cat === item.value
                      ? 'bg-luxury-gold text-white border-luxury-gold shadow-sm'
                      : 'bg-luxury-ivory/50 border-luxury-border text-luxury-charcoal hover:bg-luxury-ivory'
                  }`}
                >
                  <span>{item.label}</span>
                  {cat === item.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Metal Type Filter */}
          <div>
            <label className="font-bold text-xs uppercase tracking-wider block text-luxury-charcoal mb-2.5">
              Metal Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'All Metals', value: 'ALL' },
                { label: 'Gold', value: 'GOLD' },
                { label: 'Silver', value: 'SILVER' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMetal(item.value)}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                    metal === item.value
                      ? 'bg-luxury-gold text-white border-luxury-gold shadow-sm'
                      : 'bg-luxury-ivory/50 border-luxury-border text-luxury-charcoal hover:bg-luxury-ivory'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Purity Filter */}
          <div>
            <label className="font-bold text-xs uppercase tracking-wider block text-luxury-charcoal mb-2.5">
              Purity / Gold Karat
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'All Purities', value: 'ALL' },
                { label: '24K Gold', value: 'K24' },
                { label: '22K Gold', value: 'K22' },
                { label: '18K Gold', value: 'K18' },
                { label: '925 Silver', value: 'SILVER_925' },
                { label: '999 Silver', value: 'SILVER_999' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPurity(item.value)}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                    purity === item.value
                      ? 'bg-luxury-gold text-white border-luxury-gold shadow-sm'
                      : 'bg-luxury-ivory/50 border-luxury-border text-luxury-charcoal hover:bg-luxury-ivory'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-luxury-border bg-white flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-3 bg-white border border-luxury-border text-luxury-charcoal font-bold rounded-xl text-xs hover:bg-luxury-ivory flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-luxury-gold" /> Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterBottomSheet;
