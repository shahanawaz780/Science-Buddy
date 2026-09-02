/**
 * Text-to-Speech (TTS) Service for Science Buddy
 * 
 * Provides an extensible abstraction for Text-to-Speech playback.
 * Defaults to the Browser / Web Speech Synthesis API with voice selection,
 * sentence splitting, pause/resume, and error handling.
 * 
 * Architecture allows plugging in a Cloud TTS provider (e.g. Google Cloud TTS / Edge TTS)
 * in the future without changing the Lesson UI components.
 */

export type TTSStatus = 'idle' | 'playing' | 'paused' | 'stopped' | 'error';

export interface TTSVoice {
  id: string;
  name: string;
  lang: string;
  isDefault?: boolean;
}

export interface TTSPlaybackOptions {
  rate?: number;    // Speed: 0.5 to 2.0 (default 0.95 for Grade 6 clarity)
  pitch?: number;   // Pitch: 0.5 to 1.5 (default 1.0)
  volume?: number;  // Volume: 0.0 to 1.0 (default 1.0)
  voiceId?: string; // Voice URI or ID
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: Error | string) => void;
}

export interface LessonSectionItem {
  id: string;
  title: string;
  text: string;
}

/**
 * Provider interface for pluggable TTS engines
 */
export interface ITTSProvider {
  name: string;
  isSupported(): boolean;
  getVoices(): Promise<TTSVoice[]>;
  speak(text: string, options?: TTSPlaybackOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  getStatus(): TTSStatus;
}

/**
 * Browser-native Web Speech Synthesis Provider
 */
export class BrowserTTSProvider implements ITTSProvider {
  public name = 'Browser Web Speech API';
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private status: TTSStatus = 'idle';
  private options: TTSPlaybackOptions = {};
  private activeText: string = '';
  private currentChunkIndex: number = 0;
  private textChunks: string[] = [];

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  public async getVoices(): Promise<TTSVoice[]> {
    if (!this.isSupported()) return [];

    return new Promise((resolve) => {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(this.formatVoices(voices));
        return;
      }

      // Handle async loading of voices in Chromium/Safari
      const onVoicesChanged = () => {
        voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(this.formatVoices(voices));
      };

      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

      // Fallback timeout if event doesn't fire
      setTimeout(() => {
        resolve(this.formatVoices(window.speechSynthesis.getVoices()));
      }, 500);
    });
  }

  private formatVoices(voices: SpeechSynthesisVoice[]): TTSVoice[] {
    // Prefer English voices (especially en-IN, en-GB, en-US)
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const targetVoices = englishVoices.length > 0 ? englishVoices : voices;

    return targetVoices.map(v => ({
      id: v.voiceURI || v.name,
      name: v.name,
      lang: v.lang,
      isDefault: v.default
    }));
  }

  /**
   * Cleans text to make it sound natural when spoken (stripping markdown stars, hashes, emojis)
   */
  public cleanTextForSpeech(rawText: string): string {
    if (!rawText) return '';
    return rawText
      // Remove markdown bold/italic
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove headers and bullets
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^\s*[-*•]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Replace arrow symbols with spoken words
      .replace(/➔|->|→/g, ' leads to ')
      // Clean excessive punctuation/spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Splits long text into natural sentence chunks to prevent browser speech synthesis timeouts
   */
  private splitIntoChunks(text: string, maxLength: number = 180): string[] {
    const clean = this.cleanTextForSpeech(text);
    if (clean.length <= maxLength) return [clean];

    const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [clean];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length <= maxLength) {
        currentChunk = currentChunk ? `${currentChunk} ${sentence.trim()}` : sentence.trim();
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence.trim();
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    return chunks.length > 0 ? chunks : [clean];
  }

  public async speak(text: string, options: TTSPlaybackOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      const err = new Error('Browser Text-to-Speech is not supported on this device/browser.');
      this.status = 'error';
      options.onError?.(err);
      return;
    }

    this.stop(); // Stop any currently playing utterance

    this.options = options;
    this.activeText = text;
    this.textChunks = this.splitIntoChunks(text);
    this.currentChunkIndex = 0;

    if (this.textChunks.length === 0 || !this.textChunks[0]) {
      this.status = 'idle';
      this.options.onEnd?.();
      return;
    }

    this.status = 'playing';
    this.options.onStart?.();

    this.speakChunk(this.currentChunkIndex);
  }

  private speakChunk(index: number): void {
    if (index >= this.textChunks.length || this.status === 'stopped' || this.status === 'idle') {
      this.status = 'idle';
      this.currentUtterance = null;
      this.options.onEnd?.();
      return;
    }

    const chunkText = this.textChunks[index];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    this.currentUtterance = utterance;

    // Apply voice and rate settings
    utterance.rate = this.options.rate ?? 0.95;
    utterance.pitch = this.options.pitch ?? 1.0;
    utterance.volume = this.options.volume ?? 1.0;

    // Select voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      if (this.options.voiceId) {
        const matchingVoice = voices.find(v => (v.voiceURI || v.name) === this.options.voiceId);
        if (matchingVoice) utterance.voice = matchingVoice;
      }
      
