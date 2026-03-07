import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchWorkspaces, createWorkspace, deleteWorkspace } from '../store/workspaceSlice';
import { fetchActivity } from '../store/activitySlice';
import { logout } from '../store/authSlice';
import type { RootState, AppDispatch } from '../store/store';
import type { Workspace } from '../store/workspaceSlice';
import './DashboardPage.css';

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

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const { workspaces, loading } = useSelector((s: RootState) => s.workspaces);
  const { logs } = useSelector((s: RootState) => s.activity);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [activeNav, setActiveNav] = useState('workspaces');

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchActivity());
  }, [dispatch]);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await dispatch(createWorkspace({ name: newName, description: newDesc }));
    setNewName('');
    setNewDesc('');
    setShowCreateModal(false);
  }, [dispatch, newName, newDesc]);

  const handleDelete = useCallback((id: string, name: string) => {
    if (window.confirm(`Delete workspace "${name}"?`)) {
      dispatch(deleteWorkspace(id));
    }
  }, [dispatch]);

  const openWorkspace = (ws: Workspace) => {
    navigate(`/workspace/${ws._id}`);
  };

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
          <button className={`sidebar-nav-item ${activeNav === 'workspaces' ? 'active' : ''}`}
            onClick={() => setActiveNav('workspaces')}>
            <span className="material-icons-outlined">dashboard</span>
            Workspaces
          </button>
          <button className={`sidebar-nav-item ${activeNav === 'activity' ? 'active' : ''}`}
            onClick={() => { setActiveNav('activity'); navigate('/activity'); }}>
            <span className="material-icons-outlined">history</span>
            Activity Feed
          </button>
          <button className={`sidebar-nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveNav('settings')}>
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
            <h1>Your Workspaces</h1>
            <p>Manage your collaborative projects and team environments.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <span className="material-icons-outlined">add</span>
            New Workspace
          </button>
        </header>

        {/* Workspace Grid */}
        <section className="workspace-grid">
          {loading && workspaces.length === 0 && (
            <div className="dashboard-loading"><span className="spinner" /></div>
          )}

          {workspaces.map((ws) => (
            <div key={ws._id} className="workspace-card card card-interactive" onClick={() => openWorkspace(ws)}>
              <div className="workspace-card-header">
                <div className="workspace-card-icon" style={{ background: getAvatarColor(ws.name) }}>
                  {ws.name[0]?.toUpperCase()}
                </div>
                <button className="btn btn-ghost btn-icon workspace-card-menu"
                  onClick={(e) => { e.stopPropagation(); handleDelete(ws._id, ws.name); }}>
                  <span className="material-icons-outlined">delete_outline</span>
                </button>
              </div>
              <h3 className="workspace-card-title">{ws.name}</h3>
              <p className="workspace-card-desc">{ws.description || 'No description'}</p>
              <div className="workspace-card-footer">
                <div className="workspace-card-members">
                  {ws.memberIds.slice(0, 3).map((m) => (
                    <div key={m._id} className="avatar avatar-sm" style={{ background: getAvatarColor(m.displayName) }}
                      title={m.displayName}>
                      {getInitials(m.displayName)}
                    </div>
                  ))}
                  {ws.memberIds.length > 3 && (
                    <span className="workspace-card-more">+{ws.memberIds.length - 3}</span>
                  )}
                </div>
                <span className="workspace-card-time">
                  <span className="material-icons-outlined" style={{ fontSize: 14 }}>schedule</span>
                  Active {getTimeAgo(ws.lastActiveAt)}
                </span>
              </div>
            </div>
          ))}

          {!loading && workspaces.length === 0 && (
            <div className="dashboard-empty">
              <span className="material-icons-outlined" style={{ fontSize: 48, color: 'var(--text-tertiary)' }}>
                folder_open
              </span>
              <h3>No workspaces yet</h3>
              <p>Create your first workspace to get started</p>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                <span className="material-icons-outlined">add</span>
                Create Workspace
              </button>
            </div>
          )}
        </section>

        {/* Recent Activity */}
        {logs.length > 0 && (
          <section className="dashboard-activity">
            <h3>Recent Activity</h3>
            <div className="activity-list-compact">
              {logs.slice(0, 5).map((log) => (
                <div key={log._id} className="activity-item-compact">
                  <div className="avatar avatar-sm" style={{ background: getAvatarColor(log.actorId?.displayName || 'U') }}>
                    {getInitials(log.actorId?.displayName || 'U')}
                  </div>
                  <div className="activity-item-text">
                    <span className="activity-actor">{log.actorId?.displayName}</span>
                    {' '}{log.action}{' '}
                    <span className="activity-entity">{log.entityTitle}</span>
                  </div>
                  <span className="activity-time">{getTimeAgo(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Workspace</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreateModal(false)}>
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="input-group" style={{ marginBottom: 16 }}>
                <label>Workspace Name</label>
                <input className="input-field" placeholder="e.g. Marketing Q4"
                  value={newName} onChange={(e) => setNewName(e.target.value)} required autoFocus />
              </div>
              <div className="input-group">
                <label>Description (optional)</label>
                <textarea className="input-field" placeholder="What's this workspace about?"
                  value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
