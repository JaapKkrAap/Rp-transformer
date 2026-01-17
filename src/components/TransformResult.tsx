/**
 * Transform Result Component
 *
 * Displays the latest transformation result with edit and copy actions.
 */

import { useState } from 'react';
import { Copy, Check, Edit2, X, Save, Clock } from 'lucide-react';
import type { TransformationResult, LogicWarning } from '../types';

interface TransformResultProps {
  result: TransformationResult | null;
  warnings: LogicWarning[];
  onEdit?: (newText: string) => void;
  onCopy?: () => void;
}

export function TransformResult({
  result,
  warnings,
  onEdit,
  onCopy,
}: TransformResultProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.transformed);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleStartEdit = () => {
    if (!result) return;
    setEditText(result.transformed);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onEdit?.(editText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWarningColor = (type: LogicWarning['type']) => {
    switch (type) {
      case 'Inconsistency':
        return 'warning-yellow';
      case 'Metagaming':
        return 'warning-orange';
      case 'Agency':
        return 'warning-red';
      case 'Tone':
        return 'warning-purple';
      default:
        return 'warning-gray';
    }
  };

  // Show warnings if present
  if (warnings.length > 0) {
    return (
      <div className="transform-result warnings-result">
        <div className="result-header">
          <h3>Logic Analysis Results</h3>
        </div>
        <div className="warnings-list">
          {warnings.map((warning, index) => (
            <div
              key={index}
              className={`warning-item ${getWarningColor(warning.type)}`}
            >
              <div className="warning-header">
                <span className="warning-type">{warning.type}</span>
              </div>
              <p className="warning-message">{warning.message}</p>
              <p className="warning-suggestion">
                <strong>Suggestion:</strong> {warning.suggestion}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="transform-result empty">
        <div className="empty-state">
          <p>Your transformed prose will appear here</p>
          <span className="empty-hint">
            Write a draft and click "Transform Draft" to begin
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="transform-result">
      <div className="result-header">
        <h3>Transformed Prose</h3>
        <div className="result-meta">
          <span className="result-genre">{result.config.genre}</span>
          <span className="result-time">
            <Clock size={14} />
            {formatTime(result.timestamp)}
          </span>
        </div>
      </div>

      <div className="result-content">
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="result-edit-textarea"
            autoFocus
          />
        ) : (
          <div className="result-text">{result.transformed}</div>
        )}
      </div>

      <div className="result-actions">
        {isEditing ? (
          <>
            <button className="action-btn save" onClick={handleSaveEdit}>
              <Save size={16} />
              <span>Save</span>
            </button>
            <button className="action-btn cancel" onClick={handleCancelEdit}>
              <X size={16} />
              <span>Cancel</span>
            </button>
          </>
        ) : (
          <>
            <button className="action-btn" onClick={handleStartEdit}>
              <Edit2 size={16} />
              <span>Edit</span>
            </button>
            <button className="action-btn" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
