import { describe, it, expect } from 'vitest';
import {
  getNestedValue,
  setNestedValue,
  hasNestedPath,
  getAllPaths,
  deepEqual,
} from '../../src/utils/deepPath';

describe('deepPath utilities', () => {
  describe('getNestedValue', () => {
    it('should get value from simple path', () => {
      const obj = { user: { name: 'Alice' } };
      expect(getNestedValue(obj, 'user.name')).toBe('Alice');
    });

    it('should get value from deep path', () => {
      const obj = { user: { address: { city: 'NYC' } } };
      expect(getNestedValue(obj, 'user.address.city')).toBe('NYC');
    });

    it('should return undefined for non-existent path', () => {
      const obj = { user: { name: 'Alice' } };
      expect(getNestedValue(obj, 'user.email')).toBeUndefined();
    });

    it('should return undefined when traversing through null', () => {
      const obj = { user: null };
      expect(getNestedValue(obj, 'user.name')).toBeUndefined();
    });
  });

  describe('setNestedValue', () => {
    it('should set value at simple path', () => {
      const obj = { user: { name: 'Alice' } };
      setNestedValue(obj, 'user.name', 'Bob');
      expect(obj.user.name).toBe('Bob');
    });

    it('should set value at deep path', () => {
      const obj = { user: { address: { city: 'NYC' } } };
      setNestedValue(obj, 'user.address.city', 'Boston');
      expect(obj.user.address.city).toBe('Boston');
    });

    it('should create intermediate objects as needed', () => {
      const obj: any = {};
      setNestedValue(obj, 'user.address.city', 'NYC');
      expect(obj.user.address.city).toBe('NYC');
    });

    it('should handle setting at top level', () => {
      const obj: any = {};
      setNestedValue(obj, 'name', 'Alice');
      expect(obj.name).toBe('Alice');
    });
  });

  describe('hasNestedPath', () => {
    it('should return true for existing path', () => {
      const obj = { user: { name: 'Alice' } };
      expect(hasNestedPath(obj, 'user.name')).toBe(true);
    });

    it('should return false for non-existent path', () => {
      const obj = { user: { name: 'Alice' } };
      expect(hasNestedPath(obj, 'user.email')).toBe(false);
    });

    it('should return false when path goes through null', () => {
      const obj = { user: null };
      expect(hasNestedPath(obj, 'user.name')).toBe(false);
    });

    it('should return true for partial path', () => {
      const obj = { user: { name: 'Alice' } };
      expect(hasNestedPath(obj, 'user')).toBe(true);
    });
  });

  describe('getAllPaths', () => {
    it('should extract all leaf paths from flat object', () => {
      const obj = { name: 'Alice', age: 30 };
      const paths = getAllPaths(obj);
      expect(paths).toEqual(['name', 'age']);
    });

    it('should extract nested paths', () => {
      const obj = {
        user: {
          name: 'Alice',
          email: 'alice@example.com',
        },
      };
      const paths = getAllPaths(obj);
      expect(paths).toEqual(['user.name', 'user.email']);
    });

    it('should extract deeply nested paths', () => {
      const obj = {
        user: {
          address: {
            city: 'NYC',
            zipCode: '10001',
          },
        },
      };
      const paths = getAllPaths(obj);
      expect(paths).toEqual(['user.address.city', 'user.address.zipCode']);
    });

    it('should treat arrays as leaf values', () => {
      const obj = {
        tags: ['javascript', 'react'],
        name: 'Project',
      };
      const paths = getAllPaths(obj);
      expect(paths).toEqual(['tags', 'name']);
    });

    it('should skip version field', () => {
      const obj = {
        name: 'Alice',
        version: 1,
        status: 'active',
      };
      const paths = getAllPaths(obj);
      expect(paths).toEqual(['name', 'status']);
      expect(paths).not.toContain('version');
    });

    it('should handle mixed nested structure', () => {
      const obj = {
        title: 'My Project',
        user: {
          name: 'Alice',
        },
        tags: ['js', 'react'],
      };
      const paths = getAllPaths(obj);
      expect(paths).toContain('title');
      expect(paths).toContain('user.name');
      expect(paths).toContain('tags');
    });

    it('should handle empty objects as leaf values', () => {
      const obj = {
        data: {},
        name: 'Test',
      };
      const paths = getAllPaths(obj);
      expect(paths).toEqual(['data', 'name']);
    });

    it('should handle null values', () => {
      const obj = {
        name: 'Alice',
        deleted: null,
      };
      const paths = getAllPaths(obj);
      expect(paths).toEqual(['name', 'deleted']);
    });
  });

  describe('deepEqual', () => {
    it('should return true for identical primitives', () => {
      expect(deepEqual(5, 5)).toBe(true);
      expect(deepEqual('hello', 'hello')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(deepEqual(5, 6)).toBe(false);
      expect(deepEqual('hello', 'world')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
    });

    it('should return true for identical objects', () => {
      const obj1 = { name: 'Alice', age: 30 };
      const obj2 = { name: 'Alice', age: 30 };
      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for different objects', () => {
      const obj1 = { name: 'Alice', age: 30 };
      const obj2 = { name: 'Bob', age: 30 };
      expect(deepEqual(obj1, obj2)).toBe(false);
    });

    it('should return true for identical nested objects', () => {
      const obj1 = { user: { name: 'Alice', address: { city: 'NYC' } } };
      const obj2 = { user: { name: 'Alice', address: { city: 'NYC' } } };
      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it('should return true for identical arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3];
      expect(deepEqual(arr1, arr2)).toBe(true);
    });

    it('should return false for different arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 4];
      expect(deepEqual(arr1, arr2)).toBe(false);
    });

    it('should return false for array vs object', () => {
      const arr = [1, 2, 3];
      const obj = { 0: 1, 1: 2, 2: 3 };
      expect(deepEqual(arr, obj)).toBe(false);
    });

    it('should handle null values', () => {
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual(null, {})).toBe(false);
    });
  });
});
