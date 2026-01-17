/**
 * History Panel Component
 *
 * Slide-out panel showing transformation history.
 * Provides restore and copy actions for each item.
 */

import { useState } from 'react';
import { X, History, Copy, Check, RotateCcw, ChevronRight } from 'lucide-react';
import type { TransformationResult } from '../types';

interface HistoryPanelProps {
  isOpen: boolean;
  history: TransformationResult[];
  onClose: () => void;
  onRestore: (item: TransformationResult) => void;
}

export function HistoryPanel({
  isOpen,
  history,
  onClose,
  onRestore,
}: HistoryPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCopy = async (item: TransformationResult) => {
    try {
      await navigator.clipboard.writeText(item.transformed);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`history-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`history-panel ${isOpen ? 'open' : ''}`}>
        <div className="history-header">
          <div className="history-title">
            <History size={20} />
            <h2>Transformation History</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="history-content">
          {history.length === 0 ? (
            <div className="history-empty">
              <p>No transformations yet</p>
              <span>Your transformation history will appear here</span>
            </div>
          ) : (
            <div className="history-list">
              {history
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`history-item ${expandedId === item.id ? 'expanded' : ''}`}
                  >
                    <div
                      className="history-item-header"
                      onClick={() =>
                        setExpandedId(expandedId === item.id ? null : item.id)
                      }
                    >
                      <div className="history-item-info">
                        <span className="history-genre">{item.config.genre}</span>
                        <span className="history-time">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <ChevronRight
                        size={18}
                        className={`expand-icon ${expandedId === item.id ? 'expanded' : ''}`}
                      />
                    </div>

                    <div className="history-item-preview">
                      {truncateText(item.transformed)}
                    </div>

                    {expandedId === item.id && (
                      <div className="history-item-expanded">
                        <div className="history-section">
                          <h4>Original Draft</h4>
                          <div className="history-text">{item.original}</div>
                        </div>

                        {item.context && (
                          <div className="history-section">
                            <h4>Context Used</h4>
                            <div className="history-text">{item.context}</div>
                          </div>
                        )}

                        <div className="history-section">
                          <h4>Transformed Result</h4>
                          <div className="history-text">{item.transformed}</div>
                        </div>

                        <div className="history-config">
                          <span>Length: {item.config.length}</span>
                          <span>Perspective: {item.config.perspective}</span>
                          <span>Intensity: {item.config.intensity}/10</span>
                        </div>
                      </div>
                    )}

                    <div className="history-item-actions">
                      <button
                        className="history-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore(item);
                        }}
                        title="Restore this transformation"
                      >
                        <RotateCcw size={14} />
                        <span>Restore</span>
                      </button>
                      <button
                        className="history-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item);
                        }}
                        title="Copy to clipboard"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check size={14} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
