// Roleplay Message Transformation System - Type Definitions

// ============================================
// ENUMS
// ============================================

export type Genre =
  | 'Romantic'
  | 'Horror'
  | 'Sci-Fi'
  | 'Fantasy'
  | 'Mystery'
  | 'Adventure'
  | 'Slice of Life'
  | 'Drama'
  | 'Comedy'
  | 'Thriller';

export type Length = 'Short' | 'Standard' | 'Literary';

export type Perspective = 'First Person' | 'Third Person Limited';

export type WarningType = 'Inconsistency' | 'Metagaming' | 'Agency' | 'Tone';

// ============================================
// CORE INTERFACES
// ============================================

/**
 * Configuration for roleplay transformation
 * Controls how drafts are transformed into immersive prose
 */
export interface RPConfig {
  /** Genre of the roleplay scene */
  genre: Genre;
  /** Target length of the transformed output */
  length: Length;
  /** Narrative perspective */
  perspective: Perspective;
  /** Intensity level from 1 (mild) to 10 (intense) */
  intensity: number;
  /** Character persona description */
  persona: string;
}

/**
 * Warning generated during logic analysis
 * Flags roleplay violations without rewriting content
 */
export interface LogicWarning {
  /** Type of warning detected */
  type: WarningType;
  /** Description of the issue */
  message: string;
  /** Suggested fix or improvement */
  suggestion: string;
}

/**
 * Result of a transformation operation
 * Stored in room history for restoration
 */
export interface TransformationResult {
  /** Unique identifier */
  id: string;
  /** Original draft text */
  original: string;
  /** Context at time of transformation */
  context?: string;
  /** Transformed prose output */
  transformed: string;
  /** Unix timestamp of transformation */
  timestamp: number;
  /** Configuration used for transformation */
  config: RPConfig;
}

/**
 * A roleplay room - sealed narrative universe
 * Each room maintains isolated state and context
 */
export interface RPRoom {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Optional summary of the room's narrative */
  summary?: string;
  /** Unix timestamp of last activity */
  lastActive: number;
  /** Room-specific configuration */
  config: RPConfig;
  /** Current scene context */
  context: string;
  /** Current draft being edited */
  draft: string;
  /** Transformation history */
  history: TransformationResult[];
}

// ============================================
// LLM SERVICE INTERFACES
// ============================================

/**
 * Supported LLM providers
 */
export type LLMProvider = 'gemini' | 'claude' | 'openai' | 'local';

/**
 * Configuration for an LLM provider
 */
export interface LLMProviderConfig {
  provider: LLMProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

/**
 * Request for logic analysis
 */
export interface LogicAnalysisRequest {
  draft: string;
  persona: string;
  context?: string;
  genre: Genre;
}

/**
 * Request for roleplay transformation
 */
export interface TransformRequest {
  draft: string;
  config: RPConfig;
  context?: string;
  roomTitle: string;
  roomSummary?: string;
}

/**
 * Result from logic analysis
 */
export interface LogicAnalysisResult {
  warnings: LogicWarning[];
  success: boolean;
  error?: string;
}

/**
 * Result from transformation
 */
export interface TransformResult {
  transformed: string;
  success: boolean;
  error?: string;
}

// ============================================
// APPLICATION STATE INTERFACES
// ============================================

/**
 * Persisted application state
 */
export interface PersistedState {
  rooms: RPRoom[];
  activeRoomId: string;
  llmConfig?: LLMProviderConfig;
}

/**
 * Legacy single-room state (for migration)
 */
export interface LegacySingleRoomState {
  config?: RPConfig;
  context?: string;
  draft?: string;
  history?: TransformationResult[];
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_CONFIG: RPConfig = {
  genre: 'Fantasy',
  length: 'Standard',
  perspective: 'Third Person Limited',
  intensity: 5,
  persona: '',
};

export const GENRES: Genre[] = [
  'Romantic',
  'Horror',
  'Sci-Fi',
  'Fantasy',
  'Mystery',
  'Adventure',
  'Slice of Life',
  'Drama',
  'Comedy',
  'Thriller',
];

export const LENGTHS: Length[] = ['Short', 'Standard', 'Literary'];

export const PERSPECTIVES: Perspective[] = ['First Person', 'Third Person Limited'];
