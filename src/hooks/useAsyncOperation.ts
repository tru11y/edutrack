import { useState, useCallback } from "react";

interface UseAsyncOperationResult<T> {
  execute: (operation: () => Promise<T>) => Promise<T | undefined>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  setError: (error: string) => void;
}

/**
 * Hook pour gerer les operations asynchrones avec loading/error state
 * Elimine la duplication de setSaving/setError partout
 */
export function useAsyncOperation<T = void>(): UseAsyncOperationResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | undefined> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      console.error("Operation error:", err);
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(message);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    execute,
    loading,
    error,
    clearError,
    setError,
  };
}

/**
 * Hook pour gerer les messages de succes avec auto-clear
 */
export function useSuccessMessage(duration = 5000) {
  const [message, setMessage] = useState<string | null>(null);

  const showSuccess = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), duration);
  }, [duration]);

  const clearMessage = useCallback(() => setMessage(null), []);

  return { message, showSuccess, clearMessage };
}
