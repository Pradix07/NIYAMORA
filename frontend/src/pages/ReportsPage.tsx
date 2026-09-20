import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { StatusBadge } from '../components/common/StatusBadge';
import { Download, Search, FileText, Sparkles, Loader2, AlertCircle, FileCheck } from 'lucide-react';
import { api, type ApiSuggestedDesign, type ApiInspection } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [suggestedDesigns, setSuggestedDesigns] = useState<ApiSuggestedDesign[]>([]);
  const [inspections, setInspections] = useState<ApiInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReportsData() {
      try {
        setLoading(true);
        setError(null);
        const [designs, insps] = await Promise.all([
          api.listSuggestedDesigns().catch(() => []),
          api.getInspections().catch(() => []),
        ]);
        setSuggestedDesigns(designs);
        setInspections(insps);
      } catch (err: any) {
        setError(err.message || 'Failed to load reports from backend.');
      } finally {
        setLoading(false);
      }
    }
    loadReportsData();
  }, []);

  const handleDownloadSuggestedDesignPdf = (designId: string) => {
    window.open(api.getSuggestedDesignPdfUrl(designId), '_blank');
  };

  const filteredDesigns = suggestedDesigns.filter((d) => {
    const matchesSearch = d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.target_version_label || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || typeFilter === 'Suggested Design';
    return matchesSearch && matchesType;
  });

  return (
    <AppShell breadcrumbs={[{ label: 'Reports' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-primary">Audit Documentation</span>
              <span className="badge badge-neutral">Pre-Print Records</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>NIYAMURA Compliance Reports & PDFs</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Export and download statutory review summaries, suggested design comparison reports, and audit logs.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--status-issue-bg)', borderLeft: '4px solid var(--status-issue-solid)', color: 'var(--status-issue-text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search reports by ID or version label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '38px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>Report Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="select"
            >
              <option value="ALL">All Report Types</option>
              <option value="Suggested Design">Suggested Design Report</option>
              <option value="Compliance Report">Compliance Review Report</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Loading generated compliance reports from database...</p>
          </div>
        ) : filteredDesigns.length === 0 && inspections.length === 0 ? (
          <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <FileText size={42} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No reports generated yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0.25rem auto 0 auto' }}>
              Run an artwork inspection and generate a suggested design in "Improve Design" to export PDF compliance reports.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Suggested Design PDF Reports */}
            {filteredDesigns.map((design) => (
              <div key={design.id} className="card-tactile" style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>NIYAMURA Suggested Design Report ({design.target_version_label || 'V02'})</h3>
                      <span className={`badge ${design.verification_status === 'VERIFIED' ? 'badge-good' : 'badge-review'}`}>
                        {design.verification_status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Design ID: #{design.id.slice(0, 8)} • Changes Applied: {design.change_count} • Generated on {new Date(design.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadSuggestedDesignPdf(design.id)}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  <Download size={14} />
                  <span>Download PDF Report</span>
                </button>
              </div>
            ))}

            {/* Inspection Review Logs */}
            {inspections.map((insp) => (
              <div key={insp.id} className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Inspection Audit #{insp.id.slice(0, 8)}</h3>
                      <span className="badge badge-neutral">{insp.version_label}</span>
                      <StatusBadge status={insp.status === 'COMPLETED' ? 'GOOD' : 'REVIEW'} size="sm" />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {insp.product_name} • Findings: {insp.findings_summary?.pass_count || 0} PASS, {insp.findings_summary?.issue_count || 0} ISSUE, {insp.findings_summary?.review_count || 0} REVIEW
                    </p>
                  </div>
                </div>

                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {new Date(insp.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppShell>
  );
};
