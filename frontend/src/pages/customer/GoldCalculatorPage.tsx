import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api/client';
import { Calculator, ShieldCheck, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const GoldCalculatorPage: React.FC = () => {
  const [metalType, setMetalType] = useState('GOLD');
  const [purity, setPurity] = useState('K22');
  const [netWeight, setNetWeight] = useState<number | string>(10);
  const [makingChargeType, setMakingChargeType] = useState('PER_GRAM');
  const [makingChargeValue, setMakingChargeValue] = useState<number | string>(400);
  const [wastageValue, setWastageValue] = useState<number | string>(3.5);
  const [stoneCharge, setStoneCharge] = useState<number | string>(0);
  const [includeGst, setIncludeGst] = useState(true);

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      setLoading(true);
      setError('');
      const res = await fetchApi<{ success: boolean; calculation?: any; data?: any }>('/pricing/calculate', {
        method: 'POST',
        body: JSON.stringify({
          metalType,
          purity,
          grossWeight: Number(netWeight) || 0,
          netWeight: Number(netWeight) || 0,
          makingChargeType,
          makingChargeValue: Number(makingChargeValue) || 0,
          wastageType: 'PERCENTAGE',
          wastageValue: Number(wastageValue) || 0,
          stoneCharge: Number(stoneCharge) || 0,
          gstRate: includeGst ? 3.0 : 0.0,
        }),
      });
      if (res.calculation || res.data) {
        setResult(res.calculation || res.data);
      } else {
        setError('Current metal rate is unavailable.');
      }
    } catch (err: any) {
      console.error('Calculation error:', err);
      setError(err.message || 'Unable to calculate price. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 pb-24 sm:pb-12">
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
          Interactive Valuation Engine
        </span>
        <h1 className="font-serif text-2xl sm:text-5xl font-bold text-luxury-charcoal">
          Gold & Silver Jewellery Price Calculator
        </h1>
        <p className="text-xs sm:text-sm text-luxury-gray max-w-xl mx-auto">
          Calculate instant price estimates based on real-time bullion rates, purities (22K, 18K, 80, 70), wastage, making charges, and optional 3% GST.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Input Form */}
        <form onSubmit={handleCalculate} className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-4 text-xs">
          <h3 className="font-serif text-base sm:text-lg font-bold text-luxury-charcoal uppercase tracking-wider border-b border-luxury-border pb-2 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-luxury-gold" /> Input Jewellery Details
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-luxury-charcoal mb-1">Metal</label>
                <select
                  value={metalType}
                  onChange={(e) => {
                    setMetalType(e.target.value);
                    if (e.target.value === 'SILVER') setPurity('SILVER_999');
                    else setPurity('K22');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-luxury-border bg-white font-medium focus:outline-none focus:border-luxury-gold min-h-[44px]"
                >
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-luxury-charcoal mb-1">Purity</label>
                <select
                  value={purity}
                  onChange={(e) => setPurity(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-luxury-border bg-white font-medium focus:outline-none focus:border-luxury-gold min-h-[44px]"
                >
                  {metalType === 'GOLD' ? (
                    <>
                      <option value="K22">22K Gold (91.6% BIS)</option>
                      <option value="K18">18K Gold (75.0%)</option>
                      <option value="80">80 Purity (80.0% Gold)</option>
                      <option value="70">70 Purity (70.0% Gold)</option>
                      <option value="K24">24K Pure Gold (99.9%)</option>
                      <option value="K14">14K Gold (58.5%)</option>
                    </>
                  ) : (
                    <>
                      <option value="SILVER_999">999 Fine Silver (99.9%)</option>
                      <option value="SILVER_925">925 Sterling Silver (92.5%)</option>
                      <option value="80">80 Silver Purity (80.0%)</option>
                      <option value="70">70 Silver Purity (70.0%)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-luxury-charcoal mb-1">Net Metal Weight (Grams) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={netWeight}
                onChange={(e) => setNetWeight(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border font-mono font-bold focus:outline-none focus:border-luxury-gold min-h-[44px]"
              />
            </div>

            <div>
              <label className="block font-bold text-luxury-charcoal mb-1">Wastage Allowance (%)</label>
              <input
                type="number"
                step="0.1"
                value={wastageValue}
                onChange={(e) => setWastageValue(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border font-mono font-bold focus:outline-none focus:border-luxury-gold min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-luxury-charcoal mb-1">Making Charge Type</label>
                <select
                  value={makingChargeType}
                  onChange={(e) => setMakingChargeType(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-luxury-border bg-white font-medium focus:outline-none focus:border-luxury-gold min-h-[44px]"
                >
                  <option value="PER_GRAM">Per Gram (₹)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-luxury-charcoal mb-1">Making Value</label>
                <input
                  type="number"
                  value={makingChargeValue}
                  onChange={(e) => setMakingChargeValue(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-luxury-border font-mono font-bold focus:outline-none focus:border-luxury-gold min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-luxury-charcoal mb-1">Gemstone / Diamond Value (₹)</label>
              <input
                type="number"
                value={stoneCharge}
                onChange={(e) => setStoneCharge(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-luxury-border font-mono font-bold focus:outline-none focus:border-luxury-gold min-h-[44px]"
              />
            </div>

            {/* Optional GST Toggle */}
            <div className="pt-3 flex items-center justify-between border-t border-luxury-border">
              <span className="font-bold text-luxury-charcoal">GST Tax Status</span>
              <button
                type="button"
                onClick={() => setIncludeGst(!includeGst)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-all shadow-sm ${
                  includeGst
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                GST {includeGst ? 'ON (3%)' : 'OFF (0%)'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-luxury-gold text-white font-bold text-xs uppercase tracking-wider hover:bg-luxury-gold/90 transition-all flex items-center justify-center gap-2 shadow-sm min-h-[48px]"
          >
            <Calculator className="w-4 h-4" /> {loading ? 'Calculating...' : 'Calculate Price'}
          </button>
        </form>

        {/* Right Column: Dynamic Results Display */}
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {result ? (
            <div className="bg-luxury-charcoal text-luxury-ivory rounded-2xl p-6 sm:p-8 border border-luxury-gold/30 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-luxury-gold/20 pb-3">
                <span className="text-xs text-luxury-gold font-bold uppercase tracking-widest block">
                  Valuation Breakdown
                </span>
                <span className="px-2.5 py-0.5 rounded bg-luxury-gold/20 text-luxury-gold text-[10px] font-bold uppercase">
                  {result.purity} {result.metalType}
                </span>
              </div>

              <div className="space-y-2.5 text-xs border-b border-luxury-gold/20 pb-4 font-mono">
                <div className="flex justify-between text-white/80">
                  <span>Applicable Metal Rate:</span>
                  <strong className="text-luxury-gold">{formatCurrency(result.metalRate)}/g</strong>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Raw Metal Value ({result.netWeight}g):</span>
                  <span>{formatCurrency(result.rawMetalValue)}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Wastage Allowance ({result.wastageGrams}g):</span>
                  <span>{formatCurrency(Math.round(result.wastageGrams * result.metalRate))}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Making Charges:</span>
                  <span>{formatCurrency(result.makingCharges)}</span>
                </div>
                {result.stoneCharge > 0 && (
                  <div className="flex justify-between text-white/80">
                    <span>Stones / Diamonds:</span>
                    <span>{formatCurrency(result.stoneCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/80">
                  <span>GST ({result.gstRate}%):</span>
                  <span>{result.gstAmount > 0 ? formatCurrency(result.gstAmount) : 'Excluded (0%)'}</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-luxury-ivory/70 uppercase tracking-widest block font-bold">
                  Estimated Total Price
                </span>
                <div className="font-serif text-3xl sm:text-5xl font-bold text-luxury-gold mt-1 font-mono">
                  {formatCurrency(result.finalPrice)}
                </div>
              </div>

              <div className="p-3 bg-white/10 rounded-xl text-[10px] text-luxury-ivory/80 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-luxury-gold mt-0.5" />
                <span>
                  Indicative valuation based on live market rate ({formatCurrency(result.metalRate)}/g) and specified parameters.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-luxury-border text-center text-luxury-gray space-y-3">
              <Calculator className="w-12 h-12 text-luxury-gold/50 mx-auto" />
              <h4 className="font-serif text-xl font-bold text-luxury-charcoal">Ready To Calculate</h4>
              <p className="text-xs max-w-xs mx-auto">
                Fill in the jewellery specifications on the left and tap <strong>Calculate Price</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoldCalculatorPage;
