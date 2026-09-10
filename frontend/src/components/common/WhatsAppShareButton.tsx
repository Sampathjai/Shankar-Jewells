import React from 'react';
import { Share2, MessageCircle } from 'lucide-react';
import { openWhatsAppChat } from '../../utils/whatsapp';
import { useToast } from './Toast';

interface WhatsAppShareButtonProps {
  phone?: string;
  message?: string;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'compact';
}

export const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  phone,
  message,
  label = 'WhatsApp',
  className = '',
  variant = 'primary',
}) => {
  const { showToast } = useToast();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!phone) {
      showToast('Customer WhatsApp mobile number is not specified.', 'error');
      return;
    }

    openWhatsAppChat(phone, message);
  };

  let baseStyle =
    'inline-flex items-center justify-center gap-1.5 rounded-xl font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer ';

  if (variant === 'primary') {
    baseStyle += 'px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-md ';
  } else if (variant === 'secondary') {
    baseStyle += 'px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs ';
  } else if (variant === 'outline') {
    baseStyle += 'px-3 py-1.5 border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs ';
  } else if (variant === 'compact') {
    baseStyle += 'px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] ';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseStyle} ${className}`}
      title="Share document / statement on WhatsApp"
    >
      <MessageCircle className="w-4 h-4 shrink-0 text-emerald-200 fill-emerald-600" />
      <span>{label}</span>
    </button>
  );
};

