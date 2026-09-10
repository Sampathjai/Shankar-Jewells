import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Building2,
  Package,
  Menu,
  X,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  Sparkles,
  Shield,
  Users,
  Settings,
  Flame,
  FileText,
  Layers,
} from 'lucide-react';

export const MobileAdminNav: React.FC = () => {
  const location = useLocation();
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  // Only render on admin routes (except login)
  if (!location.pathname.startsWith('/admin') || location.pathname === '/admin/login') {
    return null;
  }

  const mainTabs = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/pos', label: 'POS Billing', icon: ShoppingCart },
    { to: '/admin/wholesale/customers', label: 'Customers', icon: Building2 },
    { to: '/admin/inventory', label: 'Inventory', icon: Package },
  ];

  const adminMenuGroups = [
    {
      title: 'SALES & WHOLESALE BILLING',
      items: [
        { to: '/admin/pos', label: 'Retail POS Desk', icon: ShoppingCart },
        { to: '/admin/wholesale/billing', label: 'Wholesale B2B Billing', icon: FileSpreadsheet },
        { to: '/admin/wholesale/customers', label: 'Wholesale Customers', icon: Building2 },
        { to: '/admin/wholesale/payments', label: 'Wholesale Payments', icon: DollarSign },
        { to: '/admin/wholesale/receivables', label: 'Receivables & Aging', icon: TrendingUp },
      ],
    },
    {
      title: 'VAULT & PRODUCT CATALOGUE',
      items: [
        { to: '/admin/products', label: 'Product Directory', icon: Package },
        { to: '/admin/categories', label: 'Category Manager', icon: Layers },
        { to: '/admin/inventory', label: 'Vault Stock Inventory', icon: Flame },
      ],
    },
    {
      title: 'CUSTOM JEWELLERY & QUOTATIONS',
      items: [
        { to: '/admin/custom-requests', label: 'Custom Design Requests', icon: Sparkles },
      ],
    },
    {
      title: 'FINANCE & REPORTS',
      items: [
        { to: '/admin/invoices', label: 'Issued Invoices Archive', icon: FileText },
      ],
    },
    {
      title: 'SYSTEM & SECURITY',
      items: [
        { to: '/admin/metal-rates', label: 'Live Metal Rates', icon: Flame },
        { to: '/admin/users', label: 'User Roles & Access', icon: Users },
        { to: '/admin/audit-logs', label: 'Audit Trail Logs', icon: Shield },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-luxury-charcoal text-luxury-ivory border-t border-luxury-gold/30 shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.to;

            return (
              <NavLink
                key={tab.label}
                to={tab.to}
                className={`flex flex-col items-center justify-center py-1 transition-all min-h-[48px] ${
                  isActive
                    ? 'text-luxury-gold font-bold scale-105'
                    : 'text-luxury-ivory/70 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-luxury-gold' : ''}`} />
                <span className="text-[10px] tracking-tight mt-1 font-medium leading-none">
                  {tab.label}
                </span>
              </NavLink>
            );
          })}

          {/* More Drawer Trigger */}
          <button
            onClick={() => setMoreDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1 transition-all min-h-[48px] ${
              moreDrawerOpen ? 'text-luxury-gold font-bold' : 'text-luxury-ivory/70 hover:text-white'
            }`}
          >
            <Menu className="w-5 h-5 text-luxury-gold" />
            <span className="text-[10px] tracking-tight mt-1 font-medium leading-none">More</span>
          </button>
        </div>
      </div>

      {/* Full-Screen "More" Navigation Drawer */}
      {moreDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-white tracking-wide uppercase flex items-center gap-2">
              <Menu className="w-4 h-4 text-luxury-gold" /> Shanker ERP Navigation Drawer
            </h3>
            <button
              onClick={() => setMoreDrawerOpen(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs custom-admin-scrollbar pb-24">
            {adminMenuGroups.map((group, idx) => (
              <div key={idx} className="space-y-2">
                <span className="text-[10px] font-bold text-luxury-gold uppercase tracking-wider block border-b border-slate-800 pb-1">
                  {group.title}
                </span>
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMoreDrawerOpen(false)}
                        className={`p-3 rounded-xl border flex items-center gap-3 font-semibold transition-all min-h-[48px] ${
                          isActive
                            ? 'bg-luxury-gold text-white border-luxury-gold shadow-sm'
                            : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-luxury-gold'}`} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileAdminNav;
