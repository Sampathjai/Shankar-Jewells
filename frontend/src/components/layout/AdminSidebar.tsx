import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Vault,
  ShoppingBag,
  Sparkles,
  Receipt,
  FileSpreadsheet,
  ShieldAlert,
  LogOut,
  Gem,
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MANAGER', 'BILLING_STAFF', 'INVENTORY_STAFF', 'DESIGNER'] },
    { label: 'Jewellery POS Billing', path: '/admin/billing', icon: Receipt, roles: ['SUPER_ADMIN', 'MANAGER', 'BILLING_STAFF'] },
    { label: 'Custom Requests', path: '/admin/custom-requests', icon: Sparkles, roles: ['SUPER_ADMIN', 'MANAGER', 'DESIGNER'] },
    { label: 'Product Catalogue', path: '/admin/products', icon: Package, roles: ['SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF'] },
    { label: 'Metal Rates Engine', path: '/admin/metal-rates', icon: TrendingUp, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { label: 'Vault Inventory', path: '/admin/inventory', icon: Vault, roles: ['SUPER_ADMIN', 'MANAGER', 'INVENTORY_STAFF'] },
    { label: 'Invoice History', path: '/admin/invoices', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'MANAGER', 'BILLING_STAFF'] },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert, roles: ['SUPER_ADMIN', 'MANAGER'] },
  ];

  const allowedItems = navItems.filter((item) => !user || item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-luxury-charcoal text-luxury-ivory min-h-screen flex flex-col justify-between p-4 border-r border-luxury-gold/20 select-none">
      <div className="space-y-6">
        {/* Admin Header */}
        <Link to="/admin" className="flex items-center gap-3 p-2 border-b border-luxury-gold/20 pb-4">
          <div className="w-9 h-9 rounded-full bg-luxury-gold text-luxury-charcoal flex items-center justify-center font-bold">
            <Gem className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-white leading-none">ROYAL JEWELS</h2>
            <span className="text-[9px] tracking-widest text-luxury-gold uppercase font-semibold">
              ERP & POS ATELIER
            </span>
          </div>
        </Link>

        {/* User Info Card */}
        <div className="p-3 bg-white/5 rounded-xl border border-luxury-gold/20 text-xs space-y-1">
          <div className="font-semibold text-white">{user?.name || 'Staff User'}</div>
          <div className="text-[10px] text-luxury-gold font-bold uppercase">{user?.role}</div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1 text-xs">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  active
                    ? 'bg-luxury-gold text-white font-semibold shadow-luxury'
                    : 'text-luxury-ivory/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Sign out */}
      <div className="pt-4 border-t border-luxury-gold/20">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold uppercase transition-all"
        >
          <LogOut className="w-4 h-4" /> Exit Portal
        </button>
      </div>
    </aside>
  );
};

