'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  enabled: boolean;
  delay: number;
  onSave: () => Promise<void>;
}

interface UseAutoSaveResult {
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
  triggerSave: () => void;
}

export function useAutoSave({ enabled, delay, onSave }: UseAutoSaveOptions): UseAutoSaveResult {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const savingRef = useRef(false);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const doSave = useCallback(async () => {
    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await onSaveRef.current();
      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    } finally {
      savingRef.current = false;
      setSaving(false);
      if (pendingRef.current) {
        pendingRef.current = false;
        doSave();
      }
    }
  }, []);

  const triggerSave = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, delay);
  }, [enabled, delay, doSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { saving, lastSaved, error, triggerSave };
}
