import { useState, useEffect, useCallback } from 'react';
import { fetchComplaints, updateComplaintStatus } from '../api/complaints';
import { CATEGORIES } from '../utils/validation';

const STATUS_OPTIONS = ['open', 'in-progress', 'resolved', 'escalated'];

const STATUS_STYLES = {
  'open': 'bg-[#E08E2B]/10 text-[#E08E2B] border-[#E08E2B]/20',
  'in-progress': 'bg-[#3D6FD9]/10 text-[#3D6FD9] border-[#3D6FD9]/20',
  'resolved': 'bg-[#3D9B6B]/10 text-[#3D9B6B] border-[#3D9B6B]/20',
  'escalated': 'bg-[#D9473D]/10 text-[#D9473D] border-[#D9473D]/20',
};

export default function AdminDashboard({ onError, onSuccess }) {
  const [passcode, setPasscode] = useState(() => sessionStorage.getItem('admin_passcode') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(sessionStorage.getItem('admin_passcode')));
  const [passcodeInput, setPasscodeInput] = useState('');
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  const loadComplaints = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();

      const result = await fetchComplaints(filters);
      setComplaints(result.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch complaints.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, status, category, debouncedSearch]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  function handleLogin(e) {
    e.preventDefault();
    if (!passcodeInput.trim()) return;
    
    // Save passcode and assume authenticated (validation happens on action)
    sessionStorage.setItem('admin_passcode', passcodeInput);
    setPasscode(passcodeInput);
    setIsAuthenticated(true);
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_passcode');
    setPasscode('');
    setIsAuthenticated(false);
    setComplaints([]);
    setPasscodeInput('');
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const result = await updateComplaintStatus(id, newStatus, passcode);
      if (result.success) {
        onSuccess?.(`Complaint ${result.data.ticketId} status updated to ${newStatus}.`);
        setComplaints((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: result.data.status } : c))
        );
      }
    } catch (err) {
      if (err.message.includes('Unauthorized') || err.message.includes('passcode')) {
        onError?.('Authentication failed. Please check your passcode.');
        handleLogout();
      } else {
        onError?.(err.message || 'Failed to update status.');
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md py-12">
        <div className="rounded-2xl border border-[#E4E4E0] bg-white p-8 shadow-sm">
          <div className="text-center mb-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#2F6F5E]">
              Restricted Area
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold">Admin Portal</h2>
            <p className="mt-1 text-sm text-[#5C6478]">
              Please enter the administrator passcode to access status controls.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="passcode" className="block text-sm font-medium">
                Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter admin passcode"
                className="mt-2 w-full rounded-xl border border-[#D8D8D3] bg-[#F7F7F5] px-4 py-3 text-sm outline-none transition focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/20"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#2F6F5E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#265949] focus:outline-none"
            >
              Verify & Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Control Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-[#E4E4E0] bg-white px-6 py-4 shadow-sm">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[#2F6F5E] font-semibold">
            Admin Session Active
          </span>
          <h2 className="font-heading text-xl font-bold">Complaints Ledger Console</h2>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-[#D9473D]/30 px-3.5 py-1.5 text-xs font-semibold text-[#D9473D] hover:bg-[#D9473D]/5 transition focus:outline-none"
        >
          Logout Console
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#E4E4E0] bg-white p-5 shadow-sm">
          <span className="block text-xs font-semibold text-[#5C6478] uppercase tracking-wider">Total Tickets</span>
          <span className="mt-2 block font-heading text-3xl font-bold text-[#1F2430]">{complaints.length}</span>
        </div>
        <div className="rounded-2xl border border-[#E4E4E0] bg-white p-5 shadow-sm">
          <span className="block text-xs font-semibold text-[#5C6478] uppercase tracking-wider">Pending Action</span>
          <span className="mt-2 block font-heading text-3xl font-bold text-[#E08E2B]">
            {complaints.filter((c) => ['open', 'in-progress'].includes(c.status)).length}
          </span>
        </div>
        <div className="rounded-2xl border border-[#E4E4E0] bg-white p-5 shadow-sm">
          <span className="block text-xs font-semibold text-[#5C6478] uppercase tracking-wider">Escalated</span>
          <span className="mt-2 block font-heading text-3xl font-bold text-[#D9473D]">
            {complaints.filter((c) => c.status === 'escalated').length}
          </span>
        </div>
        <div className="rounded-2xl border border-[#E4E4E0] bg-white p-5 shadow-sm">
          <span className="block text-xs font-semibold text-[#5C6478] uppercase tracking-wider">Avg Rating</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="block font-heading text-3xl font-bold text-[#2F6F5E]">
              {(() => {
                const rated = complaints.filter((c) => c.status === 'resolved' && c.feedback?.rating);
                return rated.length
                  ? `${(rated.reduce((sum, c) => sum + c.feedback.rating, 0) / rated.length).toFixed(1)} ★`
                  : 'N/A';
              })()}
            </span>
            <span className="text-xs font-medium text-[#5C6478]">
              {(() => {
                const ratedCount = complaints.filter((c) => c.status === 'resolved' && c.feedback?.rating).length;
                return ratedCount > 0 ? `(${ratedCount} feedback)` : '';
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="rounded-2xl border border-[#E4E4E0] bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="admin-search" className="block text-xs font-semibold text-[#5C6478] uppercase tracking-wider">
              Search text
            </label>
            <input
              id="admin-search"
              type="text"
              placeholder="Search title, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#D8D8D3] bg-[#F7F7F5] px-4 py-2.5 text-sm outline-none transition focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/20"
            />
          </div>

          <div>
            <label htmlFor="admin-category" className="block text-xs font-semibold text-[#5C6478] uppercase tracking-wider">
              Category
            </label>
            <select
              id="admin-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#D8D8D3] bg-[#F7F7F5] px-4 py-2.5 text-sm outline-none transition focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/20"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-status" className="block text-xs font-semibold text-[#5C6478] uppercase tracking-wider">
              Status
            </label>
            <select
              id="admin-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#D8D8D3] bg-[#F7F7F5] px-4 py-2.5 text-sm outline-none transition focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/20"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Admin Table or Grid of Tickets */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2F6F5E] border-r-transparent align-[-0.125em]" />
          <p className="mt-4 text-sm text-[#5C6478]">Fetching all records...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#D9473D]/20 bg-[#D9473D]/10 p-5 text-center text-[#D9473D]">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8D8D3] bg-white py-16 text-center">
          <p className="text-2xl">📋</p>
          <h3 className="mt-4 font-heading text-lg font-bold text-[#1F2430]">No tickets found</h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E4E4E0] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#F7F7F5] text-xs font-semibold text-[#5C6478] uppercase tracking-wider border-b border-[#E4E4E0]">
                <tr>
                  <th className="px-6 py-4 font-mono">Ticket ID</th>
                  <th className="px-6 py-4">Complaint details</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E0]">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#1F2430] whitespace-nowrap">
                      {c.ticketId}
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <div className="font-semibold text-[#1F2430] truncate">{c.title}</div>
                      <div className="text-xs text-[#5C6478] line-clamp-2 mt-0.5">{c.description}</div>
                      {c.status === 'resolved' && c.feedback && (
                        <div className="mt-1.5 flex items-center space-x-2 bg-[#3D9B6B]/5 border border-[#3D9B6B]/10 rounded px-2 py-1 max-w-max">
                          <span className="text-[#E08E2B] text-xs font-bold font-mono">
                            {Array.from({ length: 5 }).map((_, i) => (
                              i < c.feedback.rating ? '★' : '☆'
                            ))}
                          </span>
                          {c.feedback.comment && (
                            <span className="text-[10px] text-[#1F2430] italic truncate max-w-[150px]">
                              "{c.feedback.comment}"
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#5C6478] whitespace-nowrap">
                      {c.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-[#2F6F5E]/10 px-2.5 py-1 text-xs font-medium text-[#2F6F5E]">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c._id, e.target.value)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wider outline-none transition focus:ring-2 focus:ring-[#2F6F5E]/20 ${
                          STATUS_STYLES[c.status] || STATUS_STYLES['open']
                        }`}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
