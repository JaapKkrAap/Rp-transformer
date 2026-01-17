/**
 * Roleplay Message Transformation System
 *
 * Main application component with multi-room state management.
 * Each room is a sealed narrative universe with isolated state.
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { History } from 'lucide-react';

import { RoomSidebar } from './components/RoomSidebar';
import { ConfigPanel } from './components/ConfigPanel';
import { Editor } from './components/Editor';
import { TransformResult } from './components/TransformResult';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsModal } from './components/SettingsModal';
import { LoadingAnimation } from './components/LoadingAnimation';

import { llmService } from './services/llmService';
import {
  loadState,
  saveState,
  loadLLMConfig,
  saveLLMConfig,
  createRoom,
} from './utils/storage';

import type {
  RPRoom,
  RPConfig,
  TransformationResult,
  LogicWarning,
  LLMProviderConfig,
} from './types';

import './App.css';

function App() {
  // ============================================
  // STATE
  // ============================================

  const [rooms, setRooms] = useState<RPRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [llmConfig, setLLMConfig] = useState<LLMProviderConfig | null>(null);

  // UI State
  const [isTransforming, setIsTransforming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState<TransformationResult | null>(null);
  const [warnings, setWarnings] = useState<LogicWarning[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // DERIVED STATE
  // ============================================

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    // Load persisted state
    const state = loadState();
    setRooms(state.rooms);
    setActiveRoomId(state.activeRoomId);

    // Load LLM config and initialize service
    const savedLLMConfig = loadLLMConfig();
    if (savedLLMConfig) {
      setLLMConfig(savedLLMConfig);
      try {
        llmService.configure(savedLLMConfig);
      } catch (err) {
        console.error('Failed to configure LLM service:', err);
      }
    }
  }, []);

  // ============================================
  // PERSISTENCE
  // ============================================

  useEffect(() => {
    if (rooms.length > 0 && activeRoomId) {
      saveState({ rooms, activeRoomId });
    }
  }, [rooms, activeRoomId]);

  // ============================================
  // ROOM ACTIONS
  // ============================================

  const updateActiveRoom = useCallback(
    (updates: Partial<RPRoom>) => {
      if (!activeRoomId) return;

      setRooms((prev) =>
        prev.map((room) =>
          room.id === activeRoomId
            ? { ...room, ...updates, lastActive: Date.now() }
            : room
        )
      );
    },
    [activeRoomId]
  );

  const handleConfigChange = useCallback(
    (configUpdates: Partial<RPConfig>) => {
      if (!activeRoom) return;
      updateActiveRoom({
        config: { ...activeRoom.config, ...configUpdates },
      });
    },
    [activeRoom, updateActiveRoom]
  );

  const handleDraftChange = useCallback(
    (draft: string) => {
      updateActiveRoom({ draft });
    },
    [updateActiveRoom]
  );

  const handleContextChange = useCallback(
    (context: string) => {
      updateActiveRoom({ context });
    },
    [updateActiveRoom]
  );

  const handleCreateRoom = useCallback((title: string, summary?: string) => {
    const newRoom = createRoom(title, summary);
    setRooms((prev) => [...prev, newRoom]);
    setActiveRoomId(newRoom.id);
    setCurrentResult(null);
    setWarnings([]);
  }, []);

  const handleDeleteRoom = useCallback(
    (id: string) => {
      setRooms((prev) => {
        if (prev.length <= 1) return prev; // Never delete the last room

        const newRooms = prev.filter((r) => r.id !== id);

        // If deleting active room, switch to another
        if (id === activeRoomId && newRooms.length > 0) {
          setActiveRoomId(newRooms[0].id);
          setCurrentResult(null);
          setWarnings([]);
        }

        return newRooms;
      });
    },
    [activeRoomId]
  );

  const handleSelectRoom = useCallback((id: string) => {
    setActiveRoomId(id);
    setCurrentResult(null);
    setWarnings([]);
    setError(null);
  }, []);

  const handleRestoreFromHistory = useCallback(
    (item: TransformationResult) => {
      if (!activeRoom) return;

      // Restore the draft and context from the history item
      updateActiveRoom({
        draft: item.original,
        context: item.context || activeRoom.context,
        config: item.config,
      });

      setCurrentResult(item);
      setHistoryOpen(false);
    },
    [activeRoom, updateActiveRoom]
  );

  // ============================================
  // LLM ACTIONS
  // ============================================

  const handleTransform = useCallback(async () => {
    if (!activeRoom || !activeRoom.draft.trim()) return;

    if (!llmService.isConfigured()) {
      setError('Please configure an LLM provider in settings.');
      setSettingsOpen(true);
      return;
    }

    setIsTransforming(true);
    setError(null);
    setWarnings([]);

    try {
      const result = await llmService.transform({
        draft: activeRoom.draft,
        config: activeRoom.config,
        context: activeRoom.context || undefined,
        roomTitle: activeRoom.title,
        roomSummary: activeRoom.summary,
      });

      if (result.success) {
        const transformResult: TransformationResult = {
          id: uuidv4(),
          original: activeRoom.draft,
          context: activeRoom.context || undefined,
          transformed: result.transformed,
          timestamp: Date.now(),
          config: { ...activeRoom.config },
        };

        // Add to history
        updateActiveRoom({
          history: [...activeRoom.history, transformResult],
        });

        setCurrentResult(transformResult);
      } else {
        setError(result.error || 'Transformation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsTransforming(false);
    }
  }, [activeRoom, updateActiveRoom]);

  const handleCheckLogic = useCallback(async () => {
    if (!activeRoom || !activeRoom.draft.trim() || !activeRoom.config.persona.trim()) {
      return;
    }

    if (!llmService.isConfigured()) {
      setError('Please configure an LLM provider in settings.');
      setSettingsOpen(true);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setWarnings([]);
    setCurrentResult(null);

    try {
      const result = await llmService.analyzeLogic({
        draft: activeRoom.draft,
        persona: activeRoom.config.persona,
        context: activeRoom.context || undefined,
        genre: activeRoom.config.genre,
      });

      if (result.success) {
        setWarnings(result.warnings);
        if (result.warnings.length === 0) {
          setError(null);
        }
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeRoom]);

  const handleEditResult = useCallback(
    (newText: string) => {
      if (!currentResult || !activeRoom) return;

      const updatedResult = { ...currentResult, transformed: newText };
      setCurrentResult(updatedResult);

      // Update in history
      updateActiveRoom({
        history: activeRoom.history.map((h) =>
          h.id === currentResult.id ? updatedResult : h
        ),
      });
    },
    [currentResult, activeRoom, updateActiveRoom]
  );

  // ============================================
  // SETTINGS ACTIONS
  // ============================================

  const handleSaveSettings = useCallback((config: LLMProviderConfig) => {
    setLLMConfig(config);
    saveLLMConfig(config);
    try {
      llmService.configure(config);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure LLM');
    }
  }, []);

  // ============================================
  // RENDER
  // ============================================

  if (!activeRoom) {
    return (
      <div className="app loading">
        <LoadingAnimation type="transform" />
      </div>
    );
  }

  return (
    <div className="app">
      {/* Room Sidebar */}
      <RoomSidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={handleSelectRoom}
        onCreateRoom={handleCreateRoom}
        onDeleteRoom={handleDeleteRoom}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="app-header">
          <div className="room-info">
            <h1>{activeRoom.title}</h1>
            {activeRoom.summary && <p className="room-summary">{activeRoom.summary}</p>}
          </div>
          <button
            className="history-btn"
            onClick={() => setHistoryOpen(true)}
            disabled={activeRoom.history.length === 0}
          >
            <History size={18} />
            <span>History ({activeRoom.history.length})</span>
          </button>
        </header>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {/* Content Grid */}
        <div className="content-grid">
          {/* Left Column: Config + Editor */}
          <div className="left-column">
            <ConfigPanel
              config={activeRoom.config}
              onChange={handleConfigChange}
              disabled={isTransforming}
            />
            <Editor
              context={activeRoom.context}
              draft={activeRoom.draft}
              persona={activeRoom.config.persona}
              onContextChange={handleContextChange}
              onDraftChange={handleDraftChange}
              onTransform={handleTransform}
              onCheckLogic={handleCheckLogic}
              isTransforming={isTransforming}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Right Column: Result */}
          <div className="right-column">
            {isTransforming ? (
              <div className="result-loading">
                <LoadingAnimation type="transform" />
              </div>
            ) : isAnalyzing ? (
              <div className="result-loading">
                <LoadingAnimation type="analyze" />
              </div>
            ) : (
              <TransformResult
                result={currentResult}
                warnings={warnings}
                onEdit={handleEditResult}
              />
            )}
          </div>
        </div>
      </main>

      {/* History Panel */}
      <HistoryPanel
        isOpen={historyOpen}
        history={activeRoom.history}
        onClose={() => setHistoryOpen(false)}
        onRestore={handleRestoreFromHistory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        config={llmConfig}
        onSave={handleSaveSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
