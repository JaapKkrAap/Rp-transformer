/**
 * Loading Animation Component
 *
 * Theatrical "writing magic" animation for transformation loading state.
 */

import { Sparkles, Wand2, BookOpen } from 'lucide-react';

interface LoadingAnimationProps {
  type: 'transform' | 'analyze';
}

export function LoadingAnimation({ type }: LoadingAnimationProps) {
  const messages =
    type === 'transform'
      ? [
          'Weaving narrative threads...',
          'Channeling creative essence...',
          'Crafting immersive prose...',
          'Infusing character voice...',
        ]
      : [
          'Scanning for inconsistencies...',
          'Checking narrative logic...',
          'Analyzing character behavior...',
          'Detecting violations...',
        ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return (
    <div className="loading-animation">
      <div className="loading-icons">
        {type === 'transform' ? (
          <>
            <Wand2 className="icon wand" size={32} />
            <Sparkles className="icon sparkles" size={24} />
            <BookOpen className="icon book" size={28} />
          </>
        ) : (
          <div className="analyze-pulse">
            <div className="pulse-ring" />
            <div className="pulse-ring" />
            <div className="pulse-ring" />
          </div>
        )}
      </div>
      <p className="loading-message">{randomMessage}</p>
    </div>
  );
}
