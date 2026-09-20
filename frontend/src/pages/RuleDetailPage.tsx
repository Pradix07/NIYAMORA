import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { ApiRule } from '../services/api';
import { COMPLIANCE_RULES } from '../data/mockData';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  Calendar,
  Layers,
  FileText,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { NiyamuraLogo } from '../components/common/NiyamuraLogo';
import { ThemeSwitch } from '../components/common/ThemeSwitch';
import { useAuth } from '../context/AuthContext';

export const RuleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rule, setRule] = useState<ApiRule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    api.getRule(id)
      .then((data) => {
        if (data) {
          setRule(data);
        }
      })
      .catch((err) => {
        console.warn('Live rule fetch failed, checking static catalog:', err);
        // Fallback to static catalog if live fetch fails or offline
        const fallback = COMPLIANCE_RULES.find(
          (r) => r.code.toLowerCase() === id.toLowerCase() || r.id.toLowerCase() === id.toLowerCase()
        );
        if (fallback) {
          setRule({
            id: fallback.id,
            domain: 'LEGAL_METROLOGY_PACKAGED_COMMODITIES',
            rule_code: fallback.code,
            title: fallback.name,
            category: fallback.category,
            severity: fallback.severity,
            description: fallback.applicability,
            is_active: true,
            versions: [
              {
                id: `${fallback.id}_v1`,
                rule_id: fallback.id,
                rule_code: fallback.code,
                version_number: 1,
                title: fallback.name,
                requirement_text: fallback.howWeCheck,
                source_id: 'SRC-DCA-LMPC',
                source_reference: fallback.officialSource,
                source_url: 'https://consumeraffairs.gov.in/pages/legal-metrology-act',
                effective_from: fallback.sourceDate,
                applicability: fallback.applicability,
                evaluation_type: 'DETERMINISTIC_FIELD',
                parameters: {
                  passCondition: fallback.passCondition,
                  issueCondition: fallback.issueCondition,
                  reviewCondition: fallback.reviewCondition,
                  evidenceRequired: fallback.evidenceRequired,
                },
                status: 'ACTIVE',
              },
            ],
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const activeVersion = rule?.versions && rule.versions.length > 0 ? rule.versions[0] : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Public Header */}
      <header
        style={{
          height: '64px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <NiyamuraLogo variant="full" size="md" to="/" />
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link to="/rules" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={15} /> Rule Library
            </Link>
            <Link to="/resources" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Resources
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeSwitch size="sm" />
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Create Account
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Navigation Breadcrumb / Back Button */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate('/rules')}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Rule Library</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <Link to="/rules" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Rule Library</Link>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{rule?.rule_code || id}</span>
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>Loading statutory rule details...</p>
          </div>
        ) : !rule ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Rule Not Found</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              The requested statutory rule could not be found in the catalog.
            </p>
            <Link to="/rules" className="btn btn-primary">
              Return to Rule Library
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Rule Header Card */}
            <div className="card-tactile" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    color: 'var(--brand-primary)',
                    backgroundColor: 'var(--brand-primary-light)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}
                >
                  {rule.rule_code}
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                  {rule.category}
                </span>
                <span className="badge badge-good" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                  <ShieldCheck size={13} /> Verified Statutory Standard
                </span>
              </div>

              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {rule.title}
              </h1>

              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {rule.description || activeVersion?.requirement_text}
              </p>

              <div className="grid-2" style={{ gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-default)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Official Legal Source
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {activeVersion?.source_reference || 'Legal Metrology (Packaged Commodities) Rules, 2011'}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Issuing Authority & Portal
                  </span>
                  <a
                    href={activeVersion?.source_url || 'https://consumeraffairs.gov.in/pages/legal-metrology-act'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.875rem', color: 'var(--brand-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Department of Consumer Affairs (DCA)</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>

            {/* Scope & Verification Method */}
            <div className="grid-2" style={{ gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Layers size={18} style={{ color: 'var(--brand-primary)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Applicability & Scope</h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {activeVersion?.applicability || rule.description || 'Applies to pre-packaged commodities manufactured, packed, imported, or distributed for retail sale.'}
                </p>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>How NIYAMURA Checks It</h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {activeVersion?.requirement_text || 'Extracts declared text coordinates, validates against statutory patterns and calculates compliance threshold deterministically.'}
                </p>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <strong>Evaluation Engine:</strong> {activeVersion?.evaluation_type || 'DETERMINISTIC_FIELD'}
                </div>
              </div>
            </div>

            {/* Deterministic Evaluation Conditions */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                Deterministic Evaluation Conditions
              </h3>

              <div className="grid-3" style={{ gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--status-good-bg)', border: '1px solid var(--status-good-border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--status-good-text)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                    <CheckCircle2 size={16} /> PASS CONDITION
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {activeVersion?.parameters?.passCondition || 'Declaration is present, legible, matches statutory format, and satisfies minimum dimensional and syntax requirements.'}
                  </p>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--status-review-bg)', border: '1px solid var(--status-review-border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--status-review-text)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                    <AlertTriangle size={16} /> REVIEW CONDITION
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {activeVersion?.parameters?.reviewCondition || 'Ambiguous declaration syntax, OCR low confidence score, or background contrast requiring human packaging specialist verification.'}
                  </p>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--status-issue-bg)', border: '1px solid var(--status-issue-border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--status-issue-text)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                    <XCircle size={16} /> ISSUE CONDITION
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {activeVersion?.parameters?.issueCondition || 'Mandatory declaration completely absent, misleading unit expression, or non-compliant statutory value detected.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Version History Table (if multiple versions exist) */}
            {rule.versions && rule.versions.length > 0 && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Calendar size={18} style={{ color: 'var(--brand-primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Statutory Version Timeline</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {rule.versions.map((ver) => (
                    <div
                      key={ver.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            Version {ver.version_number}: {ver.title}
                          </span>
                          <span
                            className={`badge ${
                              ver.status === 'ACTIVE'
                                ? 'badge-good'
                                : ver.status === 'FUTURE_EFFECTIVE'
                                ? 'badge-review'
                                : 'badge-neutral'
                            }`}
                            style={{ fontSize: '0.6875rem' }}
                          >
                            {ver.status}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Effective: {ver.effective_from}{ver.effective_to ? ` to ${ver.effective_to}` : ' (Current)'}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {ver.requirement_text}
                      </p>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <strong>Legal Source:</strong> {ver.source_reference}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <strong>Official Notice:</strong> Rule definitions and verification thresholds are sourced directly from published notifications of the Department of Consumer Affairs (DCA) and Food Safety and Standards Authority of India (FSSAI). NIYAMURA is an independent pre-print compliance platform and does not issue legal certificates.
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RuleDetailPage;