      // Default to English voice (Indian English or natural English preferred)
      if (!utterance.voice) {
        const inVoice = voices.find(v => v.lang === 'en-IN');
        const gbVoice = voices.find(v => v.lang === 'en-GB');
        const usVoice = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en'));
        utterance.voice = inVoice || gbVoice || usVoice || voices[0];
      }
    }

    utterance.onend = () => {
      if (this.status === 'playing') {
        this.currentChunkIndex++;
        if (this.currentChunkIndex < this.textChunks.length) {
          // Speak next chunk seamlessly
          this.speakChunk(this.currentChunkIndex);
        } else {
          this.status = 'idle';
          this.currentUtterance = null;
          this.options.onEnd?.();
        }
      }
    };

    utterance.onerror = (event) => {
      // 'canceled' or 'interrupted' is expected when stopping/navigating
      if (event.error === 'canceled' || event.error === 'interrupted') {
        this.status = 'idle';
        this.currentUtterance = null;
        return;
      }
      console.warn('SpeechSynthesis error:', event.error);
      this.status = 'error';
      this.currentUtterance = null;
      this.options.onError?.(new Error(`Speech error: ${event.error}`));
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      console.error('Error invoking window.speechSynthesis.speak:', err);
      this.status = 'error';
      this.options.onError?.(err);
    }
  }

  public pause(): void {
    if (!this.isSupported() || this.status !== 'playing') return;
    try {
      window.speechSynthesis.pause();
      this.status = 'paused';
      this.options.onPause?.();
    } catch (err) {
      console.warn('Error pausing SpeechSynthesis:', err);
    }
  }

  public resume(): void {
    if (!this.isSupported() || this.status !== 'paused') return;
    try {
      window.speechSynthesis.resume();
      this.status = 'playing';
      this.options.onResume?.();
    } catch (err) {
      console.warn('Error resuming SpeechSynthesis:', err);
      // If resume fails on some browsers, re-trigger current chunk
      if (this.textChunks.length > 0) {
        this.speakChunk(this.currentChunkIndex);
      }
    }
  }

  public stop(): void {
    if (!this.isSupported()) return;
    try {
      this.status = 'stopped';
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
      this.textChunks = [];
      this.currentChunkIndex = 0;
    } catch (err) {
      console.warn('Error canceling SpeechSynthesis:', err);
    }
  }

  public getStatus(): TTSStatus {
    return this.status;
  }
}

/**
 * Cloud TTS Provider (Placeholder for future Cloud AI TTS services)
 * Demonstrates pluggable architecture without requiring frontend UI modification.
 */
export class CloudTTSProvider implements ITTSProvider {
  public name = 'Cloud AI TTS (Extensible)';
  private status: TTSStatus = 'idle';

  public isSupported(): boolean {
    return true;
  }

  public async getVoices(): Promise<TTSVoice[]> {
    return [
      { id: 'cloud-voice-en-in-1', name: 'Science Buddy Natural (Indian English)', lang: 'en-IN', isDefault: true }
    ];
  }

  public async speak(text: string, options: TTSPlaybackOptions = {}): Promise<void> {
    // Cloud provider implementation fallback to browser
    const browserProvider = new BrowserTTSProvider();
    return browserProvider.speak(text, options);
  }

  public pause(): void {}
  public resume(): void {}
  public stop(): void {
    this.status = 'stopped';
  }

  public getStatus(): TTSStatus {
    return this.status;
  }
}

/**
 * Main Singleton TTS Manager
 */
class TTSManager {
  private activeProvider: ITTSProvider;

  constructor() {
    this.activeProvider = new BrowserTTSProvider();
  }

  public setProvider(provider: ITTSProvider): void {
    if (this.activeProvider) {
      this.activeProvider.stop();
    }
    this.activeProvider = provider;
  }

  public getProvider(): ITTSProvider {
    return this.activeProvider;
  }

  public isSupported(): boolean {
    return this.activeProvider.isSupported();
  }

  public speak(text: string, options?: TTSPlaybackOptions): Promise<void> {
    return this.activeProvider.speak(text, options);
  }

  public pause(): void {
    this.activeProvider.pause();
  }

  public resume(): void {
    this.activeProvider.resume();
  }

  public stop(): void {
    this.activeProvider.stop();
  }

  public getStatus(): TTSStatus {
    return this.activeProvider.getStatus();
  }

  public getVoices(): Promise<TTSVoice[]> {
    return this.activeProvider.getVoices();
  }
}

export const ttsService = new TTSManager();
