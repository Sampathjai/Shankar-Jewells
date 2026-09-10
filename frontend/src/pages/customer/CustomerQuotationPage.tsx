import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApi } from '../../api/client';
import { CheckCircle2, Download, MessageCircle, ShieldCheck, FileText, AlertCircle } from 'lucide-react';

export const CustomerQuotationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    async function loadQuotation() {
      try {
        setLoading(true);
        const res = await fetchApi<{ data: any }>(`/quotations/token/${token}`);
        setData(res.data);
        if (res.data.status === 'ACCEPTED') setAccepted(true);
      } catch (err) {
        console.error('Failed to load quotation:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuotation();
  }, [token]);

  const handleAccept = async () => {
    try {
      setAccepting(true);
      await fetchApi(`/quotations/token/${token}/accept`, { method: 'POST' });
      setAccepted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to accept quotation.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-luxury-gray">Loading custom quotation estimate...</p>
      </div>
    );
  }

  const ver = data.latestVersion;
  const customReq = data.customRequest;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header Banner */}
      <div className="bg-luxury-charcoal text-luxury-ivory rounded-2xl p-6 sm:p-10 border border-luxury-gold/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div>
          <span className="text-xs text-luxury-gold font-semibold uppercase tracking-widest block">
            Official Custom Jewellery Estimate
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
            Quotation {data.quotationNumber} (v{ver.versionNumber})
          </h1>
          <p className="text-xs text-luxury-ivory/70 mt-1">
            Valid Until: {new Date(data.validUntil).toLocaleDateString('en-IN')}
          </p>
        </div>

        <a
          href={`/api/quotations/${data.quotationNumber}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2.5 rounded-full bg-white/10 text-luxury-gold border border-luxury-gold/40 text-xs font-semibold uppercase tracking-wider hover:bg-luxury-gold hover:text-white transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download Official PDF
        </a>
      </div>

      {/* Customer Inspiration Image & Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {customReq?.images[0] && (
          <div className="bg-white rounded-2xl p-4 border border-luxury-border shadow-card space-y-2">
            <span className="text-xs font-semibold text-luxury-gold uppercase tracking-wider block">
              Reference Design Inspiration
            </span>
            <img
              src={customReq.images[0].url}
              alt="Reference Design"
              className="w-full h-80 object-cover rounded-xl border border-luxury-border"
            />
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-6">
          <h3 className="font-serif text-xl font-bold text-luxury-charcoal border-b border-luxury-border pb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-luxury-gold" /> Estimated Weight & Costs
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-luxury-gray">
              <span>Metal & Purity:</span>
              <strong className="text-luxury-charcoal">{ver.purity} ({ver.metalType})</strong>
            </div>
            <div className="flex justify-between text-luxury-gray">
              <span>Applied Metal Rate:</span>
              <strong className="text-luxury-charcoal">₹{ver.metalRate}/g</strong>
            </div>
            <div className="flex justify-between text-luxury-gray">
              <span>Estimated Net Weight:</span>
              <strong className="text-luxury-charcoal">{ver.netWeight} grams</strong>
            </div>
            <div className="flex justify-between text-luxury-gray">
              <span>Estimated Gross Weight:</span>
              <strong className="text-luxury-charcoal">{ver.grossWeight} grams</strong>
            </div>
            <div className="flex justify-between text-luxury-gray">
              <span>Craftsmanship / Making:</span>
              <strong className="text-luxury-charcoal">₹{ver.makingCharges.toLocaleString('en-IN')}</strong>
            </div>
            {ver.stoneCharges > 0 && (
              <div className="flex justify-between text-luxury-gray">
                <span>Gemstones / Diamonds:</span>
                <strong className="text-luxury-charcoal">₹{ver.stoneCharges.toLocaleString('en-IN')}</strong>
              </div>
            )}
            <div className="flex justify-between text-luxury-gray">
              <span>GST (3%):</span>
              <strong className="text-luxury-charcoal">₹{ver.taxAmount.toLocaleString('en-IN')}</strong>
            </div>

            <div className="pt-3 border-t border-luxury-border flex justify-between items-baseline">
              <span className="font-serif text-lg font-bold text-luxury-charcoal">Estimated Total</span>
              <span className="font-serif text-3xl font-bold text-luxury-gold">
                ₹{ver.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Terms */}
          {ver.terms && (
            <div className="p-3 bg-luxury-beige/50 rounded-xl text-[11px] text-luxury-charcoal/80 space-y-1">
              <strong className="font-semibold block uppercase tracking-wider text-luxury-gold">Terms & Production Policy</strong>
              <p>{ver.terms}</p>
            </div>
          )}

          {/* Action CTAs */}
          {accepted ? (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Quotation Accepted! Production team has been notified.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full py-3.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury"
              >
                <CheckCircle2 className="w-4 h-4" /> {accepting ? 'Confirming...' : 'Accept Quotation & Confirm Design'}
              </button>
              <a
                href={`https://wa.me/919876543210?text=Hi%20Royal%20Jewels,%20I%20have%20a%20question%20regarding%20Quotation%20${data.quotationNumber}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-full border border-luxury-border text-luxury-charcoal font-semibold text-xs tracking-wider uppercase hover:bg-luxury-beige transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" /> Request Revision On WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

