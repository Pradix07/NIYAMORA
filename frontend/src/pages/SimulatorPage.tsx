import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ParameterSlider } from '../components/simulator/ParameterSlider';
import { BookOpen, ShieldCheck } from 'lucide-react';

export const SimulatorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId') || 'default';

  return (
    <AppShell breadcrumbs={[{ label: 'What-If Simulator' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-sample">Pre-Flight Simulation Engine</span>
            <span className="badge badge-good">
              <ShieldCheck size={12} style={{ marginRight: '3px' }} /> Deterministic Rule Evaluation
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>What-If Packaging Rule Simulator</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Test hypothetical parameter adjustments before modifying master artwork dielines to verify statutory threshold outcomes.
          </p>
        </div>

        {/* Interactive Parameter Slider Component */}
        <ParameterSlider productId={productId} />

        {/* Statutory Regulatory Guide & Reference Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} style={{ color: 'var(--brand-primary)' }} />
            <span>Legal Metrology Schedule-II Character Sizing Matrix</span>
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Minimum numeral and letter heights are governed by the Principal Display Panel (PDP) surface area and package quantity tier under Legal Metrology (Packaged Commodities) Rules, 2011 (Schedule-II & Rule 9).
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.625rem 0.75rem' }}>Principal Display Panel Area (A)</th>
                  <th style={{ padding: '0.625rem 0.75rem' }}>Quantity Tier Guide</th>
                  <th style={{ padding: '0.625rem 0.75rem' }}>Min Numeral Height (mm)</th>
                  <th style={{ padding: '0.625rem 0.75rem' }}>Min Letter Height (mm)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>A &le; 50 cm²</td>
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-secondary)' }}>Up to 50 g / ml</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>1.0 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>1.0 mm</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>50 &lt; A &le; 100 cm²</td>
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-secondary)' }}>50 g to 200 g / ml</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>2.0 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>1.5 mm</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--brand-primary-light)' }}>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>100 &lt; A &le; 500 cm²</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>200 g to 500 g / ml</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>4.0 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>2.0 mm</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>A &gt; 500 cm²</td>
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-secondary)' }}>Above 500 g / 1 kg</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>6.0 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>3.0 mm</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
};
