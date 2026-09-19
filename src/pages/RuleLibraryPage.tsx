import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { COMPLIANCE_RULES } from '../data/mockData';
import { api } from '../services/api';
import type { ApiRule } from '../services/api';
import { Search, CheckCircle2, AlertTriangle, XCircle, BookOpen, ShieldCheck } from 'lucide-react';

export const RuleLibraryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [liveRules, setLiveRules] = useState<ApiRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRules()
      .then((data) => {
        if (data && data.length > 0) {
          setLiveRules(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch live rules from API, using catalog fallback:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasLiveRules = liveRules.length > 0;

  const filteredMockRules = COMPLIANCE_RULES.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.officialSource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || r.category.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const filteredLiveRules = liveRules.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rule_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());
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
              <span className="badge badge-good" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> Verified DCA Rule Catalog
              </span>
              <span className="badge badge-neutral">Legal Metrology Rules, 2011 & Gazette Amendments</span>
              {loading && <span className="badge badge-neutral">Syncing live catalog...</span>}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Statutory Rule Library</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Transparent verification criteria, official Department of Consumer Affairs (DCA) citations, and deterministic pass/review/issue conditions.
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
              <option value="Legal Metrology">Legal Metrology Act, 2009 & Rules</option>
            </select>
          </div>
        </div>

        {/* Rule Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {hasLiveRules ? (
            /* Live Verified Rules from Database Catalog */
            filteredLiveRules.map((rule) => {
              const activeVer = rule.versions && rule.versions.length > 0 ? rule.versions[0] : null;
              return (
                <div key={rule.id} className="card-tactile" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', backgroundColor: 'var(--brand-primary-light)', padding: '2px 8px', borderRadius: '4px' }}>
                          {rule.rule_code}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {rule.category}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                          Severity: {rule.severity}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{rule.title}</h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Official Legal Source:</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {activeVer?.source_reference || 'Rule 6(1) LMPC Rules'}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {rule.description}
                  </p>

                  {activeVer && (
                    <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
                        <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                          Statutory Requirement:
                        </strong>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                          {activeVer.requirement_text}
                        </p>
                      </div>

                      <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
                        <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                          Applicability & Effective Period:
                        </strong>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {activeVer.applicability} (Effective from: {activeVer.effective_from})
                        </p>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BookOpen size={12} /> {activeVer?.source_url || 'https://consumeraffairs.gov.in/pages/legal-metrology-act'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>Evaluation Engine: {activeVer?.evaluation_type || 'DETERMINISTIC_FIELD'}</span>
                  </div>
                </div>
              );
            })
          ) : (
            /* Mock Catalog Fallback */
            filteredMockRules.map((rule) => (
              <div key={rule.id} className="card-tactile" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
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
            ))
          )}
        </div>

        {/* Rule Library Disclaimer */}
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <strong>Statutory Knowledge Base Notice:</strong> Displayed rule parameters are based on standard published provisions of the Legal Metrology (Packaged Commodities) Rules, 2011 and Gazette Amendments from the Department of Consumer Affairs, Government of India.
        </div>

      </div>
    </AppShell>
  );
};
