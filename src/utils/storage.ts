/**
 * localStorage Persistence Utilities
 *
 * Handles saving/loading application state with migration support for legacy data.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  RPRoom,
  RPConfig,
  PersistedState,
  LegacySingleRoomState,
  LLMProviderConfig,
  TransformationResult,
} from '../types';
import { DEFAULT_CONFIG } from '../types';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  /** Current multi-room state */
  STATE: 'rp-transformer-state',
  /** LLM configuration (stored separately for security) */
  LLM_CONFIG: 'rp-transformer-llm-config',

  // Legacy keys for migration
  LEGACY_CONFIG: 'rp-transformer-config',
  LEGACY_CONTEXT: 'rp-transformer-context',
  LEGACY_DRAFT: 'rp-transformer-draft',
  LEGACY_HISTORY: 'rp-transformer-history',
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a new room with default values
 */
export function createRoom(title: string, summary?: string): RPRoom {
  return {
    id: uuidv4(),
    title,
    summary,
    lastActive: Date.now(),
    config: { ...DEFAULT_CONFIG },
    context: '',
    draft: '',
    history: [],
  };
}

/**
 * Create the default initial room
 */
function createDefaultRoom(): RPRoom {
  return createRoom('New Roleplay', 'A fresh narrative canvas awaits...');
}

// ============================================
// LEGACY MIGRATION
// ============================================

/**
 * Check if legacy single-room data exists
 */
function hasLegacyData(): boolean {
  return !!(
    localStorage.getItem(STORAGE_KEYS.LEGACY_CONFIG) ||
    localStorage.getItem(STORAGE_KEYS.LEGACY_CONTEXT) ||
    localStorage.getItem(STORAGE_KEYS.LEGACY_DRAFT) ||
    localStorage.getItem(STORAGE_KEYS.LEGACY_HISTORY)
  );
}

/**
 * Load legacy single-room data
 */
function loadLegacyData(): LegacySingleRoomState {
  const state: LegacySingleRoomState = {};

  try {
    const configStr = localStorage.getItem(STORAGE_KEYS.LEGACY_CONFIG);
    if (configStr) {
      state.config = JSON.parse(configStr) as RPConfig;
    }
  } catch {
    // Ignore parse errors
  }

  state.context = localStorage.getItem(STORAGE_KEYS.LEGACY_CONTEXT) || undefined;
  state.draft = localStorage.getItem(STORAGE_KEYS.LEGACY_DRAFT) || undefined;

  try {
    const historyStr = localStorage.getItem(STORAGE_KEYS.LEGACY_HISTORY);
    if (historyStr) {
      state.history = JSON.parse(historyStr) as TransformationResult[];
    }
  } catch {
    // Ignore parse errors
  }

  return state;
}

/**
 * Migrate legacy data to multi-room format
 */
function migrateLegacyData(): PersistedState {
  const legacy = loadLegacyData();
  const room = createDefaultRoom();

  // Apply legacy data to the migrated room
  if (legacy.config) {
    room.config = { ...DEFAULT_CONFIG, ...legacy.config };
  }
  if (legacy.context) {
    room.context = legacy.context;
  }
  if (legacy.draft) {
    room.draft = legacy.draft;
  }
  if (legacy.history) {
    room.history = legacy.history;
  }

  room.title = 'Migrated Roleplay';
  room.summary = 'Imported from previous session';

  // Clear legacy keys after migration
  localStorage.removeItem(STORAGE_KEYS.LEGACY_CONFIG);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_CONTEXT);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_DRAFT);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_HISTORY);

  return {
    rooms: [room],
    activeRoomId: room.id,
  };
}

// ============================================
// MAIN STORAGE FUNCTIONS
// ============================================

/**
 * Load application state from localStorage
 * Handles migration from legacy format if needed
 */
export function loadState(): PersistedState {
  // Check for existing multi-room state
  const stateStr = localStorage.getItem(STORAGE_KEYS.STATE);

  if (stateStr) {
    try {
      const state = JSON.parse(stateStr) as PersistedState;

      // Validate state structure
      if (state.rooms && Array.isArray(state.rooms) && state.rooms.length > 0) {
        // Ensure activeRoomId is valid
        const activeRoom = state.rooms.find((r) => r.id === state.activeRoomId);
        if (!activeRoom) {
          state.activeRoomId = state.rooms[0].id;
        }
        return state;
      }
    } catch {
      // Fall through to migration or default
    }
  }

  // Check for legacy data to migrate
  if (hasLegacyData()) {
    const migratedState = migrateLegacyData();
    saveState(migratedState);
    return migratedState;
  }

  // Create default state with one room
  const defaultRoom = createDefaultRoom();
  return {
    rooms: [defaultRoom],
    activeRoomId: defaultRoom.id,
  };
}

/**
 * Save application state to localStorage
 */
export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * Load LLM configuration
 */
export function loadLLMConfig(): LLMProviderConfig | null {
  try {
    const configStr = localStorage.getItem(STORAGE_KEYS.LLM_CONFIG);
    if (configStr) {
      return JSON.parse(configStr) as LLMProviderConfig;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Save LLM configuration
 */
export function saveLLMConfig(config: LLMProviderConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LLM_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save LLM config:', error);
  }
}

/**
 * Clear LLM configuration
 */
export function clearLLMConfig(): void {
  localStorage.removeItem(STORAGE_KEYS.LLM_CONFIG);
}

/**
 * Clear all application data
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.STATE);
  localStorage.removeItem(STORAGE_KEYS.LLM_CONFIG);
}
