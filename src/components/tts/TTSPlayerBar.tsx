import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  Settings2, 
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { UseLessonTTSReturn } from '../../hooks/useLessonTTS';

interface TTSPlayerBarProps {
  tts: UseLessonTTSReturn;
  onAskTutorClarification?: (sectionTitle: string) => void;
}

export const TTSPlayerBar: React.FC<TTSPlayerBarProps> = ({ 
  tts,
  onAskTutorClarification 
}) => {
  const {
    isSupported,
    status,
    isPlaying,
    isPaused,
    currentSectionId,
    currentSectionTitle,
    autoContinue,
    speedRate,
    errorMessage,
    hasNextSection,
    nextSectionTitle,
    finishedSectionId,
    startReadingAloud,
    pause,
    resume,
    stop,
    continueReading,
    setAutoContinue,
    setSpeedRate,
    clearError
  } = tts;

  const isActive = isPlaying || isPaused || currentSectionId !== null || finishedSectionId !== null;

  // Unsupported browser banner
  if (!isSupported) {
    return (
      <div 
        id="tts-unsupported-banner"
        className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <VolumeX className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Read-Aloud Note:</strong> Your browser does not support speech synthesis audio playback. The full written lesson remains accessible below!
          </span>
        </div>
      </div>
    );
  }

  // If there's an active error
  if (errorMessage) {
    return (
      <div 
        id="tts-error-banner" 
        className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startReadingAloud}
            className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
          <button
            onClick={clearError}
            className="px-2.5 py-1 text-rose-700 hover:text-rose-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // If inactive (not currently playing or paused), render a clean launcher banner or collapse
  if (!isActive) {
    return null;
  }

  return (
    <div 
      id="tts-player-dock"
      className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-emerald-500/80 shadow-lg shadow-emerald-500/10 space-y-3.5 transition-all animate-in slide-in-from-top-2 duration-300 ring-4 ring-emerald-500/10"
    >
      {/* Top row: Status, Section Title, and Audio Waveform */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isPlaying 
              ? 'bg-emerald-600 text-white shadow-xs animate-pulse' 
              : isPaused 
              ? 'bg-amber-500 text-white' 
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            <Volume2 className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                {isPlaying ? '🔊 Reading Aloud' : isPaused ? '⏸ Narration Paused' : '✅ Section Finished'}
              </span>
              {isPlaying && (
                <div className="flex items-center gap-0.5">
                  <span className="w-1 h-3 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-4 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
              {currentSectionTitle || 'Lesson Narration'}
            </p>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl" role="group" aria-label="Speech Narration Speed">
          <Gauge className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" aria-hidden="true" />
          {[
            { label: '0.8x', value: 0.8 },
            { label: '1.0x', value: 0.95 },
            { label: '1.2x', value: 1.2 }
          ].map((sp) => (
            <button
              key={sp.label}
              onClick={() => setSpeedRate(sp.value)}
              aria-label={`Set narration speed to ${sp.label}`}
              aria-pressed={Math.abs(speedRate - sp.value) < 0.1}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                Math.abs(speedRate - sp.value) < 0.1
                  ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Controls Row: Play, Pause, Resume, Stop, Continue Reading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Play / Pause / Resume / Stop Button Group */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              id="tts-pause-btn"
              onClick={pause}
              aria-label="Pause narration"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs active:scale-95 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          ) : isPaused ? (
            <button
              id="tts-resume-btn"
              onClick={resume}
              aria-label="Resume narration"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              id="tts-play-btn"
              onClick={startReadingAloud}
              aria-label="Play narration"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </button>
          )}

          {/* Stop Button */}
          <button
            id="tts-stop-btn"
            onClick={stop}
            aria-label="Stop narration and reset"
            title="Stop narration and reset"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        </div>

        {/* Continue Reading Action & Auto-continue toggle */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Continue Reading Button */}
          {hasNextSection && (
            <button
              id="tts-continue-reading-btn"
              onClick={continueReading}
              aria-label={`Continue reading to ${nextSectionTitle || 'next section'}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs active:scale-95 transition-all shadow-2xs group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span>Continue Reading</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Auto-continue checkbox per requirement */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors focus-within:ring-2 focus-within:ring-emerald-500">
            <input
              type="checkbox"
              checked={autoContinue}
              onChange={(e) => setAutoContinue(e.target.checked)}
              aria-label="Auto-advance through lesson sections during narration"
              className="w-3.5 h-3.5 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span>Auto-advance Sections</span>
          </label>
        </div>

      </div>

      {/* Completion prompt helper when a section finishes */}
      {finishedSectionId && hasNextSection && !autoContinue && (
        <div className="bg-emerald-50/90 rounded-xl p-3 border border-emerald-200 text-xs flex items-center justify-between gap-2 text-emerald-950 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Finished section! Tap <strong>Continue Reading</strong> to listen to: <em>{nextSectionTitle}</em>
            </span>
          </div>
          <button
            onClick={continueReading}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shrink-0 transition-colors"
          >
            Continue ⏭
          </button>
        </div>
      )}
    </div>
  );
};
