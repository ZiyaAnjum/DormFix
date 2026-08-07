import { useCallback, useState } from 'react';
import Layout from './components/Layout';
import ComplaintForm from './components/ComplaintForm';
import Toast from './components/Toast';

export default function App() {
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const closeToast = useCallback(() => {
    setToast({ message: '', type: 'success' });
  }, []);

  return (
    <Layout>
      <ComplaintForm
        onSuccess={(message) => setToast({ message, type: 'success' })}
        onError={(message) => setToast({ message, type: 'error' })}
      />
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
    </Layout>
  );
}
