/**
 * Represents a patch - changes to be applied to a document
 */
export type Patch = Record<string, any>;

/**
 * Represents a single conflict between local and remote values
 */
export interface Conflict {
  /**
   * Field path that has conflicting values
   */
  path: string;

  /**
   * Value from the local patch
   */
  localValue: any;

  /**
   * Value from the remote patch
   */
  remoteValue: any;

  /**
   * Index of the remote patch that caused this conflict (if merging multiple patches)
   */
  remotePatchIndex?: number;
}

/**
 * Result of attempting to merge patches
 */
export interface MergeResult {
  /**
   * Whether the patches were successfully merged automatically
   */
  success: boolean;

  /**
   * The merged patch if successful
   */
  merged?: Patch;

  /**
   * Conflicts that require manual resolution
   */
  conflicts?: Conflict[];

  /**
   * Base patch that was being merged into
   */
  basePatch?: Patch;
}

/**
 * Strategy for resolving a single conflict
 */
export type ResolveStrategy = 'use-local' | 'use-remote';

/**
 * Resolution for a single conflict
 */
export interface ConflictResolution {
  /**
   * Index of the conflict being resolved
   */
  conflictIndex: number;

  /**
   * Strategy chosen to resolve this conflict
   */
  strategy: ResolveStrategy;
}

/**
 * Result of manual conflict resolution
 */
export interface ResolveResult {
  /**
   * All resolutions applied
   */
  resolutions: ConflictResolution[];

  /**
   * The final resolved patch
   */
  resolved: Patch;
}
