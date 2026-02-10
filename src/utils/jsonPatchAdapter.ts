import type { Patch } from '../types';

/**
 * JSON Patch operation types (RFC 6902)
 */
export interface JsonPatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: any;
  from?: string;
}

/**
 * Converts a JSON Patch (RFC 6902) array of operations to a simple diff object.
 * Only processes 'add' and 'replace' operations for top-level paths.
 * Ignores 'remove', 'move', 'copy', and 'test' operations as they don't map to simple diffs.
 * Nested paths (e.g., "/user/name") are not supported - only top-level fields (e.g., "/name").
 *
 * @param operations - Array of JSON Patch operations
 * @returns A patch object representing the changes
 *
 * @example
 * const operations = [
 *   { op: "replace", path: "/message", value: "Hello" },
 *   { op: "add", path: "/x", value: 100 }
 * ];
 * const diff = jsonPatchToDiff(operations);
 * // Returns: { message: "Hello", x: 100 }
 */
export function jsonPatchToDiff(operations: JsonPatchOperation[]): Patch {
  const diff: Patch = {};

  for (const op of operations) {
    // Only process add and replace operations
    if (op.op !== 'add' && op.op !== 'replace') {
      continue;
    }

    // Parse the path - only support top-level paths like "/fieldName"
    // Ignore nested paths like "/user/name" for simplicity
    const pathMatch = op.path.match(/^\/([^/]+)$/);
    if (!pathMatch) {
      console.warn(`jsonPatchToDiff: Ignoring nested or invalid path: ${op.path}`);
      continue;
    }

    const fieldName = pathMatch[1];
    diff[fieldName] = op.value;
  }

  return diff;
}

/**
 * Converts a simple diff object to a JSON Patch (RFC 6902) array of operations.
 * All changes are converted to 'replace' operations.
 *
 * @param diff - A patch object representing changes
 * @returns Array of JSON Patch operations
 *
 * @example
 * const diff = { message: "Hello", x: 100 };
 * const operations = diffToJsonPatch(diff);
 * // Returns: [
 * //   { op: "replace", path: "/message", value: "Hello" },
 * //   { op: "replace", path: "/x", value: 100 }
 * // ]
 */
export function diffToJsonPatch(diff: Patch): JsonPatchOperation[] {
  return Object.entries(diff)
    .filter(([key]) => key !== 'version') // Exclude version field
    .map(([key, value]) => ({
      op: 'replace' as const,
      path: `/${key}`,
      value,
    }));
}
