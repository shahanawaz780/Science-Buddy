import React from 'react';
import { Volume2, Pause, Play, Loader2 } from 'lucide-react';

interface SectionListenButtonProps {
  sectionId: string;
  currentSectionId: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: (sectionId: string) => void;
  onPause: () => void;
  onResume: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'pill';
}

export const SectionListenButton: React.FC<SectionListenButtonProps> = ({
  sectionId,
  currentSectionId,
  isPlaying,
  isPaused,
  onPlay,
  onPause,
  onResume,
  className = '',
  variant = 'default'
}) => {
  const isThisSectionActive = currentSectionId === sectionId;
  const isThisSectionPlaying = isThisSectionActive && isPlaying;
  const isThisSectionPaused = isThisSectionActive && isPaused;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isThisSectionPlaying) {
      onPause();
    } else if (isThisSectionPaused) {
      onResume();
    } else {
      onPlay(sectionId);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        id={`listen-btn-${sectionId}`}
        onClick={handleClick}
        aria-label={isThisSectionPlaying ? `Pause narration for ${sectionId.replace('_', ' ')}` : isThisSectionPaused ? `Resume narration for ${sectionId.replace('_', ' ')}` : `Listen to ${sectionId.replace('_', ' ')}`}
        title={isThisSectionPlaying ? 'Pause narration' : 'Listen to this section'}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          isThisSectionPlaying
            ? 'bg-emerald-600 text-white shadow-xs animate-pulse'
            : isThisSectionPaused
            ? 'bg-amber-100 text-amber-900 border border-amber-300'
            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 hover:border-emerald-300'
        } ${className}`}
      >
        {isThisSectionPlaying ? (
          <>
            <Pause className="w-3 h-3 shrink-0" />
            <span>Pause</span>
          </>
        ) : isThisSectionPaused ? (
          <>
            <Play className="w-3 h-3 shrink-0 fill-current" />
            <span>Resume</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3 h-3 shrink-0 text-emerald-600" />
            <span>Listen</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      id={`listen-btn-${sectionId}`}
      onClick={handleClick}
      aria-label={isThisSectionPlaying ? `Pause narration for ${sectionId.replace('_', ' ')}` : isThisSectionPaused ? `Resume narration for ${sectionId.replace('_', ' ')}` : `Listen to ${sectionId.replace('_', ' ')}`}
      title={isThisSectionPlaying ? 'Pause narration' : 'Listen to this section'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isThisSectionPlaying
          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40'
          : isThisSectionPaused
          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
          : 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 hover:border-emerald-300 shadow-2xs'
      } ${className}`}
    >
      {isThisSectionPlaying ? (
        <>
          <span className="flex items-center gap-0.5">
            <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          <Pause className="w-3.5 h-3.5 shrink-0 ml-0.5" />
          <span>Pause</span>
        </>
      ) : isThisSectionPaused ? (
        <>
          <Play className="w-3.5 h-3.5 shrink-0 fill-current" />
          <span>Resume</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span>Listen</span>
        </>
      )}
    </button>
  );
};
