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
  return (
    <div className="min-h-screen flex bg-luxury-ivory text-luxury-charcoal">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
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
  );
};

export default App;
