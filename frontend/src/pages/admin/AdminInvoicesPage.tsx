import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../api/client';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';

export const AdminInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoices() {
      try {
        setLoading(true);
        const res = await fetchApi<{ data: any[] }>('/billing/invoices');
        setInvoices(res.data);
      } catch (err) {
        console.error('Failed to load invoices:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
          Financial Records
        </span>
        <h1 className="font-serif text-3xl font-bold text-luxury-charcoal">
          Tax Invoices & Billing Archive
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-luxury-border shadow-card overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-luxury-border bg-luxury-beige/40 text-luxury-gold font-semibold uppercase">
              <th className="py-3 px-4">Invoice Serial</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Tax (3% GST)</th>
              <th className="py-3 px-4">Grand Total</th>
              <th className="py-3 px-4">PDF Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxury-border/50">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-luxury-beige/20">
                <td className="py-3 px-4 font-mono font-bold text-luxury-charcoal">
                  {inv.invoiceNumber}
                </td>
                <td className="py-3 px-4 font-mono text-[11px]">
                  {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="py-3 px-4 font-semibold">{inv.customer?.name || 'Walk-in Customer'}</td>
                <td className="py-3 px-4">₹{inv.tax.toLocaleString('en-IN')}</td>
                <td className="py-3 px-4 font-serif text-base font-bold text-luxury-gold">
                  ₹{inv.grandTotal.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4">
                  <a
                    href={`/api/billing/invoices/${inv.invoiceNumber}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-full border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-white transition-all inline-block"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

