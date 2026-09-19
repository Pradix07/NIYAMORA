import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ParameterSlider } from '../components/simulator/ParameterSlider';
import { BookOpen } from 'lucide-react';

export const SimulatorPage: React.FC = () => {
  return (
    <AppShell breadcrumbs={[{ label: 'What-If Simulator' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-sample">Pre-Flight Simulation Engine</span>
            <span className="badge badge-neutral">Phase 1 Interactive Shell</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>What-If Packaging Rule Simulator</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Test parameter adjustments before modifying master artwork dielines to ensure statutory threshold compliance.
          </p>
        </div>

        {/* Interactive Parameter Slider Shell */}
        <ParameterSlider />

        {/* Statutory Regulatory Guide & Reference Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} style={{ color: 'var(--brand-primary)' }} />
            <span>Legal Metrology Rule 9 Millimeter Minimum Matrix</span>
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.625rem 0.75rem' }}>Net Quantity Tier (g/ml)</th>
                  <th style={{ padding: '0.625rem 0.75rem' }}>Min Numeral Height (mm)</th>
                  <th style={{ padding: '0.625rem 0.75rem' }}>Min Letter Height (mm)</th>
                  <th style={{ padding: '0.625rem 0.75rem' }}>PDP Area Threshold</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Up to 50 g / ml</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>1.0 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>1.0 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-secondary)' }}>&lt; 50 cm²</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>50 g to 200 g / ml</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>2.0 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>1.5 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-secondary)' }}>50 - 100 cm²</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--brand-primary-light)' }}>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>200 g to 500 g / ml (Current Target)</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>4.0 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>2.0 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>100 - 500 cm²</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>500 g to 1 kg / Above 1 kg</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>6.0 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>3.0 mm</td>
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-secondary)' }}>&gt; 500 cm²</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
};
