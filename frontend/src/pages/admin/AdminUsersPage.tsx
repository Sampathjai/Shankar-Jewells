import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api/client';
import {
  UserCheck,
  Plus,
  Search,
  Key,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'BILLING_STAFF',
    password: '',
  });

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchApi<{ success: boolean; data: User[] }>('/users');
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Permission denied or failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify(createFormData),
      });

      setIsCreateModalOpen(false);
      setCreateFormData({
        name: '',
        email: '',
        phone: '',
        role: 'BILLING_STAFF',
        password: '',
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await fetchApi(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !user.active }),
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    try {
      setSaving(true);
      await fetchApi(`/users/${resetModalUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });

      setResetModalUser(null);
      setNewPassword('');
      alert(`Password reset successfully for ${resetModalUser.email}`);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-gold/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-gold font-bold flex items-center gap-3">
            <UserCheck className="w-7 h-7 text-luxury-gold" />
            Super Admin User Management & Access Control
          </h1>
          <p className="text-xs text-luxury-ivory/60 mt-1">
            Strictly restricted to Super Admin • Configure staff roles, permissions & security credentials
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-semibold rounded-xl text-xs transition-all shadow-luxury"
        >
          <UserPlus className="w-4 h-4" /> Create Staff Account
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-luxury-charcoal/40 p-4 rounded-2xl border border-luxury-gold/20 backdrop-blur-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-luxury-ivory/40" />
          <input
            type="text"
            placeholder="Search by name, email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-luxury-charcoal/80 border border-luxury-gold/20 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold"
          />
        </div>

        <div className="text-xs text-luxury-ivory/60 font-semibold">
          System Users: <span className="text-white font-bold">{users.length}</span>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-16 text-xs text-luxury-ivory/60">
          Loading system user accounts...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
          {error}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-luxury-charcoal/30 rounded-2xl border border-luxury-gold/10 text-xs text-luxury-ivory/60">
          No user accounts found.
        </div>
      ) : (
        <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-luxury-ivory/80">
              <thead className="bg-luxury-charcoal text-luxury-gold uppercase text-[10px] font-bold tracking-wider border-b border-luxury-gold/20">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Assigned Role</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-gold/10">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-[10px] text-luxury-ivory/50 font-mono">{u.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : u.role === 'STORE_MANAGER'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/10 text-luxury-ivory'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-luxury-ivory/70 font-mono">{u.phone || '-'}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                          u.active
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                        }`}
                      >
                        {u.active ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Deactivated
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-luxury-ivory/50">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setResetModalUser(u)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-luxury-gold hover:text-luxury-charcoal text-luxury-gold text-[10px] font-bold transition-all border border-luxury-gold/30 flex items-center gap-1.5 ml-auto"
                      >
                        <Key className="w-3 h-3" /> Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Create Staff User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-luxury-charcoal border border-luxury-gold/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-luxury-gold/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-luxury-gold">
                Create Staff User Account
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-luxury-ivory/50 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="staff@shankarjewels.com"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">Assigned Role *</label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                  className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white"
                >
                  <option value="BILLING_STAFF">BILLING_STAFF (Retail POS)</option>
                  <option value="STORE_MANAGER">STORE_MANAGER (Store Operations)</option>
                  <option value="INVENTORY_STAFF">INVENTORY_STAFF (Vault & Catalogue)</option>
                  <option value="WHOLESALE_MANAGER">WHOLESALE_MANAGER (B2B Credit Sales)</option>
                  <option value="CONSIGNMENT_MANAGER">CONSIGNMENT_MANAGER (Bulk Placements)</option>
                  <option value="DESIGNER">DESIGNER (Custom Requests & Quotes)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-luxury-gold/20">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-luxury-ivory/70 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-semibold rounded-xl shadow-luxury"
                >
                  {saving ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-luxury-charcoal border border-luxury-gold/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-luxury-gold/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-luxury-gold">
                Reset User Password
              </h3>
              <button
                onClick={() => setResetModalUser(null)}
                className="text-luxury-ivory/50 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-luxury-ivory/80">
              Resetting password for <strong>{resetModalUser.name}</strong> ({resetModalUser.email})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new strong password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-luxury-charcoal/80 border border-luxury-gold/30 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-luxury-gold/20">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-luxury-ivory/70 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-semibold rounded-xl shadow-luxury"
                >
                  {saving ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;

