import { useState, useEffect, useCallback } from 'react';
import { fetchComplaints, upvoteComplaint } from '../api/complaints';
import { CATEGORIES } from '../utils/validation';
import ComplaintCard from './ComplaintCard';

const STATUS_OPTIONS = ['open', 'in-progress', 'resolved', 'escalated'];

export default function ComplaintList({ refreshTrigger }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  // Debounced search text to avoid rapid API calls
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);

    return () => clearTimeout(handler);
  }, [search]);

  const loadComplaints = useCallback(async () => {
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
  }, [status, category, debouncedSearch]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints, refreshTrigger]);

  async function handleUpvote(id, currentUpvotes) {
    try {
      const updated = await upvoteComplaint(id, currentUpvotes);
      if (updated.success) {
        setComplaints((prev) =>
          prev.map((c) => (c._id === id ? { ...c, upvotes: updated.data.upvotes } : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleReset() {
    setSearch('');
    setCategory('');
    setStatus('');
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Ledger Controls */}
      <div className="rounded-2xl border border-[#E4E4E0] bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-heading text-xl font-semibold text-[#1F2430]">Search & Filter Ledger</h2>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-xs font-semibold text-[#5C6478] uppercase tracking-wider">
              Search Text
            </label>
            <input
              id="search"
              type="text"
              placeholder="e.g. fan, water leakage"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#D8D8D3] bg-[#F7F7F5] px-4 py-2.5 text-sm outline-none transition focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/20"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="filter-category" className="block text-xs font-semibold text-[#5C6478] uppercase tracking-wider">
              Category
            </label>
            <select
              id="filter-category"
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

          {/* Status */}
          <div>
            <label htmlFor="filter-status" className="block text-xs font-semibold text-[#5C6478] uppercase tracking-wider">
              Status
            </label>
            <select
              id="filter-status"
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

        {(search || category || status) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleReset}
              className="text-xs font-medium text-[#D9473D] hover:underline focus:outline-none"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Complaints Grid/List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2F6F5E] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-[#5C6478]">Loading maintenance ledger...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#D9473D]/20 bg-[#D9473D]/10 p-5 text-center text-[#D9473D]">
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={loadComplaints}
            className="mt-3 rounded-lg bg-[#D9473D] px-4 py-2 text-xs font-medium text-white hover:bg-[#b8382f] focus:outline-none"
          >
            Retry
          </button>
        </div>
      ) : complaints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8D8D3] bg-white py-16 text-center">
          <p className="text-3xl">📝</p>
          <h3 className="mt-4 font-heading text-lg font-bold text-[#1F2430]">No complaints found</h3>
          <p className="mt-1 text-sm text-[#5C6478] max-w-xs mx-auto">
            Try adjusting your search criteria or filters, or log a new complaint.
          </p>
          {(search || category || status) && (
            <button
              onClick={handleReset}
              className="mt-4 rounded-xl bg-[#2F6F5E] px-4 py-2 text-xs font-medium text-white hover:bg-[#265949] focus:outline-none"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map((complaint) => (
            <ComplaintCard
              key={complaint._id}
              complaint={complaint}
              onUpvote={handleUpvote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
