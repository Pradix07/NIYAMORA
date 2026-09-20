import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { Sliders, RefreshCw, Calculator, DollarSign } from 'lucide-react';
import { api } from '../../services/api';
import type { ApiSimulationResponse } from '../../services/api';

interface ParameterSliderProps {
  productId?: string;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({ productId = 'p1' }) => {
  const [activeTab, setActiveTab] = useState<'NET_QTY' | 'USP'>('NET_QTY');
  
  // Net Qty simulation state
  const [fontHeightMm, setFontHeightMm] = useState<number>(3.1);
  const [packWeightG, setPackWeightG] = useState<number>(250);
  const [pdpAreaSqcm, setPdpAreaSqcm] = useState<number>(384);

  // USP simulation state
  const [mrpInput, setMrpInput] = useState<string>('299.00');
  const [pkgType, setPkgType] = useState<string>('WEIGHT');
  const [uspQuantity, setUspQuantity] = useState<number>(250);
  const [isLiquor, setIsLiquor] = useState<boolean>(false);
  const [declaredUsp, setDeclaredUsp] = useState<string>('');

  const [simResult, setSimResult] = useState<ApiSimulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsSimulating(true);

    const payload = activeTab === 'NET_QTY'
      ? {
          rule_code: 'LMPC-DECL-NET-QTY',
          font_height_mm: fontHeightMm,
          pack_weight_g: packWeightG,
          pdp_area_sqcm: pdpAreaSqcm,
        }
      : {
          rule_code: 'LMPC-DECL-USP',
          mrp: mrpInput,
          pack_weight_g: uspQuantity,
          packaging_type: pkgType,
          category: isLiquor ? 'Alcoholic Beverage' : 'General Commodity',
          unit_sale_price: declaredUsp || undefined,
        };

    api.simulateRule(productId, payload)
      .then((data) => {
        if (isMounted) setSimResult(data);
      })
      .catch((err) => {
        console.warn('Simulation API fallback:', err);
      })
      .finally(() => {
        if (isMounted) setIsSimulating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, fontHeightMm, packWeightG, pdpAreaSqcm, mrpInput, uspQuantity, pkgType, isLiquor, declaredUsp, productId]);

  const handleResetBaseline = () => {
    if (activeTab === 'NET_QTY') {
      setFontHeightMm(4.0);
      setPackWeightG(250);
      setPdpAreaSqcm(384);
    } else {
      setMrpInput('299.00');
      setPkgType('WEIGHT');
      setUspQuantity(250);
      setIsLiquor(false);
      setDeclaredUsp('₹1.20 / g');
    }
  };

  const getRequiredHeight = (pdp: number) => {
    if (pdp <= 50) return 1.0;
    if (pdp <= 100) return 2.0;
    if (pdp <= 500) return 4.0;
    return 6.0;
  };
  const requiredHeight = getRequiredHeight(pdpAreaSqcm);

  const verdict = simResult?.hypothetical_verdict || (fontHeightMm >= requiredHeight ? 'PASS' : fontHeightMm >= requiredHeight - 0.2 ? 'REVIEW' : 'ISSUE');
  const badgeStatus = verdict === 'PASS' ? 'GOOD' : verdict === 'ISSUE' ? 'ISSUE' : verdict === 'N/A' ? 'GOOD' : 'REVIEW';
  const explanation = simResult?.explanation || `Numeral height of ${fontHeightMm.toFixed(1)} mm evaluates to ${verdict} for PDP area of ${pdpAreaSqcm} cm².`;

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      {/* Tab Selector & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} style={{ color: 'var(--brand-primary)' }} />
            <span>Deterministic Packaging Rule Simulator</span>
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Simulate pre-press parameter adjustments to verify statutory compliance without modifying artwork records.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              onClick={() => setActiveTab('NET_QTY')}
              className={`btn btn-sm ${activeTab === 'NET_QTY' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <Calculator size={13} style={{ marginRight: '4px' }} /> Schedule-II Sizing Matrix
            </button>
            <button
              onClick={() => setActiveTab('USP')}
              className={`btn btn-sm ${activeTab === 'USP' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <DollarSign size={13} style={{ marginRight: '4px' }} /> Rule 6(11) Unit Sale Price
            </button>
          </div>

          <button 
            onClick={handleResetBaseline}
            disabled={isSimulating}
            className="btn btn-ghost btn-sm"
            style={{ gap: '0.25rem', fontSize: '0.75rem' }}
          >
            <RefreshCw size={12} className={isSimulating ? 'animate-spin' : ''} /> Reset Baseline
          </button>
        </div>
      </div>

      {/* 3 Step Interactive Flow: Input -> Evaluation -> Result */}
      <div className="grid-3" style={{ gap: '1.25rem', alignItems: 'stretch' }}>
        
        {/* Step 1: Input Parameters */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</span>
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Hypothetical Input Parameters</h4>
          </div>

          {activeTab === 'NET_QTY' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Font Height Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600 }}>Observed Numeral Height:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    {fontHeightMm.toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="7.0"
                  step="0.1"
                  value={fontHeightMm}
                  onChange={(e) => setFontHeightMm(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <span>1.0 mm</span>
                  <span>2.0 mm</span>
                  <span>4.0 mm</span>
                  <span>6.0 mm</span>
                </div>
              </div>

              {/* Principal Display Panel Area Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600 }}>Principal Display Panel (PDP) Area:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {pdpAreaSqcm} cm²
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="800"
                  step="10"
                  value={pdpAreaSqcm}
                  onChange={(e) => setPdpAreaSqcm(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <span>&le; 50 cm²</span>
                  <span>100 cm²</span>
                  <span>500 cm²</span>
                  <span>&gt; 500 cm²</span>
                </div>
              </div>

              {/* Package Weight Tier */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Pack Weight:</label>
                <select
                  value={packWeightG}
                  onChange={(e) => setPackWeightG(parseInt(e.target.value))}
                  style={{ width: '100%', fontSize: '0.8125rem', padding: '6px' }}
                >
                  <option value={45}>45 g (Small Pack)</option>
                  <option value={150}>150 g (Medium Pack)</option>
                  <option value={250}>250 g (Standard Pack)</option>
                  <option value={500}>500 g (Family Pack)</option>
                  <option value={1000}>1000 g / 1 kg (Bulk Pack)</option>
                </select>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>MRP (₹):</label>
                <input
                  type="text"
                  value={mrpInput}
                  onChange={(e) => setMrpInput(e.target.value)}
                  placeholder="299.00"
                  style={{ width: '100%', fontSize: '0.8125rem', padding: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Measure Type:</label>
                <select
                  value={pkgType}
                  onChange={(e) => setPkgType(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8125rem', padding: '6px' }}
                >
                  <option value="WEIGHT">Weight (g / kg)</option>
                  <option value="VOLUME">Volume (ml / L)</option>
                  <option value="LENGTH">Length (cm / m)</option>
                  <option value="COUNT">Count / Units (unit)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Quantity ({pkgType === 'WEIGHT' ? 'g' : pkgType === 'VOLUME' ? 'ml' : pkgType === 'LENGTH' ? 'cm' : 'units'}):
                </label>
                <input
                  type="number"
                  value={uspQuantity}
                  onChange={(e) => setUspQuantity(parseFloat(e.target.value) || 250)}
                  style={{ width: '100%', fontSize: '0.8125rem', padding: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="liquorCheck"
                  checked={isLiquor}
                  onChange={(e) => setIsLiquor(e.target.checked)}
                />
                <label htmlFor="liquorCheck" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Alcoholic Beverage (State Excise scope)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Evaluation Logic */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--brand-secondary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</span>
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Deterministic Rule Logic</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Statutory Authority</span>
              <p style={{ fontWeight: 600, marginTop: '2px' }}>
                {activeTab === 'NET_QTY' ? 'Schedule-II & Rule 9' : 'Rule 6(11) Unit Sale Price'}
              </p>
            </div>

            <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Statutory Requirement</span>
              <p style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                {activeTab === 'NET_QTY'
                  ? `>= ${requiredHeight.toFixed(1)} mm Numeral Height`
                  : isLiquor
                  ? 'State Excise Governed (N/A)'
                  : `₹${(parseFloat(mrpInput || '299') / Math.max(1, uspQuantity)).toFixed(2)} / ${pkgType === 'WEIGHT' ? (uspQuantity < 1000 ? 'g' : 'kg') : pkgType === 'VOLUME' ? (uspQuantity < 1000 ? 'ml' : 'L') : 'unit'}`}
              </p>
            </div>

            <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Formula / Derivation</span>
              <p style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: verdict === 'PASS' ? 'var(--status-good-text)' : 'var(--status-issue-text)', marginTop: '2px' }}>
                {simResult?.difference_label || (activeTab === 'NET_QTY' ? `${(fontHeightMm - requiredHeight) >= 0 ? `+${(fontHeightMm - requiredHeight).toFixed(1)} mm (Compliant)` : `${(fontHeightMm - requiredHeight).toFixed(1)} mm (Deficit)`}` : 'Derived')}
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Predicted Result */}
        <div 
          className="card" 
          style={{ 
            padding: '1.25rem', 
            backgroundColor: badgeStatus === 'GOOD' ? 'var(--status-good-bg)' : badgeStatus === 'REVIEW' ? 'var(--status-review-bg)' : 'var(--status-issue-bg)',
            border: `1px solid ${badgeStatus === 'GOOD' ? 'var(--status-good-border)' : badgeStatus === 'REVIEW' ? 'var(--status-review-border)' : 'var(--status-issue-border)'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>3</span>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Deterministic Verdict</h4>
              </div>
              <StatusBadge status={badgeStatus} label={verdict} />
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4, marginTop: '0.5rem' }}>
              {explanation}
            </p>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.08)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Deterministic engine evaluation • No generative AI hallucination</span>
          </div>
        </div>

      </div>

      {/* Statutory Matrix Reference */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Legal Metrology Schedule-II Character Sizing Matrix</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.75rem' }}>
          <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: pdpAreaSqcm <= 50 ? '1px solid var(--brand-primary)' : 'none' }}>
            <strong>PDP &le; 50 cm²:</strong> &ge; 1.0 mm numeral
          </div>
          <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: pdpAreaSqcm > 50 && pdpAreaSqcm <= 100 ? '1px solid var(--brand-primary)' : 'none' }}>
            <strong>50 &lt; PDP &le; 100 cm²:</strong> &ge; 2.0 mm numeral
          </div>
          <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: pdpAreaSqcm > 100 && pdpAreaSqcm <= 500 ? '1px solid var(--brand-primary)' : 'none' }}>
            <strong>100 &lt; PDP &le; 500 cm²:</strong> &ge; 4.0 mm numeral
          </div>
          <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: pdpAreaSqcm > 500 ? '1px solid var(--brand-primary)' : 'none' }}>
            <strong>PDP &gt; 500 cm²:</strong> &ge; 6.0 mm numeral
          </div>
        </div>
      </div>
    </div>
  );
};
