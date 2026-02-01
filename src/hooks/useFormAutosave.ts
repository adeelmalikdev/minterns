import { useEffect, useRef, useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseFormAutosaveOptions<T> {
  formKey: string;
  data: T;
  onRestore?: (data: T) => void;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseFormAutosaveReturn<T> {
  hasDraft: boolean;
  lastSaved: Date | null;
  restoreDraft: () => T | null;
  clearDraft: () => void;
  saveDraft: () => void;
}

export function useFormAutosave<T extends Record<string, unknown>>({
  formKey,
  data,
  onRestore,
  debounceMs = 30000, // 30 seconds default
  enabled = true,
}: UseFormAutosaveOptions<T>): UseFormAutosaveReturn<T> {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  const storageKey = `form-draft-${formKey}`;

  // Check for existing draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setHasDraft(!!saved);
  }, [storageKey]);

  // Auto-save logic with debounce
  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // Only save if there's actual data
      const hasContent = Object.values(data).some(
        (value) => value !== "" && value !== null && value !== undefined
      );

      if (hasContent) {
        const draftData = {
          data,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(draftData));
        setLastSaved(new Date());
        setHasDraft(true);
        
        toast({
          title: "Draft saved",
          description: "Your progress has been saved automatically.",
          duration: 2000,
        });
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, storageKey, debounceMs, enabled, toast]);

  const restoreDraft = useCallback((): T | null => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (onRestore) {
          onRestore(parsed.data);
        }
        toast({
          title: "Draft restored",
          description: "Your previous progress has been restored.",
        });
        return parsed.data as T;
      } catch (error) {
        console.error("Failed to restore draft:", error);
        localStorage.removeItem(storageKey);
      }
    }
    return null;
  }, [storageKey, onRestore, toast]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setLastSaved(null);
  }, [storageKey]);

  const saveDraft = useCallback(() => {
    const hasContent = Object.values(data).some(
      (value) => value !== "" && value !== null && value !== undefined
    );

    if (hasContent) {
      const draftData = {
        data,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(draftData));
      setLastSaved(new Date());
      setHasDraft(true);
    }
  }, [data, storageKey]);

  return {
    hasDraft,
    lastSaved,
    restoreDraft,
    clearDraft,
    saveDraft,
  };
}
