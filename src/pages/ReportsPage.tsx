import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { SAMPLE_REPORTS } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { Download, Search, FileText, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import type { ApiSuggestedDesign } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [suggestedDesigns, setSuggestedDesigns] = useState<ApiSuggestedDesign[]>([]);

  useEffect(() => {
    api.listSuggestedDesigns().then(setSuggestedDesigns).catch(() => []);
  }, []);

  const filteredReports = SAMPLE_REPORTS.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDownload = (reportTitle: string, reportType: string) => {
    if (reportType === 'Suggested Design' && suggestedDesigns.length > 0) {
      window.open(api.getSuggestedDesignPdfUrl(suggestedDesigns[0].id), '_blank');
    } else {
      alert(`Exporting official PDF report for: "${reportTitle}".`);
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: 'Reports' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-sample" style={{ marginBottom: '0.35rem' }}>Audit Documentation</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Pre-Print Compliance Reports & PDFs</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Download certified screening summaries, vector dieline guides, and comparison diff logs
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search reports by product or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px', height: '38px', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>Report Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ height: '38px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Report Types</option>
              <option value="Compliance Report">Compliance Report</option>
              <option value="Suggested Design">Suggested Design</option>
              <option value="Comparison Report">Comparison Report</option>
              <option value="Evidence Report">Evidence Report</option>
            </select>
          </div>
        </div>

        {/* Reports Table / Card List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredReports.map((report) => (
            <div key={report.id} className="card-tactile" style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{report.title}</h3>
                    <StatusBadge status={report.status} size="sm" />
                    {report.type === 'Suggested Design' && (
                      <span className="badge badge-sample" style={{ fontSize: '0.65rem' }}>
                        <Sparkles size={10} style={{ marginRight: '2px' }} /> PDF Generator Available
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {report.productName} • Version: <strong>{report.version}</strong> • Generated on {report.date}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {report.format} ({report.fileSize})
                </span>
                <button onClick={() => handleDownload(report.title, report.type)} className="btn btn-primary btn-sm" style={{ gap: '0.35rem' }}>
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Reports Disclaimer */}
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <strong>Statutory Disclaimer:</strong> NIYAMORA compliance reports and suggested design PDFs are pre-press review artifacts. They do not constitute official statutory certifications or government authorizations.
        </div>

      </div>
    </AppShell>
  );
};
