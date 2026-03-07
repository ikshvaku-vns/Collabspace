import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, register, clearError } from '../store/authSlice';
import type { RootState, AppDispatch } from '../store/store';
import './LoginPage.css';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    if (isLogin) {
      dispatch(login({ email, password }));
    } else {
      dispatch(register({ email, password, displayName }));
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    dispatch(clearError());
  };

  return (
    <div className="login-page">
      {/* Left Panel - Branding */}
      <div className="login-branding">
        <div className="branding-content">
          <div className="branding-logo">
            <span className="material-icons-outlined" style={{ fontSize: 40 }}>hub</span>
            <h1>CollabSpace</h1>
          </div>
          <p className="branding-tagline">Real-time collaborative workspaces for modern teams</p>
          <div className="branding-features">
            <div className="feature-item">
              <span className="material-icons-outlined">dashboard_customize</span>
              <span>Kanban Boards</span>
            </div>
            <div className="feature-item">
              <span className="material-icons-outlined">group</span>
              <span>Live Collaboration</span>
            </div>
            <div className="feature-item">
              <span className="material-icons-outlined">chat</span>
              <span>Team Chat</span>
            </div>
            <div className="feature-item">
              <span className="material-icons-outlined">mouse</span>
              <span>Live Cursors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="login-subtitle">
            {isLogin
              ? 'Enter your credentials to access your workspace'
              : 'Start collaborating with your team in seconds'}
          </p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="input-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  className="input-field"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <div className="flex justify-between items-center">
                <label htmlFor="password">Password</label>
                {isLogin && <a href="#" className="forgot-link">Forgot?</a>}
              </div>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
              {loading ? <span className="spinner" /> : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="login-toggle">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={toggleMode} className="toggle-btn">{isLogin ? 'Sign up' : 'Sign in'}</button>
          </p>
        </div>

        <div className="login-footer">
          <span>© 2026 CollabSpace. All rights reserved.</span>
          <div className="login-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Help Center</a>
          </div>
        </div>
      </div>
    </div>
  );
}
