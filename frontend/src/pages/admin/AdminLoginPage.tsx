import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchApi } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { Gem, Lock, AlertCircle } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@shankerjewels.com');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const performLogin = async (loginEmail: string, loginPass: string) => {
    const trimmedEmail = loginEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter a valid staff email address.');
      return;
    }
    if (!loginPass) {
      setError('Please enter your staff password.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetchApi<{ success: boolean; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: trimmedEmail, password: loginPass }),
      });

      setAuth(res.user, res.token);
      
      // Fetch authenticated user profile to verify session persistence
      const meRes = await fetchApi<{ success: boolean; user: any }>('/auth/me');
      if (meRes.user) {
        setAuth(meRes.user, res.token);
      }

      navigate(res.user.role === 'CUSTOMER' ? '/account' : '/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password);
  };

  const isDevelopment = (import.meta as any).env?.DEV || process.env.NODE_ENV !== 'production';

  const quickRoles = [
    { label: 'Super Admin', email: 'admin@shankerjewels.com' },
    { label: 'Store Manager', email: 'manager@shankerjewels.com' },
    { label: 'Billing Desk', email: 'billing@shankerjewels.com' },
    { label: 'Vault Specialist', email: 'inventory@shankerjewels.com' },
    { label: 'Master Designer', email: 'designer@shankerjewels.com' },
  ];

  return (
    <div className="min-h-screen bg-luxury-charcoal text-luxury-ivory flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white text-luxury-charcoal rounded-2xl p-8 shadow-2xl border border-luxury-gold/30 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-luxury-gold text-white flex items-center justify-center mx-auto shadow-luxury">
            <Gem className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-luxury-charcoal tracking-wide">SHANKER JEWELLS</h1>
          <p className="text-xs text-luxury-gold font-semibold uppercase tracking-widest">
            Staff ERP, Vault & POS Portal
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold text-center border border-red-200 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-luxury-charcoal">Staff Email Address</label>
            <input
              type="email"
              required
              placeholder="admin@shankerjewels.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-luxury-border focus:ring-1 focus:ring-luxury-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-luxury-charcoal">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-luxury-border focus:ring-1 focus:ring-luxury-gold focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all shadow-luxury flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" /> {loading ? 'Authenticating...' : 'Sign In To Portal'}
          </button>
        </form>

        {/* Development Quick Role Selector Shortcuts */}
        {isDevelopment && (
          <div className="pt-4 border-t border-luxury-border space-y-2">
            <span className="text-[10px] text-luxury-gold font-bold uppercase tracking-wider block text-center">
              Development Staff Quick Login:
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {quickRoles.map((r) => (
                <button
                  key={r.email}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setEmail(r.email);
                    setPassword('Admin@123456');
                    performLogin(r.email, 'Admin@123456');
                  }}
                  className="px-2.5 py-1 rounded bg-luxury-beige hover:bg-luxury-gold hover:text-white text-[10px] font-semibold text-luxury-charcoal transition-colors border border-luxury-gold/30 disabled:opacity-50"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
