import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { SAMPLE_PRODUCTS, SAMPLE_ACTIVITIES } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { PackagingVisual } from '../components/common/PackagingVisual';
import { 
  ShieldCheck, 
  History, 
  Lock, 
  Download
} from 'lucide-react';

export const PassportPage: React.FC = () => {
  const product = SAMPLE_PRODUCTS[0];

  return (
    <AppShell breadcrumbs={[{ label: 'Label Passport' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-sample">Product History Passport</span>
              <span className="badge badge-neutral">Immutable Audit Ledger</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>NIYAMORA Label Passport</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Complete chronological provenance, inspection verification log, and evidence repository for <strong>{product.name}</strong>
            </p>
          </div>

          <button onClick={() => alert('Exporting complete Label Passport Archive PDF...')} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Download size={15} />
            <span>Export Official Passport PDF</span>
          </button>
        </div>

        {/* Mandatory Statutory Notice Banner */}
        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--brand-primary-light)',
            borderLeft: '4px solid var(--brand-primary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <ShieldCheck size={22} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '0.95rem' }}>
              Statutory Transparency Statement
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginTop: '0.2rem', lineHeight: 1.5 }}>
              Label Passport is a NIYAMORA product history record and internal quality ledger. It is not a government certificate, does not represent statutory endorsement, and does not guarantee legal immunity from regulatory inspection authorities.
            </p>
          </div>
        </div>

        {/* Passport Ledger Header Card */}
        <div className="card-tactile" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ width: '90px', height: '90px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)' }}>
                <PackagingVisual type={product.type} variant="thumbnail" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                  {product.brand}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{product.name}</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  SKU: <strong>{product.sku}</strong> • Format: {product.type} • Net Qty: {product.netQuantity}
                </p>
              </div>
            </div>

            {/* Cryptographic Integrity Seal Placeholder */}
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', color: 'var(--brand-primary)', marginBottom: '0.25rem' }}>
                <Lock size={13} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Integrity Seal Valid</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                SHA256: 4f89ac32e7b10...d49a
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Last ledger sync: Today at 14:32</span>
            </div>
          </div>

          {/* 4 Key Passport Metrics */}
          <div className="grid-4" style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-default)', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Versions:</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2px' }}>3 Dielines (V01-V03)</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pre-Flight Audits:</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2px' }}>2 Screenings</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Human Review Sign-offs:</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2px' }}>1 Resolved</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest Audit Status:</span>
              <div style={{ marginTop: '2px' }}>
                <StatusBadge status="ISSUE" label="Action Required" size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Provenance Trail / Timeline */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Complete Lifecycle Provenance Log
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {SAMPLE_ACTIVITIES.map((act) => (
              <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <History size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{act.action}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.timestamp}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Triggered by <strong>{act.user}</strong> on artwork revision <strong>{act.version}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
};
