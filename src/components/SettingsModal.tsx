/**
 * Settings Modal Component
 *
 * Configures LLM provider settings and API keys.
 */

import { useState, useEffect } from 'react';
import { X, Key, Server, Check, AlertCircle } from 'lucide-react';
import type { LLMProvider, LLMProviderConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  config: LLMProviderConfig | null;
  onSave: (config: LLMProviderConfig) => void;
  onClose: () => void;
}

const PROVIDER_INFO: Record<LLMProvider, { name: string; defaultModel: string; modelOptions: string[] }> = {
  gemini: {
    name: 'Google Gemini',
    defaultModel: 'gemini-1.5-flash',
    modelOptions: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
  },
  claude: {
    name: 'Anthropic Claude',
    defaultModel: 'claude-3-5-sonnet-20241022',
    modelOptions: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  },
  openai: {
    name: 'OpenAI GPT',
    defaultModel: 'gpt-4o',
    modelOptions: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  local: {
    name: 'Local Model',
    defaultModel: 'llama3',
    modelOptions: ['llama3', 'mistral', 'codellama', 'custom'],
  },
};

export function SettingsModal({
  isOpen,
  config,
  onSave,
  onClose,
}: SettingsModalProps) {
  const [provider, setProvider] = useState<LLMProvider>(config?.provider || 'gemini');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [model, setModel] = useState(config?.model || '');
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || '');
  const [customModel, setCustomModel] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setApiKey(config.apiKey || '');
      setModel(config.model || PROVIDER_INFO[config.provider].defaultModel);
      setBaseUrl(config.baseUrl || '');
    }
  }, [config]);

  useEffect(() => {
    // Reset model when provider changes
    setModel(PROVIDER_INFO[provider].defaultModel);
    if (provider === 'local') {
      setBaseUrl('http://localhost:11434/v1');
    }
  }, [provider]);

  const handleSave = () => {
    const finalModel = model === 'custom' ? customModel : model;
    onSave({
      provider,
      apiKey: apiKey || undefined,
      model: finalModel || undefined,
      baseUrl: provider === 'local' ? baseUrl : undefined,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const isValid = () => {
    if (provider === 'local') {
      return baseUrl.trim().length > 0;
    }
    return apiKey.trim().length > 0;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>LLM Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {/* Provider Selection */}
          <div className="settings-field">
            <label htmlFor="provider">Provider</label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as LLMProvider)}
            >
              <option value="gemini">Google Gemini</option>
              <option value="claude">Anthropic Claude</option>
              <option value="openai">OpenAI GPT</option>
              <option value="local">Local Model (Ollama, etc.)</option>
            </select>
          </div>

          {/* API Key (not for local) */}
          {provider !== 'local' && (
            <div className="settings-field">
              <label htmlFor="apiKey">
                <Key size={16} />
                API Key
              </label>
              <input
                id="apiKey"
                type="password"
                placeholder={`Enter your ${PROVIDER_INFO[provider].name} API key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div className="field-hint">
                Your API key is stored locally and never sent to our servers.
              </div>
            </div>
          )}

          {/* Base URL (only for local) */}
          {provider === 'local' && (
            <div className="settings-field">
              <label htmlFor="baseUrl">
                <Server size={16} />
                API Base URL
              </label>
              <input
                id="baseUrl"
                type="text"
                placeholder="http://localhost:11434/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <div className="field-hint">
                OpenAI-compatible API endpoint (e.g., Ollama, vLLM, LocalAI)
              </div>
            </div>
          )}

          {/* Model Selection */}
          <div className="settings-field">
            <label htmlFor="model">Model</label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {PROVIDER_INFO[provider].modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Model Input */}
          {model === 'custom' && (
            <div className="settings-field">
              <label htmlFor="customModel">Custom Model Name</label>
              <input
                id="customModel"
                type="text"
                placeholder="Enter model name"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
              />
            </div>
          )}

          {/* Warning for no API key */}
          {!isValid() && (
            <div className="settings-warning">
              <AlertCircle size={16} />
              <span>
                {provider === 'local'
                  ? 'Base URL is required for local models'
                  : 'An API key is required to use this provider'}
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={handleSave}
            disabled={!isValid()}
          >
            {saved ? (
              <>
                <Check size={16} />
                Saved!
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
