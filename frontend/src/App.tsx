import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/layout/CartDrawer';
import { AdminSidebar } from './components/layout/AdminSidebar';

import { HomePage } from './pages/customer/HomePage';
import { ShopPage } from './pages/customer/ShopPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { CustomJewelleryPage } from './pages/customer/CustomJewelleryPage';
import { GoldRatePage } from './pages/customer/GoldRatePage';
import { GoldCalculatorPage } from './pages/customer/GoldCalculatorPage';
import { CustomerQuotationPage } from './pages/customer/CustomerQuotationPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderSuccessPage } from './pages/customer/OrderSuccessPage';
import { AccountPage } from './pages/customer/AccountPage';

import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminMetalRatesPage } from './pages/admin/AdminMetalRatesPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminCustomRequestsPage } from './pages/admin/AdminCustomRequestsPage';
import { AdminPOSBillingPage } from './pages/admin/AdminPOSBillingPage';
import { AdminInvoicesPage } from './pages/admin/AdminInvoicesPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Wholesale Modules
import { AdminWholesaleBillingPage } from './pages/admin/wholesale/AdminWholesaleBillingPage';
import { AdminWholesaleCustomersPage } from './pages/admin/wholesale/AdminWholesaleCustomersPage';
import { AdminWholesalePaymentsPage } from './pages/admin/wholesale/AdminWholesalePaymentsPage';
import { AdminWholesaleReceivablesPage } from './pages/admin/wholesale/AdminWholesaleReceivablesPage';
import { AdminWholesaleLedgerPage } from './pages/admin/wholesale/AdminWholesaleLedgerPage';

// User Management Module
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

import { ToastProvider } from './components/common/Toast';
import { Menu, Gem } from 'lucide-react';

const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <CartDrawer />
      <Footer />
    </div>
  );
};

const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-luxury-ivory text-luxury-charcoal admin-layout">
      <AdminSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header Bar */}
        <div className="lg:hidden bg-luxury-charcoal text-white p-3.5 flex items-center justify-between border-b border-luxury-gold/20 shrink-0">
          <div className="flex items-center gap-2 font-serif font-bold text-sm">
            <Gem className="w-4 h-4 text-luxury-gold" /> SHANKER JEWELLS ERP
          </div>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Independent Main Content Scroll Area */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden custom-admin-scrollbar admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
      <Routes>
        {/* Customer Routes */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/gold" element={<ShopPage />} />
          <Route path="/gold-jewellery" element={<ShopPage />} />
          <Route path="/silver" element={<ShopPage />} />
          <Route path="/silver-jewellery" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/custom-jewellery" element={<CustomJewelleryPage />} />
          <Route path="/gold-silver-rate" element={<GoldRatePage />} />
          <Route path="/gold-calculator" element={<GoldCalculatorPage />} />
          <Route path="/quotation/:token" element={<CustomerQuotationPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/account/*" element={<AccountPage />} />
        </Route>

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin Portal Protected Layout */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/metal-rates" element={<AdminMetalRatesPage />} />
          <Route path="/admin/inventory" element={<AdminInventoryPage />} />
          <Route path="/admin/custom-requests" element={<AdminCustomRequestsPage />} />
          <Route path="/admin/billing" element={<AdminPOSBillingPage />} />
          <Route path="/admin/invoices" element={<AdminInvoicesPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />

          {/* Wholesale B2B Routes */}
          <Route path="/admin/wholesale" element={<AdminWholesaleBillingPage />} />
          <Route path="/admin/wholesale/customers" element={<AdminWholesaleCustomersPage />} />
          <Route path="/admin/wholesale/payments" element={<AdminWholesalePaymentsPage />} />
          <Route path="/admin/wholesale/receivables" element={<AdminWholesaleReceivablesPage />} />
          <Route path="/admin/wholesale/ledger/:customerId" element={<AdminWholesaleLedgerPage />} />

          {/* Safe Fallback Redirect for Legacy Consignment Links */}
          <Route path="/admin/consignment/*" element={<Navigate to="/admin" replace />} />

          {/* User Management Route */}
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </Router>
  </ToastProvider>
  );
};

export default App;
