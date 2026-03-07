import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '../store/toastSlice';
import type { RootState, AppDispatch } from '../store/store';

export default function ToastContainer() {
  const dispatch = useDispatch<AppDispatch>();
  const { toasts } = useSelector((s: RootState) => s.toast);

  useEffect(() => {
    if (toasts.length > 0) {
      const lastToast = toasts[toasts.length - 1];
      const timer = setTimeout(() => dispatch(removeToast(lastToast.id)), 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="material-icons-outlined" style={{ fontSize: 18 }}>
            {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{t.message}</span>
          <button className="btn btn-ghost btn-icon btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => dispatch(removeToast(t.id))}>
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
