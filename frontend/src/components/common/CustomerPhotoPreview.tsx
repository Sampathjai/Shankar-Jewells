import React, { useEffect } from 'react';
import { X, User } from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrlResolver';

interface CustomerPhotoPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl?: string | null;
  businessName?: string;
  contactPerson?: string;
  mobile?: string;
}

export const CustomerPhotoPreview: React.FC<CustomerPhotoPreviewProps> = ({
  isOpen,
  onClose,
  photoUrl,
  businessName = 'Customer',
  contactPerson,
  mobile,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initials = businessName
    ? businessName
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CU';

  const resolvedUrl = photoUrl ? resolveImageUrl(photoUrl) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">{businessName}</h3>
            {(contactPerson || mobile) && (
              <p className="text-xs text-amber-400 font-medium">
                {contactPerson ? `${contactPerson} • ` : ''}
                {mobile || ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 flex items-center justify-center bg-slate-950/60 overflow-hidden">
          {resolvedUrl ? (
            <img
              src={resolvedUrl}
              alt={businessName}
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
              onError={(e) => {
                // If image load fails, hide image element and show fallback div
                (e.target as HTMLElement).style.display = 'none';
                const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}

          {/* Fallback Initials Display */}
          <div
            className={`flex-col items-center justify-center py-12 px-8 text-center ${
              photoUrl ? 'hidden' : 'flex'
            }`}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-700/30 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 font-extrabold text-4xl shadow-inner mb-4">
              {initials || <User className="w-16 h-16" />}
            </div>
            <p className="text-sm text-slate-400">No profile photo uploaded for this customer.</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Shanker Jewells Customer Photo Lightbox • Press Esc to close
          </p>
        </div>
      </div>
    </div>
  );
};

