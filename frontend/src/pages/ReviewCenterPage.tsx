import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import type { ReviewItem } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  Check, 
  XCircle, 
  RefreshCw, 
  MessageSquare, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { api, type ApiFinding } from '../services/api';

export const ReviewCenterPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeNoteModalItem, setActiveNoteModalItem] = useState<ReviewItem | null>(null);
  const [noteText, setNoteText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBackendReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const inspections = await api.getInspections();
      const liveReviewItems: ReviewItem[] = [];

      for (const insp of inspections.slice(0, 10)) {
        try {
          const findings = await api.getFindings(insp.id);
          findings.forEach((f: ApiFinding) => {
            liveReviewItems.push({
              id: f.id,
              findingId: f.id,
              productId: insp.product_id,
              productName: insp.product_name || 'Packaging Artwork',
              versionLabel: insp.version_label || 'V01',
              requirementName: `${f.rule_code}: ${f.title}`,
              category: f.severity === 'CRITICAL' ? 'Statutory Requirement' : 'Packaging Standard',
              status: f.status === 'REVIEWED' ? 'APPROVED_PASS' : 'PENDING',
              reasonForReview: f.summary,
              foundValue: f.observed_value || 'No valid evidence detected',
              confidence: 0.88,
              reviewedBy: undefined,
              reviewedAt: undefined,
              reviewerNotes: undefined,
            });
          });
        } catch (err) {
          console.warn('Could not load findings for inspection', insp.id, err);
        }
      }
      setReviews(liveReviewItems);
    } catch (err: any) {
      setError(err.message || 'Failed to load review items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackendReviews();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDecision = async (id: string, newStatus: ReviewItem['status'], statusLabel: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              reviewedBy: 'Specialist Auditor',
              reviewedAt: 'Just now',
            }
          : r
      )
    );

    try {
      await api.submitReview({
        finding_id: id,
        decision: newStatus,
        notes: `Recorded by specialist auditor: ${statusLabel}`,
      });
      showToast(`Decision recorded: ${statusLabel}`);
    } catch (err: any) {
      showToast(`Review decision saved locally (${err.message})`);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNoteModalItem) return;

    setReviews((prev) =>
      prev.map((r) =>
        r.id === activeNoteModalItem.id
          ? {
              ...r,
              reviewerNotes: noteText,
            }
          : r
      )
    );

    try {
      await api.submitReview({
        finding_id: activeNoteModalItem.id,
        decision: activeNoteModalItem.status,
        notes: noteText,
      });
      showToast('Review note persisted to audit trail.');
    } catch {
      showToast('Note saved to session.');
    }

    setActiveNoteModalItem(null);
    setNoteText('');
  };

  const pendingReviews = reviews.filter((r) => r.status === 'PENDING');
  const resolvedReviews = reviews.filter((r) => r.status !== 'PENDING');

  return (
    <AppShell breadcrumbs={[{ label: 'Review Center' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-surface)',
              padding: '0.875rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 1000,
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Check size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-warning">{pendingReviews.length} Pending Review</span>
              <span className="badge badge-success">{resolvedReviews.length} Resolved</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Human Review Center</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Specialist decision console for OCR confidence reviews, non-standard declarations, and statutory exemptions.
            </p>
          </div>

          <button onClick={loadBackendReviews} className="btn btn-outline" style={{ gap: '0.4rem' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--status-issue-subtle)', borderLeft: '4px solid var(--status-issue-solid)', color: 'var(--status-issue-text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          </div>
        )}

        {/* Review Queue Items */}
        {loading ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Loading human review items from inspection pipeline...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <CheckCircle2 size={42} style={{ color: 'var(--status-good-solid)', margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Review Queue Clear</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0.25rem auto 0 auto' }}>
              No statutory declarations currently require human specialist review.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {reviews.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: '1.5rem',
                  borderLeft: item.status === 'PENDING' ? '4px solid var(--status-review-solid)' : '4px solid var(--status-good-solid)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                        {item.productName} ({item.versionLabel})
                      </span>
                      <span className="badge badge-neutral">{item.category}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.requirementName}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {item.reasonForReview}
                    </p>
                  </div>

                  <StatusBadge status={item.status === 'PENDING' ? 'REVIEW' : 'GOOD'} />
                </div>

                {/* Evidence Card */}
                <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Extracted Declaration Evidence:
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: '0.25rem' }}>
                    "{item.foundValue}"
                  </div>
                </div>

                {/* Action Buttons */}
                {item.status === 'PENDING' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-default)', paddingTop: '1rem' }}>
                    <button
                      onClick={() => {
                        setActiveNoteModalItem(item);
                        setNoteText(item.reviewerNotes || '');
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ gap: '0.35rem' }}
                    >
                      <MessageSquare size={14} />
                      <span>Add Note</span>
                    </button>

                    <button
                      onClick={() => handleDecision(item.id, 'CONFIRMED_ISSUE', 'Marked as Non-Compliant Issue')}
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--status-issue-solid)', borderColor: 'var(--status-issue-border)', gap: '0.35rem' }}
                    >
                      <XCircle size={14} />
                      <span>Confirm Issue</span>
                    </button>

                    <button
                      onClick={() => handleDecision(item.id, 'APPROVED_PASS', 'Approved as Compliant')}
                      className="btn btn-primary btn-sm"
                      style={{ gap: '0.35rem' }}
                    >
                      <Check size={14} />
                      <span>Approve (Pass)</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-default)', paddingTop: '0.75rem' }}>
                    <span>Reviewed by {item.reviewedBy || 'Specialist'} {item.reviewedAt || 'recently'}</span>
                    {item.reviewerNotes && <span>Note: {item.reviewerNotes}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Note Modal */}
      <Modal
        isOpen={!!activeNoteModalItem}
        onClose={() => setActiveNoteModalItem(null)}
        title="Auditor Review Note"
        maxWidth="480px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Record statutory rationale or inspection context into the immutable audit trail:
          </p>
          <textarea
            className="textarea"
            rows={4}
            placeholder="e.g. Visual inspection confirms font character height is >= 4.0mm under Schedule-II area table."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button onClick={() => setActiveNoteModalItem(null)} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={handleSaveNote} className="btn btn-primary">
              Save Note
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
};
