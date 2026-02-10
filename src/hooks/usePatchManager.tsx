import { useState, useCallback } from 'react';
import { ConflictResolver } from '../services/ConflictResolver';
import type { Patch, MergeResult, ConflictResolution } from '../types';

interface UsePatchMergerOptions {
  onMergeSuccess?: (mergedPatch: Patch) => void;
  onConflict?: (result: MergeResult) => void;
}

/**
 * Custom hook for merging multiple patches and handling conflicts
 */
export function usePatchMerger(options?: UsePatchMergerOptions) {
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [merging, setMerging] = useState(false);
  const [localPatch, setLocalPatch] = useState<Patch | null>(null);
  const [remotePatches, setRemotePatches] = useState<Patch[]>([]);

  const conflictResolver = new ConflictResolver();

  /**
   * Attempt to merge multiple remote patches into a local patch.
   * Supports nested object structures with field-level conflict detection.
   * If successful, calls onMergeSuccess with the merged patch.
   * If conflicts exist, stores the result and calls onConflict.
   */
  const mergePatches = useCallback(
    (local: Patch, remote: Patch[]) => {
      setMerging(true);
      setLocalPatch(local);
      setRemotePatches(remote);

      try {
        const result = conflictResolver.mergePatches(local, remote);
        setMergeResult(result);

        if (result.success && result.merged) {
          options?.onMergeSuccess?.(result.merged);
        } else {
          options?.onConflict?.(result);
        }

        return result;
      } finally {
        setMerging(false);
      }
    },
    [options],
  );

  /**
   * Apply conflict resolutions to produce the final merged patch.
   * Returns the resolved patch.
   */
  const applyResolutions = useCallback(
    (resolutions: ConflictResolution[]): Patch | null => {
      if (!localPatch || remotePatches.length === 0) {
        return null;
      }

      const result = conflictResolver.applyResolutions(localPatch, remotePatches, resolutions);
      setMergeResult(null); // Clear conflict state
      setLocalPatch(null);
      setRemotePatches([]);

      return result.resolved;
    },
    [localPatch, remotePatches],
  );

  /**
   * Clear any pending conflict state
   */
  const clearConflict = useCallback(() => {
    setMergeResult(null);
    setLocalPatch(null);
    setRemotePatches([]);
  }, []);

  return {
    merging,
    mergeResult,
    hasConflict: mergeResult && !mergeResult.success,
    mergePatches,
    applyResolutions,
    clearConflict,
  };
}
