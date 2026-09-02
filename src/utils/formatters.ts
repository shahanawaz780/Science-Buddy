/**
 * Shared Formatting & Text Utilities
 */

/**
 * Formats duration in seconds to MM:SS string
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
}

/**
 * Formats score display string (e.g. "8/10" or "80%")
 */
export function formatScore(score: number, maxScore?: number): string {
  if (maxScore !== undefined && maxScore > 0) {
    return `${score}/${maxScore}`;
  }
  return `${score}%`;
}

/**
 * Formats ISO timestamp to human-readable date string
 */
export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Recently';
  }
}

/**
 * Cleans text for speech synthesis or plain text preview
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/➔|->|→/g, ' leads to ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncates text cleanly with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).trim() + '...';
}
