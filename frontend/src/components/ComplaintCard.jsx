import { useState, useEffect } from 'react';
import { submitComplaintFeedback } from '../api/complaints';
import ComplaintDetailsModal from './ComplaintDetailsModal';

export const STATUS_CONFIG = {
  'open': {
    color: '#E08E2B',
    bgColor: 'rgba(224, 142, 43, 0.1)',
    textColor: '#E08E2B',
    borderColor: 'border-[#E08E2B]'
  },
  'in-progress': {
    color: '#3D6FD9',
    bgColor: 'rgba(61, 111, 217, 0.1)',
    textColor: '#3D6FD9',
    borderColor: 'border-[#3D6FD9]'
  },
  'resolved': {
    color: '#3D9B6B',
    bgColor: 'rgba(61, 155, 107, 0.1)',
    textColor: '#3D9B6B',
    borderColor: 'border-[#3D9B6B]'
  },
  'escalated': {
    color: '#D9473D',
    bgColor: 'rgba(217, 71, 61, 0.1)',
    textColor: '#D9473D',
    borderColor: 'border-[#D9473D]'
  }
};

export default function ComplaintCard({ complaint, onUpvote, onSuccess, onError }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  const {
    _id,
    ticketId,
    title,
    category,
    description,
    location,
    photoUrl,
    status,
    upvotes,
    feedback,
    createdAt
  } = complaint;

  const [localFeedback, setLocalFeedback] = useState(feedback);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  useEffect(() => {
    setLocalFeedback(feedback);
  }, [feedback]);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG['open'];

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  async function handleUpvote(e) {
    e.stopPropagation();
    if (upvoting) return;
    setUpvoting(true);
    try {
      await onUpvote(_id, upvotes);
    } catch (err) {
      console.error('Failed to upvote:', err);
    } finally {
      setUpvoting(false);
    }
  }

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (submittingFeedback) return;
    setSubmittingFeedback(true);
    setFeedbackError('');
    try {
      const res = await submitComplaintFeedback(_id, {
        rating: ratingInput,
        comment: commentInput.trim(),
      });
      if (res.success) {
        setLocalFeedback(res.data.feedback);
        onSuccess?.('Feedback submitted! Thank you.');
      }
    } catch (err) {
      setFeedbackError(err.message || 'Failed to submit feedback.');
      onError?.(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const needsTruncation = description.length > 180;
  const displayDescription = isExpanded || !needsTruncation
    ? description
    : `${description.substring(0, 180)}...`;

  const openDetails = () => setShowDetails(true);
  const closeDetails = () => setShowDetails(false);

  return (
    <>
      <article
        tabIndex={0}
        role="button"
        onClick={openDetails}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openDetails();
          }
        }}
        className="relative overflow-hidden rounded-xl border border-[#E4E4E0] bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]/20 cursor-pointer"
        style={{ borderLeftWidth: '6px', borderLeftColor: config.color }}
      >
        {/* Stamp Badge */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none select-none">
          <div
            className="rotate-12 rounded border-2 px-3 py-1 text-center font-mono text-[10px] font-bold uppercase tracking-wider"
            style={{
              borderColor: config.color,
              color: config.color,
              backgroundColor: config.bgColor,
              transform: 'rotate(12deg) scale(1)',
              boxShadow: `0 0 0 1px ${config.bgColor}`,
            }}
          >
            {status}
          </div>
        </div>

        {/* Card Content */}
        <div className="flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-[#5C6478]">
              <span className="font-semibold text-[#1F2430]">{ticketId}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>

            <h3 className="mt-2 pr-20 font-heading text-lg font-bold text-[#1F2430] leading-snug">
              {title}
            </h3>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-md bg-[#2F6F5E]/10 px-2 py-0.5 text-xs font-medium text-[#2F6F5E]">
                {category}
              </span>
              <span className="inline-flex items-center rounded-md bg-[#F7F7F5] px-2 py-0.5 text-xs font-medium text-[#5C6478] border border-[#E4E4E0]">
                📍 {location}
              </span>
            </div>

            <div className="mt-4 text-sm text-[#5C6478] break-words">
              {displayDescription}
              {needsTruncation && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="ml-1 font-semibold text-[#2F6F5E] hover:underline focus:outline-none"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          </div>

          {/* Optional Photo Attachment */}
          {photoUrl && (
            <div
              className="relative mt-2 max-h-40 overflow-hidden rounded-lg border border-[#E4E4E0] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowPhotoModal(true);
              }}
            >
              <img
                src={photoUrl}
                alt={`Complaint ${ticketId}`}
                className="w-full h-32 object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-full">
                  🔍 View Photo
                </span>
              </div>
            </div>
          )}

          {/* Feedback & Star Rating Section (only if resolved) */}
          {status === 'resolved' && (
            localFeedback ? (
              <div className="mt-3 rounded-lg bg-[#3D9B6B]/10 p-3 border border-[#3D9B6B]/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#3D9B6B]">User Feedback</span>
                  <div className="flex text-[#E08E2B] text-xs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < localFeedback.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>
                {localFeedback.comment && (
                  <p className="mt-1 text-xs italic text-[#1F2430] break-words">
                    "{localFeedback.comment}"
                  </p>
                )}
              </div>
            ) : (
              <form
              onSubmit={handleFeedbackSubmit}
              onClick={(e) => e.stopPropagation()}
              className="mt-3 rounded-lg bg-[#F7F7F5] p-3 border border-[#E4E4E0] space-y-3"
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#1F2430]">Rate Experience</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRatingInput(star);
                        }}
                        className="text-lg focus:outline-none transition-transform active:scale-125 hover:scale-110"
                        style={{ color: star <= ratingInput ? '#E08E2B' : '#D8D8D3' }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <textarea
                    placeholder="Leave a comment (optional)..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="w-full rounded-md border border-[#D8D8D3] bg-white p-2 text-xs outline-none transition focus:border-[#2F6F5E] resize-none"
                  />
                </div>
                {feedbackError && (
                  <p className="text-[10px] font-semibold text-[#D9473D]">{feedbackError}</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="rounded bg-[#2F6F5E] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#265949] disabled:opacity-50"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            )
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#F7F7F5]">
            <button
              onClick={handleUpvote}
              disabled={upvoting}
              className="inline-flex min-h-[44px] items-center space-x-2 rounded-lg border border-[#D8D8D3] bg-white px-3 py-2 text-xs font-medium text-[#1F2430] transition hover:bg-[#F7F7F5] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]/20 disabled:opacity-50"
            >
              <span>▲</span>
              <span>Upvote ({upvotes})</span>
            </button>
          </div>
        </div>
      </article>

      {/* Photo Lightbox Modal */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b border-[#E4E4E0]">
              <span className="font-mono text-sm font-semibold">{ticketId} Attachment</span>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold px-2 focus:outline-none"
              >
                &times;
              </button>
            </div>
            <img src={photoUrl} alt={`Full attachment for ${ticketId}`} className="w-full max-h-[70vh] object-contain bg-black animate-[fadeIn_0.2s_ease-out]" />
          </div>
        </div>
      )}

      {showDetails && (
        <ComplaintDetailsModal
          complaint={complaint}
          onClose={closeDetails}
        />
      )}
    </>
  );
}
