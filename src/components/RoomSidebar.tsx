/**
 * Room Sidebar Component
 *
 * Manages room list, switching, creation, and deletion.
 * Each room is a sealed narrative universe with isolated state.
 */

import { useState } from 'react';
import {
  Plus,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import type { RPRoom } from '../types';

interface RoomSidebarProps {
  rooms: RPRoom[];
  activeRoomId: string;
  onSelectRoom: (id: string) => void;
  onCreateRoom: (title: string, summary?: string) => void;
  onDeleteRoom: (id: string) => void;
  onOpenSettings: () => void;
}

export function RoomSidebar({
  rooms,
  activeRoomId,
  onSelectRoom,
  onCreateRoom,
  onDeleteRoom,
  onOpenSettings,
}: RoomSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreateRoom = () => {
    if (newTitle.trim()) {
      onCreateRoom(newTitle.trim(), newSummary.trim() || undefined);
      setNewTitle('');
      setNewSummary('');
      setIsCreating(false);
    }
  };

  const handleDeleteRoom = (id: string) => {
    if (rooms.length <= 1) {
      return; // Cannot delete the last room
    }
    onDeleteRoom(id);
    setDeleteConfirmId(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isCollapsed) {
    return (
      <div className="room-sidebar collapsed">
        <button
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(false)}
          title="Expand sidebar"
        >
          <ChevronRight size={20} />
        </button>
        <div className="collapsed-rooms">
          {rooms.map((room) => (
            <button
              key={room.id}
              className={`collapsed-room-btn ${room.id === activeRoomId ? 'active' : ''}`}
              onClick={() => onSelectRoom(room.id)}
              title={room.title}
            >
              <MessageSquare size={18} />
            </button>
          ))}
        </div>
        <button
          className="collapsed-room-btn settings-btn"
          onClick={onOpenSettings}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="room-sidebar">
      <div className="sidebar-header">
        <h2>Rooms</h2>
        <button
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(true)}
          title="Collapse sidebar"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="room-list">
        {rooms
          .sort((a, b) => b.lastActive - a.lastActive)
          .map((room) => (
            <div
              key={room.id}
              className={`room-item ${room.id === activeRoomId ? 'active' : ''}`}
              onClick={() => onSelectRoom(room.id)}
            >
              <div className="room-icon">
                <MessageSquare size={18} />
              </div>
              <div className="room-info">
                <div className="room-title">{room.title}</div>
                <div className="room-meta">
                  <span className="room-genre">{room.config.genre}</span>
                  <span className="room-time">{formatDate(room.lastActive)}</span>
                </div>
              </div>
              {rooms.length > 1 && (
                <button
                  className="room-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(room.id);
                  }}
                  title="Delete room"
                >
                  <Trash2 size={14} />
                </button>
              )}

              {deleteConfirmId === room.id && (
                <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                  <p>Delete this room?</p>
                  <div className="delete-confirm-actions">
                    <button
                      className="confirm-yes"
                      onClick={() => handleDeleteRoom(room.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="confirm-no"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {isCreating ? (
        <div className="create-room-form">
          <input
            type="text"
            placeholder="Room title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
            autoFocus
          />
          <textarea
            placeholder="Brief summary (optional)..."
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            rows={2}
          />
          <div className="create-room-actions">
            <button className="create-btn" onClick={handleCreateRoom}>
              Create
            </button>
            <button
              className="cancel-btn"
              onClick={() => {
                setIsCreating(false);
                setNewTitle('');
                setNewSummary('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="new-room-btn" onClick={() => setIsCreating(true)}>
          <Plus size={18} />
          <span>New Room</span>
        </button>
      )}

      <button className="settings-btn" onClick={onOpenSettings}>
        <Settings size={18} />
        <span>Settings</span>
      </button>
    </div>
  );
}
