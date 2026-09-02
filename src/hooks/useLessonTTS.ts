import { useState, useEffect, useRef, useCallback } from 'react';
import { Topic } from '../types';
import { ttsService, TTSStatus, LessonSectionItem } from '../services/ttsService';
import { getLessonSectionsForTTS } from '../services/lessonTTSHelper';

export interface UseLessonTTSReturn {
  isSupported: boolean;
  status: TTSStatus;
  isPlaying: boolean;
  isPaused: boolean;
  currentSectionId: string | null;
  currentSectionTitle: string | null;
  autoContinue: boolean;
  speedRate: number;
  errorMessage: string | null;
  sections: LessonSectionItem[];
  hasNextSection: boolean;
  nextSectionTitle: string | null;
  finishedSectionId: string | null;
  playSection: (sectionId: string) => void;
  startReadingAloud: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  continueReading: () => void;
  setAutoContinue: (value: boolean | ((prev: boolean) => boolean)) => void;
  setSpeedRate: (rate: number) => void;
  clearError: () => void;
}

export function useLessonTTS(topic: Topic): UseLessonTTSReturn {
  const isSupported = ttsService.isSupported();
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [currentSectionTitle, setCurrentSectionTitle] = useState<string | null>(null);
  const [autoContinue, setAutoContinue] = useState<boolean>(false);
  const [speedRate, setSpeedRate] = useState<number>(0.95);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [finishedSectionId, setFinishedSectionId] = useState<string | null>(null);

  const sections = getLessonSectionsForTTS(topic);

  // Store refs to access latest values in async TTS callbacks
  const sectionsRef = useRef<LessonSectionItem[]>(sections);
  sectionsRef.current = sections;

  const autoContinueRef = useRef<boolean>(autoContinue);
  autoContinueRef.current = autoContinue;

  const speedRateRef = useRef<number>(speedRate);
  speedRateRef.current = speedRate;

  const currentSectionIdRef = useRef<string | null>(currentSectionId);
  currentSectionIdRef.current = currentSectionId;

  // Cleanup on topic change or unmount
  useEffect(() => {
    ttsService.stop();
    setStatus('idle');
    setCurrentSectionId(null);
    setCurrentSectionTitle(null);
    setFinishedSectionId(null);
    setErrorMessage(null);

    return () => {
      ttsService.stop();
    };
  }, [topic.id]);

  const currentIndex = currentSectionId 
    ? sections.findIndex(s => s.id === currentSectionId) 
    : -1;

  const nextSection = currentIndex >= 0 && currentIndex < sections.length - 1 
    ? sections[currentIndex + 1] 
    : null;

  const hasNextSection = Boolean(nextSection);
  const nextSectionTitle = nextSection ? nextSection.title : null;

  const speakSectionInternal = useCallback((section: LessonSectionItem) => {
    if (!ttsService.isSupported()) {
      setErrorMessage('Audio narration is not supported on this browser.');
      setStatus('error');
      return;
    }

    setErrorMessage(null);
    setFinishedSectionId(null);
    setCurrentSectionId(section.id);
    setCurrentSectionTitle(section.title);
    setStatus('playing');

    ttsService.speak(section.text, {
      rate: speedRateRef.current,
      onStart: () => {
        setStatus('playing');
      },
      onPause: () => {
        setStatus('paused');
      },
      onResume: () => {
        setStatus('playing');
      },
      onEnd: () => {
        const activeSections = sectionsRef.current;
        const activeIdx = activeSections.findIndex(s => s.id === section.id);
        const next = activeIdx >= 0 && activeIdx < activeSections.length - 1 ? activeSections[activeIdx + 1] : null;

        if (autoContinueRef.current && next) {
          // Student enabled auto-continue: move to next section
          speakSectionInternal(next);
        } else {
          // Finished reading single section
          setStatus('idle');
          setFinishedSectionId(section.id);
          // Keep current section ID reference for easy resume / continue reading
        }
      },
      onError: (err: any) => {
        setStatus('error');
        setErrorMessage(typeof err === 'string' ? err : err?.message || 'Audio playback error occurred.');
      }
    });
  }, []);

  const playSection = useCallback((sectionId: string) => {
    const section = sectionsRef.current.find(s => s.id === sectionId);
    if (!section) return;
    speakSectionInternal(section);
  }, [speakSectionInternal]);

  const startReadingAloud = useCallback(() => {
    if (sectionsRef.current.length === 0) return;

    // If currently paused on a section, resume
    if (status === 'paused' && currentSectionIdRef.current) {
      ttsService.resume();
      setStatus('playing');
      return;
    }

    // If current section is set, start from current section; otherwise start from first
    const targetSection = (currentSectionIdRef.current && sectionsRef.current.find(s => s.id === currentSectionIdRef.current)) 
      || sectionsRef.current[0];

    speakSectionInternal(targetSection);
  }, [status, speakSectionInternal]);

  const pause = useCallback(() => {
    ttsService.pause();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    if (status === 'paused') {
      ttsService.resume();
      setStatus('playing');
    } else if (currentSectionIdRef.current) {
      playSection(currentSectionIdRef.current);
    } else {
      startReadingAloud();
    }
  }, [status, playSection, startReadingAloud]);

  const stop = useCallback(() => {
    ttsService.stop();
    setStatus('idle');
    setCurrentSectionId(null);
    setCurrentSectionTitle(null);
    setFinishedSectionId(null);
  }, []);

  const continueReading = useCallback(() => {
    const activeSections = sectionsRef.current;
    let next: LessonSectionItem | null = null;

    if (currentSectionIdRef.current) {
      const activeIdx = activeSections.findIndex(s => s.id === currentSectionIdRef.current);
      if (activeIdx >= 0 && activeIdx < activeSections.length - 1) {
        next = activeSections[activeIdx + 1];
      }
    } else if (finishedSectionId) {
      const finishedIdx = activeSections.findIndex(s => s.id === finishedSectionId);
      if (finishedIdx >= 0 && finishedIdx < activeSections.length - 1) {
        next = activeSections[finishedIdx + 1];
      }
    }

    if (next) {
      speakSectionInternal(next);
    } else if (activeSections.length > 0) {
      speakSectionInternal(activeSections[0]);
    }
  }, [finishedSectionId, speakSectionInternal]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  return {
    isSupported,
    status,
    isPlaying: status === 'playing',
    isPaused: status === 'paused',
    currentSectionId,
    currentSectionTitle,
    autoContinue,
    speedRate,
    errorMessage,
    sections,
    hasNextSection,
    nextSectionTitle,
    finishedSectionId,
    playSection,
    startReadingAloud,
    pause,
    resume,
    stop,
    continueReading,
    setAutoContinue,
    setSpeedRate,
    clearError
  };
}
