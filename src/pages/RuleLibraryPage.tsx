import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { COMPLIANCE_RULES } from '../data/mockData';
import { Search, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const RuleLibraryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredRules = COMPLIANCE_RULES.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.officialSource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || r.category.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <AppShell breadcrumbs={[{ label: 'Rule Library' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-sample">Compliance Knowledge Base</span>
              <span className="badge badge-neutral">Version 2026.1 Catalog</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Statutory Rule Library</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Transparent verification criteria, source citations, and pass/review/issue conditions for all automated pre-print checks.
            </p>
          </div>
        </div>

        {/* Search and Category Filter Bar */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search rule name, code, or statutory source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px', height: '38px', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ height: '38px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Statutory Categories</option>
              <option value="Legal Metrology">Legal Metrology Act</option>
              <option value="Food Safety">FSSAI Regulations</option>
            </select>
          </div>
        </div>

        {/* Rule Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredRules.map((rule) => (
            <div key={rule.id} className="card-tactile" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
              {/* Card Top */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', backgroundColor: 'var(--brand-primary-light)', padding: '2px 8px', borderRadius: '4px' }}>
                      {rule.code}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {rule.category}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                      {rule.severity}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{rule.name}</h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Official Source:</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {rule.officialSource} ({rule.sourceDate})
                  </span>
                </div>
              </div>

              {/* Applicability & Methodology Grid */}
              <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Applicability:
                  </strong>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {rule.applicability}
                  </p>
                </div>

                <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    How NIYAMORA Checks It:
                  </strong>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {rule.howWeCheck}
                  </p>
                </div>
              </div>

              {/* Explicit Pass, Review, and Issue Conditions */}
              <div className="grid-3" style={{ gap: '0.75rem', fontSize: '0.8125rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-good-bg)', border: '1px solid var(--status-good-border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--status-good-text)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <CheckCircle2 size={13} /> PASS CONDITION
                  </span>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}>{rule.passCondition}</p>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-review-bg)', border: '1px solid var(--status-review-border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--status-review-text)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <AlertTriangle size={13} /> REVIEW CONDITION
                  </span>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}>{rule.reviewCondition}</p>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-issue-bg)', border: '1px solid var(--status-issue-border)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--status-issue-text)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <XCircle size={13} /> ISSUE CONDITION
                  </span>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}>{rule.issueCondition}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rule Library Disclaimer */}
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <strong>Statutory Knowledge Base Notice:</strong> Displayed rule parameters are based on standard published provisions of the Legal Metrology (Packaged Commodities) Rules and FSSAI Packaging Regulations. Versioned deterministic evaluation models will be fully compiled in Phase 3.
        </div>

      </div>
    </AppShell>
  );
};
