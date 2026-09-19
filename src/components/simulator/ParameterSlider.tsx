import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { Sliders, RefreshCw } from 'lucide-react';

export const ParameterSlider: React.FC = () => {
  const [fontHeightMm, setFontHeightMm] = useState<number>(3.1);
  const [packWeightG, setPackWeightG] = useState<number>(250);

  // Statutory requirement logic (Legal Metrology Rule 9):
  // For 200g - 500g packages: minimum numeral height is 4.0 mm
  // For < 200g: 2.0 mm
  // For > 500g to 1kg: 6.0 mm
  const getRequiredHeight = (weight: number) => {
    if (weight <= 200) return 2.0;
    if (weight <= 500) return 4.0;
    return 6.0;
  };

  const requiredHeight = getRequiredHeight(packWeightG);

  const getEvaluationResult = (height: number, required: number) => {
    if (height >= required) {
      return {
        status: 'GOOD',
        label: 'PASS',
        message: `Numeral height of ${height.toFixed(1)} mm satisfies the statutory minimum of ${required.toFixed(1)} mm for ${packWeightG}g packages.`,
      };
    } else if (height >= required - 0.2) {
      return {
        status: 'REVIEW',
        label: 'REVIEW',
        message: `Numeral height of ${height.toFixed(1)} mm is borderline (${(required - height).toFixed(1)} mm below requirement). Flexographic ink dot gain may cause borderline failure.`,
      };
    } else {
      return {
        status: 'ISSUE',
        label: 'ISSUE',
        message: `Numeral height of ${height.toFixed(1)} mm violates Legal Metrology Rule 9(1). Minimum required is ${required.toFixed(1)} mm.`,
      };
    }
  };

  const evaluation = getEvaluationResult(fontHeightMm, requiredHeight);

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} style={{ color: 'var(--brand-primary)' }} />
            <span>Interactive Parameter Rule Evaluator</span>
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Simulate pre-print layout adjustments to predict compliance outcomes before generating new print plates.
          </p>
        </div>

        <button 
          onClick={() => { setFontHeightMm(4.0); setPackWeightG(250); }}
          className="btn btn-ghost btn-sm"
          style={{ gap: '0.25rem', fontSize: '0.75rem' }}
        >
          <RefreshCw size={12} /> Reset to Compliant Baseline
        </button>
      </div>

      {/* 3 Step Interactive Flow: Input -> Evaluation -> Result */}
      <div className="grid-3" style={{ gap: '1.25rem', alignItems: 'stretch' }}>
        
        {/* Step 1: Input Parameters */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</span>
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Input Parameters</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Font Height Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>Numeral Height:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                  {fontHeightMm.toFixed(1)} mm
                </span>
              </div>
              <input
                type="range"
                min="2.0"
                max="6.0"
                step="0.1"
                value={fontHeightMm}
                onChange={(e) => setFontHeightMm(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>2.0 mm</span>
                <span>3.5 mm</span>
                <span>4.0 mm</span>
                <span>6.0 mm</span>
              </div>
            </div>

            {/* Package Weight Tier */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>Pack Net Quantity:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {packWeightG} g
                </span>
              </div>
              <select
                value={packWeightG}
                onChange={(e) => setPackWeightG(parseInt(e.target.value))}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              >
                <option value={150}>150 g (Threshold: 2.0 mm)</option>
                <option value={250}>250 g (Threshold: 4.0 mm)</option>
                <option value={500}>500 g (Threshold: 4.0 mm)</option>
                <option value={1000}>1000 g / 1 kg (Threshold: 6.0 mm)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Evaluation Engine */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--brand-secondary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</span>
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Evaluation Logic</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Statutory Rule</span>
              <p style={{ fontWeight: 600, marginTop: '2px' }}>Legal Metrology Rule 9(1)</p>
            </div>

            <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Required Minimum</span>
              <p style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                &gt;= {requiredHeight.toFixed(1)} mm
              </p>
            </div>

            <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Difference</span>
              <p style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: fontHeightMm >= requiredHeight ? 'var(--status-good-text)' : 'var(--status-issue-text)', marginTop: '2px' }}>
                {(fontHeightMm - requiredHeight) >= 0 ? `+${(fontHeightMm - requiredHeight).toFixed(1)} mm (OK)` : `${(fontHeightMm - requiredHeight).toFixed(1)} mm (Deficit)`}
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Predicted Result */}
        <div 
          className="card" 
          style={{ 
            padding: '1.25rem', 
            backgroundColor: evaluation.status === 'GOOD' ? 'var(--status-good-bg)' : evaluation.status === 'REVIEW' ? 'var(--status-review-bg)' : 'var(--status-issue-bg)',
            border: `1px solid ${evaluation.status === 'GOOD' ? 'var(--status-good-border)' : evaluation.status === 'REVIEW' ? 'var(--status-review-border)' : 'var(--status-issue-border)'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>3</span>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Result Outcome</h4>
              </div>
              <StatusBadge status={evaluation.status} label={evaluation.label} />
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4, marginTop: '0.5rem' }}>
              {evaluation.message}
            </p>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.08)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Phase 1 Interactive Matrix Calculation</span>
          </div>
        </div>

      </div>

      {/* Simulator Disclaimer */}
      <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <strong>Note:</strong> What-If calculations demonstrate the Phase 1 UI/interaction model. Deterministic multi-tier rule evaluation will connect to the core rule engine in Phase 3.
      </div>
    </div>
  );
};
