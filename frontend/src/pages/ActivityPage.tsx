import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchActivity } from '../store/activitySlice';
import { logout } from '../store/authSlice';
import type { RootState, AppDispatch } from '../store/store';
import './ActivityPage.css';

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getAvatarColor(name: string): string {
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getActionIcon(action: string): string {
  if (action.includes('created')) return 'add_circle';
  if (action.includes('moved')) return 'swap_horiz';
  if (action.includes('deleted')) return 'delete';
  if (action.includes('joined')) return 'person_add';
  if (action.includes('commented')) return 'comment';
  if (action.includes('uploaded')) return 'upload_file';
  return 'history';
}

function getActionColor(action: string): string {
  if (action.includes('created')) return 'var(--success)';
  if (action.includes('moved')) return 'var(--primary)';
  if (action.includes('deleted')) return 'var(--danger)';
  if (action.includes('joined')) return 'var(--info)';
  return 'var(--text-tertiary)';
}

export default function ActivityPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { logs, loading } = useSelector((s: RootState) => s.activity);
  const { user } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    dispatch(fetchActivity());
  }, [dispatch]);

  // Group logs by date
  const grouped = logs.reduce<Record<string, typeof logs>>((acc, log) => {
    const date = new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  // Stats
  const totalActions = logs.length;
  const activeTasks = logs.filter(l => l.action.includes('created') && l.entityType === 'card').length;
  const movedToDone = logs.filter(l => l.action.includes('done')).length;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <span className="material-icons-outlined" style={{ fontSize: 28, color: 'white' }}>hub</span>
          <h2>CollabSpace</h2>
        </div>
        <div className="sidebar-profile">
          <div className="avatar" style={{ background: getAvatarColor(user?.displayName || 'U') }}>
            {getInitials(user?.displayName || 'User')}
          </div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">{user?.displayName}</span>
            <span className="sidebar-profile-plan">Free Plan</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Main Menu</span>
          <button className="sidebar-nav-item" onClick={() => navigate('/dashboard')}>
            <span className="material-icons-outlined">dashboard</span>
            Workspaces
          </button>
          <button className="sidebar-nav-item active">
            <span className="material-icons-outlined">history</span>
            Activity Feed
          </button>
          <button className="sidebar-nav-item">
            <span className="material-icons-outlined">settings</span>
            Settings
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-nav-item" onClick={() => dispatch(logout())}>
            <span className="material-icons-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Project Dashboard</h1>
            <p>Track all activity across your workspaces.</p>
          </div>
        </header>

        {/* Stats */}
        <div className="activity-stats">
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}>
              <span className="material-icons-outlined">trending_up</span>
            </div>
            <div>
              <span className="stat-label">Total Actions</span>
              <span className="stat-value">{totalActions}</span>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <span className="material-icons-outlined">task_alt</span>
            </div>
            <div>
              <span className="stat-label">Tasks Created</span>
              <span className="stat-value">{activeTasks}</span>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
              <span className="material-icons-outlined">check_circle</span>
            </div>
            <div>
              <span className="stat-label">Completed</span>
              <span className="stat-value">{movedToDone}</span>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <section className="activity-feed-section card">
          <h2 className="activity-feed-title">
            <span className="material-icons-outlined">history</span>
            Activity Feed
          </h2>

          {loading && <div className="dashboard-loading"><span className="spinner" /></div>}

          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date} className="activity-date-group">
              <h4 className="activity-date-label">{date}</h4>
              {entries.map(log => (
                <div key={log._id} className="activity-feed-item">
                  <div className="activity-feed-icon" style={{ color: getActionColor(log.action) }}>
                    <span className="material-icons-outlined">{getActionIcon(log.action)}</span>
                  </div>
                  <div className="activity-feed-content">
                    <div className="activity-feed-row">
                      <div className="avatar avatar-sm" style={{ background: getAvatarColor(log.actorId?.displayName || 'U') }}>
                        {getInitials(log.actorId?.displayName || 'U')}
                      </div>
                      <div className="activity-feed-text">
                        <strong>{log.actorId?.displayName}</strong>
                        {' '}{log.action}{' '}
                        <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{log.entityTitle}</span>
                        {log.entityType !== 'workspace' && (
                          <span className="badge badge-info" style={{ marginLeft: 8 }}>{log.entityType}</span>
                        )}
                      </div>
                    </div>
                    <span className="activity-feed-time">{getTimeAgo(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {!loading && logs.length === 0 && (
            <div className="dashboard-empty" style={{ padding: '40px 20px' }}>
              <span className="material-icons-outlined" style={{ fontSize: 48, color: 'var(--text-tertiary)' }}>
                history
              </span>
              <h3>No activity yet</h3>
              <p>Start using your workspaces to see activity here</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
