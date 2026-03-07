import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './store/authSlice';
import { joinWorkspace } from './store/workspaceSlice';
import { addToast } from './store/toastSlice';
import type { RootState, AppDispatch } from './store/store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import ActivityPage from './pages/ActivityPage';
import ToastContainer from './components/ToastContainer';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useSelector((s: RootState) => s.auth);
  if (!token && !loading) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function JoinPage() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { token } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (inviteToken) {
      dispatch(joinWorkspace(inviteToken))
        .unwrap()
        .then((ws) => {
          dispatch(addToast({ message: `Joined "${ws.name}"!`, type: 'success' }));
          navigate(`/workspace/${ws._id}`);
        })
        .catch(() => {
          dispatch(addToast({ message: 'Invalid invite link', type: 'error' }));
          navigate('/dashboard');
        });
    }
  }, [dispatch, inviteToken, navigate, token]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span className="spinner" />
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMe());
    }
  }, [dispatch, token, user]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join/:inviteToken" element={<JoinPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/workspace/:id" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
}
