/**
 * Config Panel Component
 *
 * Controls room-specific transformation settings.
 * Bound to activeRoom.config for isolated configuration.
 */

import type { RPConfig, Genre, Length, Perspective } from '../types';
import { GENRES, LENGTHS, PERSPECTIVES } from '../types';

interface ConfigPanelProps {
  config: RPConfig;
  onChange: (updates: Partial<RPConfig>) => void;
  disabled?: boolean;
}

export function ConfigPanel({ config, onChange, disabled }: ConfigPanelProps) {
  return (
    <div className="config-panel">
      <h3>Transformation Settings</h3>

      <div className="config-grid">
        {/* Genre Selection */}
        <div className="config-field">
          <label htmlFor="genre">Genre</label>
          <select
            id="genre"
            value={config.genre}
            onChange={(e) => onChange({ genre: e.target.value as Genre })}
            disabled={disabled}
          >
            {GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* Length Selection */}
        <div className="config-field">
          <label htmlFor="length">Length</label>
          <select
            id="length"
            value={config.length}
            onChange={(e) => onChange({ length: e.target.value as Length })}
            disabled={disabled}
          >
            {LENGTHS.map((length) => (
              <option key={length} value={length}>
                {length}
              </option>
            ))}
          </select>
        </div>

        {/* Perspective Selection */}
        <div className="config-field">
          <label htmlFor="perspective">Perspective</label>
          <select
            id="perspective"
            value={config.perspective}
            onChange={(e) => onChange({ perspective: e.target.value as Perspective })}
            disabled={disabled}
          >
            {PERSPECTIVES.map((perspective) => (
              <option key={perspective} value={perspective}>
                {perspective}
              </option>
            ))}
          </select>
        </div>

        {/* Intensity Slider */}
        <div className="config-field intensity-field">
          <label htmlFor="intensity">
            Intensity: <span className="intensity-value">{config.intensity}/10</span>
          </label>
          <div className="intensity-slider-container">
            <input
              type="range"
              id="intensity"
              min="1"
              max="10"
              value={config.intensity}
              onChange={(e) => onChange({ intensity: parseInt(e.target.value, 10) })}
              disabled={disabled}
              className="intensity-slider"
            />
            <div className="intensity-labels">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Intense</span>
            </div>
          </div>
        </div>
      </div>

      {/* Persona Textarea */}
      <div className="config-field persona-field">
        <label htmlFor="persona">Character Persona</label>
        <textarea
          id="persona"
          placeholder="Describe your character's personality, appearance, mannerisms, speaking style, and background. This helps maintain consistency in transformations..."
          value={config.persona}
          onChange={(e) => onChange({ persona: e.target.value })}
          disabled={disabled}
          rows={4}
        />
        <div className="field-hint">
          A detailed persona helps the AI maintain character consistency and voice.
        </div>
      </div>
    </div>
  );
}
