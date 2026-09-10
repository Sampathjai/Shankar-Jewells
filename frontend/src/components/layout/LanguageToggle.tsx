import React from 'react';
import { useLanguage, Language } from '../../i18n';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
  showIcon = true,
}) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = (newLang: Language) => {
    if (language !== newLang) {
      setLanguage(newLang);
    }
  };

  return (
    <div
      className={`inline-flex items-center bg-white/90 border border-luxury-gold/40 rounded-full p-0.5 shadow-sm min-h-[44px] ${className}`}
      role="group"
      aria-label="Change language / மொழியை மாற்றவும்"
    >
      {showIcon && (
        <span className="pl-2.5 pr-1 text-luxury-gold flex items-center justify-center">
          <Globe className="w-4 h-4" />
        </span>
      )}

      <button
        type="button"
        onClick={() => toggleLanguage('en')}
        aria-label="Switch to English"
        aria-pressed={language === 'en'}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all min-h-[36px] flex items-center justify-center ${
          language === 'en'
            ? 'bg-luxury-gold text-white shadow-sm'
            : 'text-luxury-charcoal hover:text-luxury-gold'
        }`}
      >
        EN
      </button>

      <span className="text-luxury-gray/40 text-xs px-0.5 font-sans font-light">|</span>

      <button
        type="button"
        onClick={() => toggleLanguage('ta')}
        aria-label="Switch to Tamil"
        aria-pressed={language === 'ta'}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all min-h-[36px] flex items-center justify-center ${
          language === 'ta'
            ? 'bg-luxury-gold text-white shadow-sm'
            : 'text-luxury-charcoal hover:text-luxury-gold'
        }`}
      >
        தமிழ்
      </button>
    </div>
  );
};

