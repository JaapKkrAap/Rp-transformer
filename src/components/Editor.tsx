/**
 * Editor Component
 *
 * Provides context and draft editing with markdown helpers.
 * Context is collapsible, draft is the main focus.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  Quote,
  Sparkles,
  Search,
  Loader2,
} from 'lucide-react';

interface EditorProps {
  context: string;
  draft: string;
  persona: string;
  onContextChange: (context: string) => void;
  onDraftChange: (draft: string) => void;
  onTransform: () => void;
  onCheckLogic: () => void;
  isTransforming: boolean;
  isAnalyzing: boolean;
}

export function Editor({
  context,
  draft,
  persona,
  onContextChange,
  onDraftChange,
  onTransform,
  onCheckLogic,
  isTransforming,
  isAnalyzing,
}: EditorProps) {
  const [contextExpanded, setContextExpanded] = useState(!!context);

  const insertMarkdown = (prefix: string, suffix: string = prefix) => {
    const textarea = document.getElementById('draft-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = draft.substring(start, end);
    const newText =
      draft.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      draft.substring(end);

    onDraftChange(newText);

    // Restore cursor position after React re-render
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  const canTransform = draft.trim().length > 0 && !isTransforming && !isAnalyzing;
  const canAnalyze =
    draft.trim().length > 0 &&
    persona.trim().length > 0 &&
    !isTransforming &&
    !isAnalyzing;

  return (
    <div className="editor">
      {/* Context Section (Collapsible) */}
      <div className="context-section">
        <button
          className="context-toggle"
          onClick={() => setContextExpanded(!contextExpanded)}
        >
          <span>Scene Context</span>
          {contextExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {contextExpanded && (
          <div className="context-content">
            <textarea
              placeholder="Set the scene... Describe the location, time, atmosphere, and any relevant events that have occurred. This context helps maintain continuity in transformations."
              value={context}
              onChange={(e) => onContextChange(e.target.value)}
              rows={4}
              disabled={isTransforming}
            />
            <div className="field-hint">
              Context is preserved between transformations within this room.
            </div>
          </div>
        )}
      </div>

      {/* Draft Section */}
      <div className="draft-section">
        <div className="draft-header">
          <label htmlFor="draft-textarea">Draft</label>
          <div className="markdown-toolbar">
            <button
              type="button"
              onClick={() => insertMarkdown('**')}
              title="Bold"
              disabled={isTransforming}
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('*')}
              title="Italic"
              disabled={isTransforming}
            >
              <Italic size={16} />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('\n> ', '\n')}
              title="Quote"
              disabled={isTransforming}
            >
              <Quote size={16} />
            </button>
          </div>
        </div>

        <textarea
          id="draft-textarea"
          placeholder="Write your rough draft here... Describe what your character does, says, thinks, or feels. The AI will transform this into immersive narrative prose."
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={10}
          disabled={isTransforming}
        />

        <div className="draft-footer">
          <span className="char-count">{draft.length} characters</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="editor-actions">
        <button
          className="action-btn primary"
          onClick={onTransform}
          disabled={!canTransform}
        >
          {isTransforming ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Weaving Magic...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Transform Draft</span>
            </>
          )}
        </button>

        <button
          className="action-btn secondary"
          onClick={onCheckLogic}
          disabled={!canAnalyze}
          title={!persona.trim() ? 'Persona required for logic check' : undefined}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Search size={18} />
              <span>Check Logic</span>
            </>
          )}
        </button>
      </div>

      {!persona.trim() && (
        <div className="editor-warning">
          Add a character persona in settings to enable logic checking.
        </div>
      )}
    </div>
  );
}
