/**
 * Utilities for working with nested object paths
 */

/**
 * Get a value from a nested object using a dot-notation path
 * @param obj - The object to get the value from
 * @param path - Dot-notation path (e.g., "user.address.city")
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * Set a value in a nested object using a dot-notation path
 * Creates intermediate objects as needed
 * @param obj - The object to modify (will be mutated)
 * @param path - Dot-notation path (e.g., "user.address.city")
 * @param value - The value to set
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Check if a path exists in an object
 * @param obj - The object to check
 * @param path - Dot-notation path
 * @returns true if the path exists
 */
export function hasNestedPath(obj: any, path: string): boolean {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || typeof current !== 'object' || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return true;
}

/**
 * Get all leaf paths from a nested object
 * @param obj - The object to extract paths from
 * @param prefix - Current path prefix (used recursively)
 * @returns Array of dot-notation paths to all leaf values
 *
 * @example
 * const obj = { user: { name: "John", address: { city: "NYC" } } };
 * getAllPaths(obj) // ["user.name", "user.address.city"]
 */
export function getAllPaths(obj: any, prefix: string = ''): string[] {
  const paths: string[] = [];

  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    // Treat arrays and primitives as leaf values
    return prefix ? [prefix] : [];
  }

  const keys = Object.keys(obj);

  if (keys.length === 0) {
    // Empty object is a leaf value
    return prefix ? [prefix] : [];
  }

  for (const key of keys) {
    if (key === 'version') {
      // Skip version field
      continue;
    }

    const currentPath = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      // Leaf value (primitive, null, or array)
      paths.push(currentPath);
    } else {
      // Recurse into nested object
      const nestedPaths = getAllPaths(value, currentPath);
      paths.push(...nestedPaths);
    }
  }

  return paths;
}

/**
 * Deep equality check for values
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) {return true;}

  if (a === null || b === null) {return false;}
  if (typeof a !== 'object' || typeof b !== 'object') {return false;}

  if (Array.isArray(a) !== Array.isArray(b)) {return false;}

  if (Array.isArray(a)) {
    if (a.length !== b.length) {return false;}
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {return false;}

  return keysA.every(key => keysB.includes(key) && deepEqual(a[key], b[key]));
}
