import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { SAMPLE_REVIEWS } from '../data/mockData';
import type { ReviewItem } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  Check, 
  XCircle, 
  RefreshCw, 
  MessageSquare, 
  ShieldCheck 
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const ReviewCenterPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>(SAMPLE_REVIEWS);
  const [activeNoteModalItem, setActiveNoteModalItem] = useState<ReviewItem | null>(null);
  const [noteText, setNoteText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDecision = (id: string, newStatus: ReviewItem['status'], statusLabel: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              reviewedBy: 'Devin Vance (Senior Specialist)',
              reviewedAt: 'Just now',
            }
          : r
      )
    );
    showToast(`Decision recorded: Marked item as ${statusLabel}`);
  };

  const handleSaveNote = () => {
    if (!activeNoteModalItem) return;
    setReviews((prev) =>
      prev.map((r) =>
        r.id === activeNoteModalItem.id
          ? { ...r, reviewerNotes: noteText }
          : r
      )
    );
    setActiveNoteModalItem(null);
    setNoteText('');
    showToast('Reviewer note saved successfully.');
  };

  const pendingCount = reviews.filter((r) => r.status === 'PENDING').length;

  return (
    <AppShell breadcrumbs={[{ label: 'Review Center' }]}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-sample">Specialist Review Queue</span>
              <span className="badge badge-review">{pendingCount} Items Awaiting Sign-off</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Human Review Center</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Verify borderline contrast ratios, ambiguous packaging declarations, and cylindrical distortion evidence.
            </p>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className="animate-fade-in"
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--brand-primary)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <ShieldCheck size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Review Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {reviews.map((item) => (
            <div
              key={item.id}
              className="card-tactile"
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-surface)',
                borderLeft: item.status === 'PENDING' ? '4px solid var(--status-review-solid)' : item.status === 'APPROVED_PASS' ? '4px solid var(--status-good-solid)' : '4px solid var(--status-issue-solid)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {item.productName}</span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{item.requirementName}</h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Engine Confidence</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: item.confidence >= 0.85 ? 'var(--brand-primary)' : 'var(--status-review-solid)' }}>
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Finding Reason & Details */}
              <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Reason for Review:
                  </strong>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {item.reasonForReview}
                  </p>
                </div>

                <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Found OCR Value:
                  </strong>
                  <p style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {item.foundValue}
                  </p>
                </div>
              </div>

              {item.reviewerNotes && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--brand-primary-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
                  <strong style={{ color: 'var(--brand-primary)' }}>Specialist Note:</strong> {item.reviewerNotes}
                </div>
              )}

              {/* Reviewer Decision Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.reviewedBy ? (
                    <span>Reviewed by <strong>{item.reviewedBy}</strong> ({item.reviewedAt})</span>
                  ) : (
                    <span>Pending specialist verification</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setActiveNoteModalItem(item);
                      setNoteText(item.reviewerNotes || '');
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ gap: '0.35rem' }}
                  >
                    <MessageSquare size={13} />
                    <span>Add Note</span>
                  </button>

                  <button
                    onClick={() => handleDecision(item.id, 'NEW_IMAGE_REQUESTED', 'New Image Requested')}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.35rem' }}
                  >
                    <RefreshCw size={13} />
                    <span>Request New Image</span>
                  </button>

                  <button
                    onClick={() => handleDecision(item.id, 'CONFIRMED_ISSUE', 'Issue Confirmed')}
                    className="btn btn-danger btn-sm"
                    style={{ gap: '0.35rem' }}
                  >
                    <XCircle size={13} />
                    <span>Mark as Issue</span>
                  </button>

                  <button
                    onClick={() => handleDecision(item.id, 'APPROVED_PASS', 'Approved Pass')}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.35rem' }}
                  >
                    <Check size={13} />
                    <span>Confirm & Pass</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Specialist Note Modal */}
      <Modal
        isOpen={!!activeNoteModalItem}
        onClose={() => setActiveNoteModalItem(null)}
        title="Add Reviewer Specialist Note"
        subtitle={`Adding audit annotation for ${activeNoteModalItem?.requirementName}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <textarea
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g. Verified with pre-press plate supplier that kraft texture will receive white underprint..."
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button onClick={() => setActiveNoteModalItem(null)} className="btn btn-secondary">
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
