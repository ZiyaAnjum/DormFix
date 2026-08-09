import { STATUS_CONFIG } from './ComplaintCard';

export default function ComplaintDetailsModal({ complaint, onClose, onStatusChange, isAdmin = false }) {
  if (!complaint) return null;

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
    createdAt,
  } = complaint;

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex-shrink-0 flex items-start justify-between gap-4 pb-4 sm:pb-5 border-b border-[#E4E4E0]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F6F5E]">Complaint details</p>
            <h2 className="mt-2 text-2xl font-bold text-[#1F2430]">{title}</h2>
            <p className="mt-1 text-sm text-[#5C6478]">{ticketId} • {formattedDate}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F7F7F5] p-2 text-[#1F2430] transition hover:bg-[#E4E4E0] focus:outline-none"
            aria-label="Close complaint details"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-[#5C6478] overflow-y-auto flex-1 min-h-0">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#E4E4E0] bg-[#F7F7F5] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#5C6478]">Category</p>
              <p className="mt-2 font-semibold text-[#1F2430]">{category}</p>
            </div>
            <div className="rounded-2xl border border-[#E4E4E0] bg-[#F7F7F5] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#5C6478]">Location</p>
              <p className="mt-2 font-semibold text-[#1F2430]">{location}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E4E4E0] bg-[#F7F7F5] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#5C6478]">Description</p>
            <p className="mt-2 whitespace-pre-line text-[#1F2430]">{description}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-[#F7F7F5] px-3 py-2 text-xs font-semibold text-[#5C6478] border border-[#E4E4E0]">Status: {status}</span>
            <span className="rounded-full bg-[#F7F7F5] px-3 py-2 text-xs font-semibold text-[#5C6478] border border-[#E4E4E0]">Upvotes: {upvotes}</span>
          </div>
          {photoUrl && (
            <div className="overflow-hidden rounded-2xl border border-[#E4E4E0] bg-black/5">
              <img src={photoUrl} alt={`Complaint attachment for ${ticketId}`} className="w-full max-h-[42vh] object-cover" />
            </div>
          )}
          {status === 'resolved' && feedback && (
            <div className="rounded-2xl border border-[#3D9B6B]/20 bg-[#3D9B6B]/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#3D9B6B]">Resolved feedback</p>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="font-semibold text-[#1F2430]">Rating:</span>
                <span className="text-[#E08E2B]">
                  {Array.from({ length: 5 }).map((_, i) => (i < feedback.rating ? '★' : '☆'))}
                </span>
              </div>
              {feedback.comment && (
                <p className="mt-2 text-sm italic text-[#1F2430]">"{feedback.comment}"</p>
              )}
            </div>
          )}
          {isAdmin && onStatusChange && (
            <div className="rounded-2xl border border-[#D8D8D3] bg-[#F7F7F5] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#5C6478]">Admin status control</p>
              <select
                value={status}
                onChange={(e) => onStatusChange(_id, e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#D8D8D3] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/20"
              >
                <option value="open">Open</option>
                <option value="in-progress">In-progress</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
