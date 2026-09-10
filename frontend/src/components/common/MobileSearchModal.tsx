import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Sparkles, Clock, ArrowRight } from 'lucide-react';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {}
    }
  }, []);

  if (!isOpen) return null;

  const handleSearchSubmit = (searchKeyword: string) => {
    const clean = searchKeyword.trim();
    if (!clean) return;

    const updated = [clean, ...recentSearches.filter((s) => s !== clean)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));

    onClose();
    navigate(`/shop?search=${encodeURIComponent(clean)}`);
  };

  const quickCategories = [
    { label: 'Gold Haram', query: 'Haram' },
    { label: 'Kundan Necklace', query: 'Kundan' },
    { label: 'Temple Jhumkas', query: 'Jhumka' },
    { label: 'Solitaire Ring', query: 'Solitaire' },
    { label: 'Silver Bangle', query: 'Silver' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-luxury-charcoal/95 backdrop-blur-md text-luxury-ivory flex flex-col animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="p-4 border-b border-luxury-gold/20 flex items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSubmit(query);
          }}
          className="flex-1 relative"
        >
          <Search className="w-4 h-4 absolute left-3 top.1/2 top-3 text-luxury-gold" />
          <input
            type="text"
            autoFocus
            placeholder="Search by product name, SKU, 22K..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 border border-luxury-gold/40 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-luxury-gold shadow-inner"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-3 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <button
          onClick={onClose}
          className="px-3 py-2 text-xs font-bold text-luxury-gold hover:text-white"
        >
          Cancel
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
        {/* Quick Category Chips */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-luxury-gold/80 block mb-3">
            Popular Searches
          </span>
          <div className="flex flex-wrap gap-2">
            {quickCategories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleSearchSubmit(cat.query)}
                className="px-3 py-1.5 rounded-full bg-slate-800 border border-luxury-gold/30 hover:border-luxury-gold text-white font-medium text-[11px] flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-luxury-gold" /> {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-luxury-ivory/60 flex items-center gap-1">
                <Clock className="w-3 h-3 text-luxury-gold" /> Recent Searches
              </span>
              <button
                onClick={() => {
                  setRecentSearches([]);
                  localStorage.removeItem('recent_searches');
                }}
                className="text-[10px] text-slate-400 hover:text-rose-400"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-1">
              {recentSearches.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSearchSubmit(s)}
                  className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium text-slate-200">{s}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-luxury-gold/60" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSearchModal;
