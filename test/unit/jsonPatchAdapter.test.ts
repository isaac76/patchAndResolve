import { describe, it, expect } from 'vitest';
import { jsonPatchToDiff, diffToJsonPatch } from '../../src/utils/jsonPatchAdapter';

describe('jsonPatchAdapter', () => {
  describe('jsonPatchToDiff', () => {
    it('should convert replace operations to diff', () => {
      const operations = [
        { op: 'replace' as const, path: '/message', value: 'Hello' },
        { op: 'replace' as const, path: '/x', value: 100 },
      ];

      const result = jsonPatchToDiff(operations);

      expect(result).toEqual({
        message: 'Hello',
        x: 100,
      });
    });

    it('should convert add operations to diff', () => {
      const operations = [
        { op: 'add' as const, path: '/newField', value: 'new value' },
      ];

      const result = jsonPatchToDiff(operations);

      expect(result).toEqual({
        newField: 'new value',
      });
    });

    it('should handle mixed add and replace operations', () => {
      const operations = [
        { op: 'replace' as const, path: '/message', value: 'Updated' },
        { op: 'add' as const, path: '/status', value: 'active' },
      ];

      const result = jsonPatchToDiff(operations);

      expect(result).toEqual({
        message: 'Updated',
        status: 'active',
      });
    });

    it('should ignore remove operations', () => {
      const operations = [
        { op: 'replace' as const, path: '/message', value: 'Hello' },
        { op: 'remove' as const, path: '/oldField' },
      ];

      const result = jsonPatchToDiff(operations);

      expect(result).toEqual({
        message: 'Hello',
      });
    });

    it('should ignore move, copy, and test operations', () => {
      const operations = [
        { op: 'replace' as const, path: '/message', value: 'Hello' },
        { op: 'move' as const, path: '/newPath', from: '/oldPath' },
        { op: 'copy' as const, path: '/copy', from: '/original' },
        { op: 'test' as const, path: '/value', value: 'test' },
      ];

      const result = jsonPatchToDiff(operations);

      expect(result).toEqual({
        message: 'Hello',
      });
    });

    it('should ignore nested paths', () => {
      const operations = [
        { op: 'replace' as const, path: '/message', value: 'Hello' },
        { op: 'replace' as const, path: '/user/name', value: 'John' },
      ];

      const result = jsonPatchToDiff(operations);

      expect(result).toEqual({
        message: 'Hello',
      });
    });

    it('should handle empty operations array', () => {
      const result = jsonPatchToDiff([]);
      expect(result).toEqual({});
    });
  });

  describe('diffToJsonPatch', () => {
    it('should convert diff to replace operations', () => {
      const diff = {
        message: 'Hello',
        x: 100,
      };

      const result = diffToJsonPatch(diff);

      expect(result).toEqual([
        { op: 'replace', path: '/message', value: 'Hello' },
        { op: 'replace', path: '/x', value: 100 },
      ]);
    });

    it('should exclude version field', () => {
      const diff = {
        message: 'Hello',
        version: 5,
        x: 100,
      };

      const result = diffToJsonPatch(diff);

      expect(result).toEqual([
        { op: 'replace', path: '/message', value: 'Hello' },
        { op: 'replace', path: '/x', value: 100 },
      ]);
    });

    it('should handle empty diff', () => {
      const result = diffToJsonPatch({});
      expect(result).toEqual([]);
    });

    it('should handle various value types', () => {
      const diff = {
        string: 'text',
        number: 42,
        boolean: true,
        null: null,
        object: { nested: 'value' },
        array: [1, 2, 3],
      };

      const result = diffToJsonPatch(diff);

      expect(result).toEqual([
        { op: 'replace', path: '/string', value: 'text' },
        { op: 'replace', path: '/number', value: 42 },
        { op: 'replace', path: '/boolean', value: true },
        { op: 'replace', path: '/null', value: null },
        { op: 'replace', path: '/object', value: { nested: 'value' } },
        { op: 'replace', path: '/array', value: [1, 2, 3] },
      ]);
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve data through round-trip conversion', () => {
      const originalDiff = {
        message: 'Hello',
        x: 100,
        status: 'active',
      };

      const operations = diffToJsonPatch(originalDiff);
      const resultDiff = jsonPatchToDiff(operations);

      expect(resultDiff).toEqual(originalDiff);
    });
  });
});
