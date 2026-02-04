import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, QueryConstraint } from "firebase/firestore";
import { db } from "../services/firebase";

interface UseFirestoreCollectionOptions<T> {
  collectionName: string;
  constraints?: QueryConstraint[];
  transform?: (doc: { id: string; data: () => Record<string, unknown> }) => T;
  sortFn?: (a: T, b: T) => number;
  enabled?: boolean;
}

interface UseFirestoreCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Hook generique pour charger une collection Firestore
 * Elimine la duplication du pattern getDocs/map partout
 */
export function useFirestoreCollection<T extends { id: string }>({
  collectionName,
  constraints = [],
  transform,
  sortFn,
  enabled = true,
}: UseFirestoreCollectionOptions<T>): UseFirestoreCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const q = constraints.length > 0
        ? query(collection(db, collectionName), ...constraints)
        : collection(db, collectionName);

      const snap = await getDocs(q);

      let items = snap.docs.map((doc) => {
        if (transform) {
          return transform({ id: doc.id, data: () => doc.data() });
        }
        return { id: doc.id, ...doc.data() } as T;
      });

      if (sortFn) {
        items = items.sort(sortFn);
      }

      setData(items);
    } catch (err) {
      console.error(`Erreur chargement ${collectionName}:`, err);
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [collectionName, constraints, transform, sortFn, enabled]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}
