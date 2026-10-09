import { useCallback, useEffect, useRef, useState } from "react";

/** Minimal data hook: runs `fn` on mount and when `deps` change; `reload` re-runs it. */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const run = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    try {
      const result = await fn();
      if (id === seq.current) { setData(result); setError(null); }
    } catch (e) {
      if (id === seq.current) setError(e as Error);
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { data, error, loading, reload: run, setData };
}
