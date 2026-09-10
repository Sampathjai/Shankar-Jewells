import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Gem, Menu, Bell, User as UserIcon, LogOut, X } from 'lucide-react';

export const MobileAdminHeader: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-luxury-charcoal text-luxury-ivory border-b border-luxury-gold/30 px-4 py-3 flex items-center justify-between shadow-md">
      {/* Brand Title */}
      <Link to="/admin/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full border border-luxury-gold/50 flex items-center justify-center bg-slate-900 text-luxury-gold shrink-0">
          <Gem className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-serif text-sm font-bold tracking-wider text-white leading-tight uppercase">
            SHANKER JEWELLS
          </span>
          <span className="text-[8px] text-luxury-gold uppercase tracking-widest font-mono">
            ADMIN ERP & POS
          </span>
        </div>
      </Link>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-2 relative">
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-9 h-9 rounded-full bg-luxury-gold/20 border border-luxury-gold/40 flex items-center justify-center text-luxury-gold font-bold text-xs shadow-inner"
          >
            {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 text-xs text-luxury-ivory z-50 space-y-3 animate-in fade-in duration-150">
              <div className="border-b border-slate-800 pb-2">
                <div className="font-bold text-white text-sm">{user?.name || 'Administrator'}</div>
                <div className="text-[10px] text-amber-400 font-mono">{user?.role || 'SUPER_ADMIN'}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-rose-800/40"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileAdminHeader;

