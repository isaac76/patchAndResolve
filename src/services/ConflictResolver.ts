import type {
  Patch,
  MergeResult,
  Conflict,
  ConflictResolution,
  ResolveResult,
} from '../types';
import {
  getAllPaths,
  getNestedValue,
  setNestedValue,
  deepEqual,
} from '../utils/deepPath';

/**
 * Service for merging patches and resolving conflicts
 */
export class ConflictResolver {
  /**
   * Merge multiple remote patches into a local patch with deep (nested) conflict detection.
   *
   * **Conflict Rules:**
   * - Conflicts occur ONLY when the exact same path is modified by both local and remote patches
   * - Different paths merge automatically, even if they share a parent object
   * - Example: local changes `user.name`, remote changes `user.address.city` → No conflict (different paths)
   * - Example: local changes `user.name`, remote changes `user.name` → Conflict (same path)
   *
   * **Path Format:**
   * - Uses dot notation: "user.name", "pages.0.container.text.fontSize"
   * - Arrays are treated as single values (conflicts if entire array differs)
   * - Flat objects work perfectly fine (treated as depth-1 nested objects)
   *
   * **Note:** Later remote patches can overwrite earlier remote patches without conflict.
   * Conflicts only occur between the local patch and remote patches.
   *
   * @param localPatch - The base patch with potential nested structure
   * @param remotePatches - Array of remote patches to merge
   * @returns MergeResult with either merged patch or conflicts requiring resolution
   */
  mergePatches(localPatch: Patch, remotePatches: Patch[]): MergeResult {
    const allConflicts: Conflict[] = [];
    const localPaths = getAllPaths(localPatch);
    const currentMerged = JSON.parse(JSON.stringify(localPatch)); // Deep clone

    // Track which paths have been seen in local patch
    const localPathsSet = new Set(localPaths);

    // Merge each remote patch sequentially
    for (let i = 0; i < remotePatches.length; i++) {
      const remotePatch = remotePatches[i];
      const remotePaths = getAllPaths(remotePatch);

      // Find conflicts: paths that exist in BOTH local and current remote
      // and have different values
      for (const path of remotePaths) {
        if (localPathsSet.has(path)) {
          const localValue = getNestedValue(localPatch, path);
          const remoteValue = getNestedValue(remotePatch, path);

          if (!deepEqual(localValue, remoteValue)) {
            // Only add if not already recorded
            const existingConflict = allConflicts.find(c => c.path === path);
            if (!existingConflict) {
              allConflicts.push({
                path,
                localValue,
                remoteValue,
                remotePatchIndex: i,
              });
            }
          }
        }

        // Merge the remote value into currentMerged (overwrites previous remote values)
        const remoteValue = getNestedValue(remotePatch, path);
        setNestedValue(currentMerged, path, remoteValue);
      }

      // Handle version field specially
      const version = this.getHigherVersion(currentMerged.version, remotePatch.version);
      if (version !== undefined) {
        currentMerged.version = version;
      }
    }

    if (allConflicts.length === 0) {
      // No conflicts - merge complete
      return {
        success: true,
        merged: currentMerged,
      };
    }

    // Has conflicts - return for manual resolution
    return {
      success: false,
      conflicts: allConflicts,
      basePatch: localPatch,
    };
  }

  /**
   * Apply conflict resolutions to produce the final merged patch.
   *
   * @param localPatch - The base patch with potential nested structure
   * @param remotePatches - Array of remote patches
   * @param resolutions - Array of conflict resolutions
   * @returns Final resolved patch with deep merging
   */
  applyResolutions(
    localPatch: Patch,
    remotePatches: Patch[],
    resolutions: ConflictResolution[],
  ): ResolveResult {
    // Start with deep clone of local patch
    const resolved = JSON.parse(JSON.stringify(localPatch));

    // Build resolution map
    const resolutionMap = new Map<number, ConflictResolution>();
    resolutions.forEach(res => {
      resolutionMap.set(res.conflictIndex, res);
    });

    // Collect all conflicts again
    const allConflicts: Conflict[] = [];
    const localPaths = getAllPaths(localPatch);
    const localPathsSet = new Set(localPaths);

    for (let i = 0; i < remotePatches.length; i++) {
      const remotePatch = remotePatches[i];
      const remotePaths = getAllPaths(remotePatch);

      for (const path of remotePaths) {
        if (localPathsSet.has(path)) {
          const localValue = getNestedValue(localPatch, path);
          const remoteValue = getNestedValue(remotePatch, path);

          if (!deepEqual(localValue, remoteValue)) {
            allConflicts.push({
              path,
              localValue,
              remoteValue,
              remotePatchIndex: i,
            });
          }
        }
      }
    }

    // Apply resolutions for conflicting paths
    const conflictPaths = new Set<string>();
    allConflicts.forEach((conflict, index) => {
      conflictPaths.add(conflict.path);
      const resolution = resolutionMap.get(index);
      if (resolution) {
        if (resolution.strategy === 'use-local') {
          setNestedValue(resolved, conflict.path, conflict.localValue);
        } else {
          setNestedValue(resolved, conflict.path, conflict.remoteValue);
        }
      }
    });

    // Merge all non-conflicting paths from remote patches
    remotePatches.forEach(remotePatch => {
      const remotePaths = getAllPaths(remotePatch);
      remotePaths.forEach(path => {
        if (!conflictPaths.has(path)) {
          const remoteValue = getNestedValue(remotePatch, path);
          setNestedValue(resolved, path, remoteValue);
        }
      });
    });

    // Use highest version
    const allVersions = [localPatch.version, ...remotePatches.map(p => p.version)].filter(v => v !== undefined);
    if (allVersions.length > 0) {
      resolved.version = Math.max(...allVersions);
    }

    return {
      resolutions,
      resolved,
    };
  }

  /**
   * Get the higher version number from two optional versions
   */
  private getHigherVersion(version1?: number, version2?: number): number | undefined {
    if (version1 === undefined && version2 === undefined) {
      return undefined;
    }
    if (version1 === undefined) {return version2;}
    if (version2 === undefined) {return version1;}
    return Math.max(version1, version2);
  }
}
