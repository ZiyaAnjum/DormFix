import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const styles =
    type === 'error'
      ? 'bg-[#D9473D] text-white'
      : 'bg-[#2F6F5E] text-white';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl px-5 py-3 text-sm shadow-lg ${styles}`}
    >
      {message}
    </div>
  );
}
