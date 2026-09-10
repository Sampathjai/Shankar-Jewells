import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../api/client';
import { ShieldAlert } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetchApi<{ data: any[] }>('/reports/audit-logs');
        setLogs(res.data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
          Security & Traceability
        </span>
        <h1 className="font-serif text-3xl font-bold text-luxury-charcoal">
          System Audit Log Trail
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-luxury-border shadow-card overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-luxury-border bg-luxury-beige/40 text-luxury-gold font-semibold uppercase">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">User Email</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxury-border/50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-luxury-beige/20">
                <td className="py-3 px-4 font-mono text-[11px]">
                  {new Date(log.createdAt).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 font-semibold">{log.userEmail || 'System / Guest'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-luxury-gold/20 text-luxury-gold font-bold">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4">{log.entity} ({log.entityId || 'N/A'})</td>
                <td className="py-3 px-4 font-mono text-[10px] text-luxury-gray">{log.ipAddress || '127.0.0.1'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

