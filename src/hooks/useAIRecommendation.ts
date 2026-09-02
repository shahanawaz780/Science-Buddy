import { useState, useEffect, useCallback, useRef } from 'react';
import { AIRecommendationResult, UserProgressData, Topic } from '../types';
import { fetchAIRecommendations, buildPerformancePayload } from '../services/recommendationService';

export function useAIRecommendation(progress: UserProgressData, topics: Topic[]) {
  const [recommendation, setRecommendation] = useState<AIRecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshRecommendation = useCallback(async () => {
    if (!topics || topics.length === 0) return;
    setIsLoading(true);

    try {
      const payload = buildPerformancePayload(progress, topics);
      const res = await fetchAIRecommendations(payload);
      
      if (isMountedRef.current) {
        if (res.success && res.data) {
          setRecommendation(res.data);
          setIsFallback(!!res.isFallback);
        }
      }
    } catch (err) {
      console.warn('Error fetching recommendations in hook:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [progress, topics]);

  useEffect(() => {
    refreshRecommendation();
  }, [refreshRecommendation]);

  return {
    recommendation,
    isLoading,
    isFallback,
    refreshRecommendation
  };
}
