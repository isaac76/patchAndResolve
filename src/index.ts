// Public API exports for the library
export { PatchManager } from './components/PatchManager';
export { ConflictModal } from './components/ConflictModal';
export type { ConflictValueRenderContext } from './components/ConflictModal';
export { usePatchMerger } from './hooks/usePatchManager';
export { ConflictResolver } from './services/ConflictResolver';
export type {
  Patch,
  Conflict,
  MergeResult,
  ResolveStrategy,
  ConflictResolution,
  ResolveResult,
} from './types';
export {
  jsonPatchToDiff,
  diffToJsonPatch,
} from './utils/jsonPatchAdapter';
export type { JsonPatchOperation } from './utils/jsonPatchAdapter';
export {
  getNestedValue,
  setNestedValue,
  hasNestedPath,
  getAllPaths,
  deepEqual,
} from './utils/deepPath';
