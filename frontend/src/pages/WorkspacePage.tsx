import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { fetchWorkspace } from '../store/workspaceSlice';
import { fetchCards, createCard, updateCard, deleteCard, moveCard, cardMovedFromSocket, clearCards } from '../store/cardSlice';
import { fetchMessages, addMessage, clearMessages } from '../store/chatSlice';
import { addToast } from '../store/toastSlice';
import { connectSocket, getSocket } from '../services/socket';
import type { RootState, AppDispatch } from '../store/store';
import type { Card } from '../store/cardSlice';
import './WorkspacePage.css';

const COLUMNS = [
  { id: 'todo', title: 'To Do', icon: 'radio_button_unchecked', color: '#3b82f6' },
  { id: 'inprogress', title: 'In Progress', icon: 'pending', color: '#f59e0b' },
  { id: 'done', title: 'Done', icon: 'check_circle', color: '#10b981' },
];

function getAvatarColor(name: string): string {
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

interface OnlineUser {
  userId: string;
  displayName: string;
  color: string;
}

interface CursorData {
  x: number;
  y: number;
  userId: string;
  displayName: string;
  color: string;
}

export default function WorkspacePage() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { activeWorkspace } = useSelector((s: RootState) => s.workspaces);
  const { cards, loading: cardsLoading } = useSelector((s: RootState) => s.cards);
  const { messages } = useSelector((s: RootState) => s.chat);
  const { user } = useSelector((s: RootState) => s.auth);

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorData>>(new Map());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showAddCard, setShowAddCard] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [activeTab, setActiveTab] = useState('board');
  const boardRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load workspace data
  useEffect(() => {
    if (!workspaceId) return;
    dispatch(fetchWorkspace(workspaceId));
    dispatch(fetchCards(workspaceId));
    dispatch(fetchMessages(workspaceId));

    return () => {
      dispatch(clearCards());
      dispatch(clearMessages());
    };
  }, [dispatch, workspaceId]);

  // Socket.IO connection
  useEffect(() => {
    if (!workspaceId) return;
    const socket = connectSocket();

    socket.emit('workspace:join', workspaceId);

    socket.on('workspace:users', (users: OnlineUser[]) => setOnlineUsers(users));
    socket.on('user:joined', (u: OnlineUser) => {
      setOnlineUsers(prev => [...prev.filter(p => p.userId !== u.userId), u]);
      dispatch(addToast({ message: `${u.displayName} joined`, type: 'info' }));
    });
    socket.on('user:disconnected', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(p => p.userId !== userId));
      setCursors(prev => { const n = new Map(prev); n.delete(userId); return n; });
    });
    socket.on('cursor:update', (data: CursorData) => {
      setCursors(prev => new Map(prev).set(data.userId, data));
    });
    socket.on('cursor:remove', ({ userId }: { userId: string }) => {
      setCursors(prev => { const n = new Map(prev); n.delete(userId); return n; });
    });
    socket.on('card:moved', (data: { cardId: string; toColumn: string; order: number }) => {
      dispatch(cardMovedFromSocket(data));
    });
    socket.on('card:updated', () => {
      if (workspaceId) dispatch(fetchCards(workspaceId));
    });
    socket.on('chat:message', (msg: any) => {
      dispatch(addMessage(msg));
    });

    return () => {
      socket.emit('workspace:leave', workspaceId);
      socket.off('workspace:users');
      socket.off('user:joined');
      socket.off('user:disconnected');
      socket.off('cursor:update');
      socket.off('cursor:remove');
      socket.off('card:moved');
      socket.off('card:updated');
      socket.off('chat:message');
    };
  }, [workspaceId, dispatch]);

  // Track mouse movement for live cursors
  useEffect(() => {
    if (!workspaceId || !boardRef.current) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const socket = getSocket();
      socket.emit('cursor:move', {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        workspaceId,
      });
    };
    const el = boardRef.current;
    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, [workspaceId]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Drag and drop
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || !workspaceId) return;
    const { draggableId, destination } = result;
    const toColumn = destination.droppableId;
    const order = destination.index;

    dispatch(moveCard({ id: draggableId, column: toColumn, order }));

    const card = cards.find(c => c._id === draggableId);
    if (card) {
      const socket = getSocket();
      socket.emit('card:move', {
        cardId: draggableId,
        fromColumn: card.column,
        toColumn,
        order,
        workspaceId,
      });
    }
  }, [dispatch, cards, workspaceId]);

  // Add card
  const handleAddCard = useCallback(async (column: string) => {
    if (!newCardTitle.trim() || !workspaceId) return;
    await dispatch(createCard({ workspaceId, title: newCardTitle, column }));
    setNewCardTitle('');
    setShowAddCard(null);
  }, [dispatch, newCardTitle, workspaceId]);

  // Edit card
  const handleSaveEdit = useCallback(async () => {
    if (!editingCard) return;
    await dispatch(updateCard({ id: editingCard._id, title: editTitle, description: editDesc }));
    const socket = getSocket();
    socket.emit('card:update', {
      cardId: editingCard._id,
      field: 'title',
      value: editTitle,
      workspaceId,
    });
    setEditingCard(null);
  }, [dispatch, editingCard, editTitle, editDesc, workspaceId]);

  // Delete card
  const handleDeleteCard = useCallback(async (cardId: string) => {
    await dispatch(deleteCard(cardId));
    setEditingCard(null);
  }, [dispatch]);

  // Send chat message
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !workspaceId) return;
    const socket = getSocket();
    socket.emit('chat:message', { text: chatInput, workspaceId });
    setChatInput('');
  }, [chatInput, workspaceId]);

  const getColumnCards = (columnId: string) =>
    cards.filter(c => c.column === columnId).sort((a, b) => a.order - b.order);

  return (
    <div className="workspace-layout">
      {/* Header */}
      <header className="workspace-header">
        <div className="workspace-header-left">
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
            <span className="material-icons-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="workspace-title">
              <span className="material-icons-outlined" style={{ fontSize: 22, color: 'var(--primary)' }}>hub</span>
              CollabSpace
            </h1>
            <span className="workspace-name">{activeWorkspace?.name || 'Loading...'}</span>
          </div>
        </div>

        <nav className="workspace-tabs">
          <button className={`workspace-tab ${activeTab === 'board' ? 'active' : ''}`}
            onClick={() => setActiveTab('board')}>Board</button>
          <button className={`workspace-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}>Timeline</button>
          <button className={`workspace-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}>Analytics</button>
        </nav>

        <div className="workspace-header-right">
          {/* Presence Bar */}
          <div className="presence-bar">
            {onlineUsers.map(u => (
              <div key={u.userId} className="avatar avatar-sm" style={{ background: u.color }}
                title={`${u.displayName} (online)`}>
                {getInitials(u.displayName)}
              </div>
            ))}
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => {
            const link = `${window.location.origin}/join/${activeWorkspace?.inviteToken}`;
            navigator.clipboard.writeText(link);
            dispatch(addToast({ message: 'Invite link copied!', type: 'success' }));
          }}>
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>link</span>
            Invite
          </button>

          <button className={`btn btn-ghost btn-icon ${chatOpen ? 'chat-active' : ''}`}
            onClick={() => setChatOpen(!chatOpen)}>
            <span className="material-icons-outlined">chat_bubble</span>
          </button>
        </div>
      </header>

      {/* Board + Chat */}
      <div className="workspace-content">
        <div className="kanban-board" ref={boardRef}>
          {/* Cursors overlay */}
          {Array.from(cursors.values()).map(cursor => (
            cursor.userId !== user?._id && (
              <div key={cursor.userId} className="remote-cursor"
                style={{ left: cursor.x, top: cursor.y }}>
                <svg width="16" height="20" viewBox="0 0 16 20" fill={cursor.color}>
                  <path d="M0 0L16 12L6 12L0 20Z" />
                </svg>
                <span className="cursor-label" style={{ background: cursor.color }}>
                  {cursor.displayName}
                </span>
              </div>
            )
          ))}

          <DragDropContext onDragEnd={handleDragEnd}>
            {COLUMNS.map(col => (
              <div key={col.id} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span className="material-icons-outlined" style={{ color: col.color, fontSize: 18 }}>{col.icon}</span>
                    <h3>{col.title}</h3>
                    <span className="kanban-column-count">{getColumnCards(col.id).length}</span>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => { setShowAddCard(col.id); setNewCardTitle(''); }}>
                    <span className="material-icons-outlined" style={{ fontSize: 18 }}>add</span>
                  </button>
                </div>

                {showAddCard === col.id && (
                  <div className="kanban-add-card card">
                    <input className="input-field" placeholder="Card title..." value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCard(col.id)}
                      autoFocus />
                    <div className="flex gap-sm" style={{ marginTop: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddCard(col.id)}>Add</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowAddCard(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div className={`kanban-cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                      ref={provided.innerRef} {...provided.droppableProps}>
                      {getColumnCards(col.id).map((card, index) => (
                        <Draggable key={card._id} draggableId={card._id} index={index}>
                          {(provided, snapshot) => (
                            <div className={`kanban-card card ${snapshot.isDragging ? 'dragging' : ''}`}
                              ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              onClick={() => { setEditingCard(card); setEditTitle(card.title); setEditDesc(card.description); }}>
                              <h4 className="kanban-card-title">{card.title}</h4>
                              {card.description && <p className="kanban-card-desc">{card.description}</p>}
                              <div className="kanban-card-footer">
                                {card.assigneeId && (
                                  <div className="avatar avatar-sm"
                                    style={{ background: getAvatarColor(card.assigneeId.displayName) }}>
                                    {getInitials(card.assigneeId.displayName)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </DragDropContext>

          {cardsLoading && (
            <div className="board-loading"><span className="spinner" /></div>
          )}
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <div className="chat-panel">
            <div className="chat-header">
              <span className="material-icons-outlined">chat_bubble</span>
              <h3>Project Chat</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setChatOpen(false)}
                style={{ marginLeft: 'auto' }}>
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg._id} className={`chat-message ${msg.userId?._id === user?._id ? 'own' : ''}`}>
                  <div className="avatar avatar-sm"
                    style={{ background: getAvatarColor(msg.userId?.displayName || 'U') }}>
                    {getInitials(msg.userId?.displayName || 'U')}
                  </div>
                  <div className="chat-message-content">
                    <span className="chat-message-author">{msg.userId?.displayName}</span>
                    <p className="chat-message-text">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input className="input-field" placeholder="Type a message..."
                value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
              <button type="submit" className="btn btn-primary btn-icon">
                <span className="material-icons-outlined">send</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="modal-overlay" onClick={() => setEditingCard(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Card</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditingCard(null)}>
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Title</label>
              <input className="input-field" value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea className="input-field" value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)} rows={4}
                style={{ resize: 'vertical' }} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger btn-sm"
                onClick={() => handleDeleteCard(editingCard._id)}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>delete</span>
                Delete
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-secondary" onClick={() => setEditingCard(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
