import type {
  Patch,
  MergeResult,
  Conflict,
  ConflictResolution,
  ResolveResult,
} from '../types';

/**
 * Service for merging patches and resolving conflicts
 */
export class ConflictResolver {
  /**
   * Attempt to merge multiple remote patches into a local patch.
   * Merges patches sequentially and collects all conflicts.
   * Returns success if all patches merge without conflicts.
   * If any conflicts occur, returns all conflicts for manual resolution.
   * If patches contain a 'version' field, the higher version is used.
   *
   * Note: Later remote patches can overwrite earlier remote patches without conflict.
   * Conflicts only occur when a remote patch tries to modify a field that exists in the local patch.
   *
   * @param localPatch - The base patch (e.g., version 15)
   * @param remotePatches - Array of patches to merge (e.g., versions 16-20)
   * @returns MergeResult with either merged patch or all conflicts
   */
  mergePatches(localPatch: Patch, remotePatches: Patch[]): MergeResult {
    const allConflicts: Conflict[] = [];
    const localKeys = new Set(Object.keys(localPatch).filter(k => k !== 'version'));
    const currentMerged = { ...localPatch };

    // Merge each remote patch sequentially
    for (let i = 0; i < remotePatches.length; i++) {
      const remotePatch = remotePatches[i];
      const remoteKeys = Object.keys(remotePatch);

      // Find conflicts: remote patch modifies fields that exist in LOCAL patch
      // (remote patches can overwrite each other without conflict)
      const conflictKeys = remoteKeys.filter(key =>
        key !== 'version' &&
        localKeys.has(key) &&
        !this.areValuesEqual(localPatch[key], remotePatch[key]),
      );

      if (conflictKeys.length > 0) {
        // Collect conflicts from this patch
        conflictKeys.forEach(path => {
          // Only add conflict if we haven't already recorded it for this path
          const existingConflict = allConflicts.find(c => c.path === path);
          if (!existingConflict) {
            allConflicts.push({
              path,
              localValue: localPatch[path],
              remoteValue: remotePatch[path],
              remotePatchIndex: i,
            });
          }
        });
      }

      // Merge all fields from remote patch (overwrites previous remote values)
      remoteKeys.forEach(key => {
        if (key !== 'version') {
          currentMerged[key] = remotePatch[key];
        }
      });

      // Update version to highest seen so far
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
   * @param localPatch - The base patch
   * @param remotePatches - Array of remote patches
   * @param resolutions - Array of conflict resolutions
   * @returns Final resolved patch
   */
  applyResolutions(
    localPatch: Patch,
    remotePatches: Patch[],
    resolutions: ConflictResolution[],
  ): ResolveResult {
    // Start with local patch
    const resolved = { ...localPatch };

    // Build a map of conflict resolutions by conflict index
    const resolutionMap = new Map<number, ConflictResolution>();
    resolutions.forEach(res => {
      resolutionMap.set(res.conflictIndex, res);
    });

    // Collect all conflicts again to know which fields conflict
    const allConflicts: Conflict[] = [];
    const tempMerged = { ...localPatch };

    for (let i = 0; i < remotePatches.length; i++) {
      const remotePatch = remotePatches[i];
      const currentKeys = Object.keys(tempMerged);
      const remoteKeys = Object.keys(remotePatch);

      const conflictKeys = currentKeys.filter(key =>
        key !== 'version' &&
        remoteKeys.includes(key) &&
        !this.areValuesEqual(tempMerged[key], remotePatch[key]),
      );

      conflictKeys.forEach(path => {
        allConflicts.push({
          path,
          localValue: tempMerged[path],
          remoteValue: remotePatch[path],
          remotePatchIndex: i,
        });
      });
    }

    // Apply resolutions
    allConflicts.forEach((conflict, index) => {
      const resolution = resolutionMap.get(index);
      if (resolution) {
        if (resolution.strategy === 'use-local') {
          resolved[conflict.path] = conflict.localValue;
        } else {
          resolved[conflict.path] = conflict.remoteValue;
        }
      }
    });

    // Merge all non-conflicting fields from remote patches
    remotePatches.forEach(remotePatch => {
      const conflictPaths = new Set(allConflicts.map(c => c.path));
      Object.keys(remotePatch).forEach(key => {
        if (key !== 'version' && !conflictPaths.has(key)) {
          resolved[key] = remotePatch[key];
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

  /**
   * Check if two values are equal using deep comparison
   */
  private areValuesEqual(val1: any, val2: any): boolean {
    return JSON.stringify(val1) === JSON.stringify(val2);
  }
}
