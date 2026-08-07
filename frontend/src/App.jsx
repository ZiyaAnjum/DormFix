import { useCallback, useState, useEffect } from 'react';
import Layout from './components/Layout';
import ComplaintForm from './components/ComplaintForm';
import ComplaintList from './components/ComplaintList';
import AdminDashboard from './components/AdminDashboard';
import Toast from './components/Toast';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeTab, setActiveTab] = useState('list'); // 'form' or 'list'
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const closeToast = useCallback(() => {
    setToast({ message: '', type: 'success' });
  }, []);

  const handleSubmissionSuccess = useCallback((message) => {
    setToast({ message, type: 'success' });
    setRefreshTrigger((prev) => prev + 1);
    // Switch to Ledger view to see the new ticket
    setActiveTab('list');
  }, []);

  const isAdmin = currentPath === '/admin';

  return (
    <Layout>
      {/* Top Portal Switcher */}
      <div className="mb-4 flex justify-end text-xs">
        {isAdmin ? (
          <button
            onClick={() => navigateTo('/')}
            className="font-semibold text-[#2F6F5E] hover:underline focus:outline-none"
          >
            ← Back to Student Portal
          </button>
        ) : (
          <button
            onClick={() => navigateTo('/admin')}
            className="font-semibold text-[#2F6F5E] hover:underline focus:outline-none"
          >
            Go to Admin Dashboard →
          </button>
        )}
      </div>

      {/* Screen Views */}
      {isAdmin ? (
        <AdminDashboard
          onSuccess={(message) => setToast({ message, type: 'success' })}
          onError={(message) => setToast({ message, type: 'error' })}
        />
      ) : (
        <>
          {/* Tab Switcher */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex rounded-xl bg-white p-1.5 shadow-sm border border-[#E4E4E0]">
              <button
                onClick={() => setActiveTab('list')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'list'
                    ? 'bg-[#2F6F5E] text-white'
                    : 'text-[#5C6478] hover:text-[#1F2430]'
                }`}
              >
                📋 Ledger View
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'form'
                    ? 'bg-[#2F6F5E] text-white'
                    : 'text-[#5C6478] hover:text-[#1F2430]'
                }`}
              >
                ✏️ File Complaint
              </button>
            </div>
          </div>

          {activeTab === 'form' ? (
            <ComplaintForm
              onSuccess={handleSubmissionSuccess}
              onError={(message) => setToast({ message, type: 'error' })}
            />
          ) : (
            <ComplaintList refreshTrigger={refreshTrigger} />
          )}
        </>
      )}

      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
    </Layout>
  );
}
