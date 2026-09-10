import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
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

  const navGroups: NavGroup[] = [
    {
      items: [
        {
          label: 'Dashboard Overview',
          path: '/admin',
          icon: LayoutDashboard,
          roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'BILLING_STAFF', 'INVENTORY_STAFF', 'WHOLESALE_MANAGER', 'DESIGNER'],
        },
      ],
    },
    {
      groupName: 'SALES & BILLING',
      items: [
        { label: 'Retail POS Billing', path: '/admin/billing', icon: Receipt, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'BILLING_STAFF'] },
        { label: 'Wholesale Billing', path: '/admin/wholesale', icon: Building2, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'WHOLESALE_MANAGER'] },
        { label: 'Wholesale Customers', path: '/admin/wholesale/customers', icon: Users, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'WHOLESALE_MANAGER'] },
        { label: 'Wholesale Payments', path: '/admin/wholesale/payments', icon: CreditCard, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'WHOLESALE_MANAGER'] },
        { label: 'Receivables & Aging', path: '/admin/wholesale/receivables', icon: TrendingDown, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'WHOLESALE_MANAGER'] },
      ],
    },
    {
      groupName: 'INVENTORY & CATALOGUE',
      items: [
        { label: 'Product Catalogue', path: '/admin/products', icon: Package, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'INVENTORY_STAFF'] },
        { label: 'Category Manager', path: '/admin/categories', icon: FolderTree, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'INVENTORY_STAFF'] },
        { label: 'Vault Stock Inventory', path: '/admin/inventory', icon: Vault, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'INVENTORY_STAFF'] },
      ],
    },
    {
      groupName: 'CUSTOM JEWELLERY',
      items: [
        { label: 'Custom Requests', path: '/admin/custom-requests', icon: Sparkles, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'DESIGNER'] },
      ],
    },
    {
      groupName: 'FINANCE & SYSTEM',
      items: [
        { label: 'Invoice History', path: '/admin/invoices', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'STORE_MANAGER', 'BILLING_STAFF'] },
        { label: 'Metal Rates Engine', path: '/admin/metal-rates', icon: TrendingUp, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
        { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
        { label: 'User Management', path: '/admin/users', icon: UserCheck, roles: ['SUPER_ADMIN'] },
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

        {/* User Info Card */}
        <div className="p-3 bg-white/5 rounded-xl border border-luxury-gold/20 text-xs flex items-center justify-between">
          <div>
            <div className="font-semibold text-white truncate max-w-[130px]">{user?.name || 'Staff User'}</div>
            <div className="text-[10px] text-luxury-gold font-bold uppercase tracking-wider">{user?.role}</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Connected" />
        </div>

        {/* Navigation List grouped */}
        <nav className="space-y-4 text-xs">
          {navGroups.map((group, idx) => {
            const allowedItems = group.items.filter((item) => !user || item.roles.includes(user.role));
            if (allowedItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {group.groupName && (
                  <div className="text-[9px] font-bold tracking-widest text-luxury-gold/60 uppercase px-3 py-1">
                    {group.groupName}
                  </div>
                )}
                {allowedItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        active
                          ? 'bg-luxury-gold text-luxury-charcoal font-bold shadow-luxury'
                          : 'text-luxury-ivory/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
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
          <Globe className="w-4 h-4" /> Exit Portal (Website)
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
