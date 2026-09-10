import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguage } from '../../i18n';
import { LanguageToggle } from './LanguageToggle';
import {
  LayoutDashboard,
  Receipt,
  Building2,
  Users,
  CreditCard,
  TrendingDown,
  Package,
  FolderTree,
  Vault,
  Sparkles,
  FileSpreadsheet,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Globe,
  Gem,
  X,
} from 'lucide-react';

interface NavGroup {
  groupName?: string;
  items: {
    label: string;
    path: string;
    icon: React.ElementType;
    roles: string[];
  }[];
}

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useLanguage();

  const navGroups: NavGroup[] = [
    {
      items: [
        {
          label: t('nav.dashboard'),
          path: '/admin',
          icon: LayoutDashboard,
          roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'BILLING_STAFF', 'INVENTORY_STAFF', 'WHOLESALE_MANAGER', 'DESIGNER'],
        },
      ],
    },
    {
      groupName: t('nav.salesBilling'),
      items: [
        { label: t('nav.retailPos'), path: '/admin/billing', icon: Receipt, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'BILLING_STAFF'] },
        { label: t('nav.wholesaleBilling'), path: '/admin/wholesale', icon: Building2, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'WHOLESALE_MANAGER'] },
        { label: t('nav.wholesaleCustomers'), path: '/admin/wholesale/customers', icon: Users, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'WHOLESALE_MANAGER'] },
        { label: t('nav.wholesalePayments'), path: '/admin/wholesale/payments', icon: CreditCard, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'WHOLESALE_MANAGER'] },
        { label: t('nav.receivablesAging'), path: '/admin/wholesale/receivables', icon: TrendingDown, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'WHOLESALE_MANAGER'] },
      ],
    },
    {
      groupName: t('nav.inventoryCatalogue'),
      items: [
        { label: t('nav.productCatalogue'), path: '/admin/products', icon: Package, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'INVENTORY_STAFF'] },
        { label: t('nav.categoryManager'), path: '/admin/categories', icon: FolderTree, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'INVENTORY_STAFF'] },
        { label: t('nav.vaultInventory'), path: '/admin/inventory', icon: Vault, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'INVENTORY_STAFF'] },
      ],
    },
    {
      groupName: t('nav.customJewellery'),
      items: [
        { label: t('nav.customRequests'), path: '/admin/custom-requests', icon: Sparkles, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'DESIGNER'] },
      ],
    },
    {
      groupName: t('nav.financeSystem'),
      items: [
        { label: t('nav.invoiceHistory'), path: '/admin/invoices', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'BILLING_STAFF'] },
        { label: t('nav.metalRates'), path: '/admin/metal-rates', icon: TrendingUp, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
        { label: t('nav.auditLogs'), path: '/admin/audit-logs', icon: ShieldAlert, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
        { label: t('nav.users'), path: '/admin/users', icon: UserCheck, roles: ['SUPER_ADMIN'] },
      ],
    },
  ];

  const handleExitPortal = () => {
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 space-y-5">
      <div className="space-y-5">
        {/* Admin Header */}
        <div className="flex items-center justify-between p-2 border-b border-luxury-gold/20 pb-4">
          <Link to="/admin" onClick={onClose} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-luxury-gold text-luxury-charcoal flex items-center justify-center font-bold shadow-luxury shrink-0">
              <Gem className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-white leading-none tracking-wide">SHANKER JEWELLS</h2>
              <span className="text-[9px] tracking-widest text-luxury-gold uppercase font-semibold">
                TRICHY • SINCE 2000
              </span>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-luxury-gold hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Info & Language Control Card */}
        <div className="p-3 bg-white/5 rounded-xl border border-luxury-gold/20 text-xs flex items-center justify-between gap-2">
          <div className="truncate">
            <div className="font-semibold text-white truncate">{user?.name || 'Staff User'}</div>
            <div className="text-[10px] text-luxury-gold uppercase font-mono">{user?.role || 'SUPER_ADMIN'}</div>
          </div>
          <LanguageToggle showIcon={false} />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-4">
          {navGroups.map((group, gIdx) => {
            const visibleItems = group.items.filter(
              (item) => !user || item.roles.includes(user.role)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {group.groupName && (
                  <div className="text-[10px] font-bold text-luxury-gold/80 tracking-widest uppercase px-3 py-1">
                    {group.groupName}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const isActive =
                    item.path === '/admin'
                      ? location.pathname === '/admin' || location.pathname === '/admin/dashboard'
                      : location.pathname.startsWith(item.path);

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-luxury-gold text-luxury-charcoal font-bold shadow-sm'
                          : 'text-luxury-ivory/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Exit Portal */}
      <div className="pt-4 border-t border-luxury-gold/20 space-y-2 shrink-0">
        <button
          onClick={handleExitPortal}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-luxury-gold/10 hover:bg-luxury-gold hover:text-luxury-charcoal text-luxury-gold text-xs font-semibold uppercase transition-all border border-luxury-gold/30"
        >
          <Globe className="w-4 h-4" /> {t('nav.exitPortal')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="w-64 h-screen shrink-0 bg-luxury-charcoal text-luxury-ivory border-r border-luxury-gold/20 hidden lg:block overflow-y-auto custom-admin-scrollbar select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Sliding Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-luxury-charcoal/70 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-64 h-full bg-luxury-charcoal text-luxury-ivory border-r border-luxury-gold/20 overflow-y-auto custom-admin-scrollbar select-none z-10 animate-slide-up">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
