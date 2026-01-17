/**
 * LLM Service Abstraction Layer
 *
 * Provides a unified interface for multiple LLM providers.
 * Model choice is a configuration concern, not a logic concern.
 */

import type {
  LLMProviderConfig,
  LogicAnalysisRequest,
  LogicAnalysisResult,
  TransformRequest,
  TransformResult,
  LogicWarning,
} from '../types';

// ============================================
// PROMPT TEMPLATES
// ============================================

const LOGIC_ANALYSIS_SYSTEM_PROMPT = `You are a strict roleplay editor. Your ONLY task is to detect roleplay violations.

You MUST:
- Enforce persona fidelity (character stays in character)
- Enforce scene continuity (no contradictions with established context)
- Flag agency violations (controlling other characters' actions/thoughts)
- Detect metagaming (using out-of-character knowledge)
- Identify tone drift (breaking established genre/mood)

You MUST NOT:
- Rewrite or edit the content
- Provide creative suggestions
- Expand on the narrative

Output ONLY valid JSON matching this schema:
{
  "warnings": [
    {
      "type": "Inconsistency" | "Metagaming" | "Agency" | "Tone",
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ]
}

If no issues are found, return: {"warnings": []}`;

const buildLogicAnalysisUserPrompt = (request: LogicAnalysisRequest): string => {
  let prompt = `Analyze this roleplay draft for violations:\n\n`;
  prompt += `**GENRE:** ${request.genre}\n\n`;
  prompt += `**PERSONA:**\n${request.persona}\n\n`;

  if (request.context) {
    prompt += `**SCENE CONTEXT:**\n${request.context}\n\n`;
  }

  prompt += `**DRAFT TO ANALYZE:**\n${request.draft}\n\n`;
  prompt += `Respond with JSON only. No explanations.`;

  return prompt;
};

const TRANSFORM_SYSTEM_PROMPT = `You are an expert roleplay prose writer. Your task is to transform rough drafts into immersive narrative prose.

CRITICAL RULES:
- Output ONLY the transformed narrative prose
- NO meta commentary
- NO explanations of changes
- NO preambles like "Here is the transformed text:"
- Maintain character voice and perspective
- Respect the intensity level
- Match the genre's tone and conventions
- Never break the fourth wall
- Do not control other characters beyond what the draft indicates

The output should read as natural, flowing narrative prose that could appear in a roleplay or collaborative fiction.`;

const buildTransformUserPrompt = (request: TransformRequest): string => {
  let prompt = `Transform this draft into immersive roleplay prose.\n\n`;
  prompt += `═══════════════════════════════════════\n`;
  prompt += `ROOM CONTEXT\n`;
  prompt += `═══════════════════════════════════════\n`;
  prompt += `**Title:** ${request.roomTitle}\n`;
  prompt += `**Genre:** ${request.config.genre}\n`;
  prompt += `**Intensity:** ${request.config.intensity}/10\n`;

  if (request.roomSummary) {
    prompt += `**Summary:** ${request.roomSummary}\n`;
  }

  prompt += `**Persona:**\n${request.config.persona || 'Not specified'}\n\n`;

  if (request.context) {
    prompt += `═══════════════════════════════════════\n`;
    prompt += `SCENE CONTEXT\n`;
    prompt += `═══════════════════════════════════════\n`;
    prompt += `${request.context}\n\n`;
  }

  prompt += `═══════════════════════════════════════\n`;
  prompt += `TRANSFORMATION SETTINGS\n`;
  prompt += `═══════════════════════════════════════\n`;
  prompt += `- Genre: ${request.config.genre}\n`;
  prompt += `- Length: ${request.config.length}\n`;
  prompt += `- Perspective: ${request.config.perspective}\n`;
  prompt += `- Intensity: ${request.config.intensity}/10\n\n`;

  prompt += `═══════════════════════════════════════\n`;
  prompt += `DRAFT TO TRANSFORM\n`;
  prompt += `═══════════════════════════════════════\n`;
  prompt += `${request.draft}\n\n`;

  prompt += `Transform this into immersive ${request.config.perspective.toLowerCase()} narrative prose. Output only the transformed text.`;

  return prompt;
};

// ============================================
// PROVIDER IMPLEMENTATIONS
// ============================================

interface LLMClient {
  analyze(request: LogicAnalysisRequest): Promise<LogicAnalysisResult>;
  transform(request: TransformRequest): Promise<TransformResult>;
}

/**
 * Google Gemini Provider
 */
class GeminiClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(config: LLMProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-1.5-flash';
  }

  private async generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async analyze(request: LogicAnalysisRequest): Promise<LogicAnalysisResult> {
    try {
      const text = await this.generateContent(
        LOGIC_ANALYSIS_SYSTEM_PROMPT,
        buildLogicAnalysisUserPrompt(request)
      );

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { warnings: [], success: false, error: 'Failed to parse JSON response' };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return { warnings: parsed.warnings || [], success: true };
    } catch (error) {
      return {
        warnings: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async transform(request: TransformRequest): Promise<TransformResult> {
    try {
      const transformed = await this.generateContent(
        TRANSFORM_SYSTEM_PROMPT,
        buildTransformUserPrompt(request)
      );
      return { transformed: transformed.trim(), success: true };
    } catch (error) {
      return {
        transformed: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Anthropic Claude Provider
 */
class ClaudeClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(config: LLMProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Claude API key is required');
    }
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-3-5-sonnet-20241022';
  }

  private async generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  async analyze(request: LogicAnalysisRequest): Promise<LogicAnalysisResult> {
    try {
      const text = await this.generateContent(
        LOGIC_ANALYSIS_SYSTEM_PROMPT,
        buildLogicAnalysisUserPrompt(request)
      );

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { warnings: [], success: false, error: 'Failed to parse JSON response' };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return { warnings: parsed.warnings || [], success: true };
    } catch (error) {
      return {
        warnings: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async transform(request: TransformRequest): Promise<TransformResult> {
    try {
      const transformed = await this.generateContent(
        TRANSFORM_SYSTEM_PROMPT,
        buildTransformUserPrompt(request)
      );
      return { transformed: transformed.trim(), success: true };
    } catch (error) {
      return {
        transformed: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * OpenAI GPT Provider
 */
class OpenAIClient implements LLMClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: LLMProviderConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  private async generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async analyze(request: LogicAnalysisRequest): Promise<LogicAnalysisResult> {
    try {
      const text = await this.generateContent(
        LOGIC_ANALYSIS_SYSTEM_PROMPT,
        buildLogicAnalysisUserPrompt(request)
      );

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { warnings: [], success: false, error: 'Failed to parse JSON response' };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return { warnings: parsed.warnings || [], success: true };
    } catch (error) {
      return {
        warnings: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async transform(request: TransformRequest): Promise<TransformResult> {
    try {
      const transformed = await this.generateContent(
        TRANSFORM_SYSTEM_PROMPT,
        buildTransformUserPrompt(request)
      );
      return { transformed: transformed.trim(), success: true };
    } catch (error) {
      return {
        transformed: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Local/Open-weight Model Provider (OpenAI-compatible API)
 */
class LocalClient implements LLMClient {
  private baseUrl: string;
  private model: string;
  private apiKey: string;

  constructor(config: LLMProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434/v1';
    this.model = config.model || 'llama3';
    this.apiKey = config.apiKey || 'ollama'; // Ollama uses dummy key
  }

  private async generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Local API error: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async analyze(request: LogicAnalysisRequest): Promise<LogicAnalysisResult> {
    try {
      const text = await this.generateContent(
        LOGIC_ANALYSIS_SYSTEM_PROMPT,
        buildLogicAnalysisUserPrompt(request)
      );

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { warnings: [], success: false, error: 'Failed to parse JSON response' };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return { warnings: parsed.warnings || [], success: true };
    } catch (error) {
      return {
        warnings: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async transform(request: TransformRequest): Promise<TransformResult> {
    try {
      const transformed = await this.generateContent(
        TRANSFORM_SYSTEM_PROMPT,
        buildTransformUserPrompt(request)
      );
      return { transformed: transformed.trim(), success: true };
    } catch (error) {
      return {
        transformed: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ============================================
// MAIN SERVICE
// ============================================

/**
 * LLM Service - Unified interface for all providers
 */
class LLMService {
  private client: LLMClient | null = null;
  private config: LLMProviderConfig | null = null;

  /**
   * Configure the LLM service with a provider
   */
  configure(config: LLMProviderConfig): void {
    this.config = config;

    switch (config.provider) {
      case 'gemini':
        this.client = new GeminiClient(config);
        break;
      case 'claude':
        this.client = new ClaudeClient(config);
        break;
      case 'openai':
        this.client = new OpenAIClient(config);
        break;
      case 'local':
        this.client = new LocalClient(config);
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMProviderConfig | null {
    return this.config;
  }

  /**
   * Analyze draft for roleplay violations
   * Returns structured LogicWarning[] with graceful error handling
   */
  async analyzeLogic(request: LogicAnalysisRequest): Promise<LogicAnalysisResult> {
    if (!this.client) {
      return {
        warnings: [],
        success: false,
        error: 'LLM service not configured. Please configure an API key.',
      };
    }
    return this.client.analyze(request);
  }

  /**
   * Transform draft into immersive roleplay prose
   */
  async transform(request: TransformRequest): Promise<TransformResult> {
    if (!this.client) {
      return {
        transformed: '',
        success: false,
        error: 'LLM service not configured. Please configure an API key.',
      };
    }
    return this.client.transform(request);
  }
}

// Export singleton instance
export const llmService = new LLMService();

// Export types for convenience
export type { LLMClient, LogicWarning };
