import { describe, it, expect } from 'vitest';
import { ConflictResolver } from '../../src/services/ConflictResolver';
import projectFixture from '../fixtures/project.json';

describe('ConflictResolver', () => {
  const resolver = new ConflictResolver();

  describe('mergePatches with single remote patch', () => {
    it('should successfully merge non-overlapping patches', () => {
      const local = { x: 100, message: 'Hello' };
      const remote = [{ y: 200, imageId: 'img123' }];

      const result = resolver.mergePatches(local, remote);

      expect(result.success).toBe(true);
      expect(result.merged).toEqual({
        x: 100,
        message: 'Hello',
        y: 200,
        imageId: 'img123',
      });
      expect(result.conflicts).toBeUndefined();
    });

    it('should detect conflicts when patches modify the same field', () => {
      const local = { message: 'Hello from desktop', x: 100 };
      const remote = [{ message: 'Hello from mobile', y: 200 }];

      const result = resolver.mergePatches(local, remote);

      expect(result.success).toBe(false);
      expect(result.merged).toBeUndefined();
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts?.[0]).toEqual({
        path: 'message',
        localValue: 'Hello from desktop',
        remoteValue: 'Hello from mobile',
        remotePatchIndex: 0,
      });
    });

    it('should merge when same field has same value', () => {
      const local = { message: 'Hello', x: 100 };
      const remote = [{ message: 'Hello', y: 200 }];

      const result = resolver.mergePatches(local, remote);

      expect(result.success).toBe(true);
      expect(result.merged).toEqual({
        message: 'Hello',
        x: 100,
        y: 200,
      });
    });

    it('should detect multiple conflicts from one patch', () => {
      const local = { x: 100, y: 200, z: 300 };
      const remote = [{ x: 150, y: 250, w: 400 }];

      const result = resolver.mergePatches(local, remote);

      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(2);
      expect(result.conflicts?.map(c => c.path).sort()).toEqual(['x', 'y']);
    });
  });

  describe('mergePatches with multiple remote patches', () => {
    it('should successfully merge multiple non-conflicting patches', () => {
      const local = { version: 15, x: 100 };
      const remote = [
        { version: 16, y: 200 },
        { version: 17, z: 300 },
        { version: 18, w: 400 },
      ];

      const result = resolver.mergePatches(local, remote);

      expect(result.success).toBe(true);
      expect(result.merged).toEqual({
        version: 18,
        x: 100,
        y: 200,
        z: 300,
        w: 400,
      });
    });

    it('should collect conflicts from multiple patches', () => {
      const local = { version: 15, message: 'Local', x: 100 };
      const remote = [
        { version: 16, message: 'Remote 1', y: 200 },
        { version: 17, x: 150, z: 300 },
      ];

      const result = resolver.mergePatches(local, remote);

      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(2);

      // Conflict from first remote patch
      expect(result.conflicts?.[0]).toEqual({
        path: 'message',
        localValue: 'Local',
        remoteValue: 'Remote 1',
        remotePatchIndex: 0,
      });

      // Conflict from second remote patch
      expect(result.conflicts?.[1]).toEqual({
        path: 'x',
        localValue: 100,
        remoteValue: 150,
        remotePatchIndex: 1,
      });
    });

    it('should merge some patches and collect conflicts from others', () => {
      const local = { version: 15, a: 1, b: 2 };
      const remote = [
        { version: 16, c: 3 }, // no conflict
        { version: 17, a: 10 }, // conflict on 'a'
        { version: 18, d: 4 }, // no conflict
        { version: 19, b: 20 }, // conflict on 'b'
      ];

      const result = resolver.mergePatches(local, remote);

      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(2);
      expect(result.conflicts?.map(c => c.path).sort()).toEqual(['a', 'b']);
    });
  });

  describe('applyResolutions', () => {
    it('should resolve conflicts using local values', () => {
      const local = { message: 'Local', x: 100 };
      const remote = [{ message: 'Remote', y: 200 }];

      const resolutions = [
        { conflictIndex: 0, strategy: 'use-local' as const },
      ];

      const result = resolver.applyResolutions(local, remote, resolutions);

      expect(result.resolved).toEqual({
        message: 'Local', // kept local value
        x: 100,
        y: 200,
      });
    });

    it('should resolve conflicts using remote values', () => {
      const local = { message: 'Local', x: 100 };
      const remote = [{ message: 'Remote', y: 200 }];

      const resolutions = [
        { conflictIndex: 0, strategy: 'use-remote' as const },
      ];

      const result = resolver.applyResolutions(local, remote, resolutions);

      expect(result.resolved).toEqual({
        message: 'Remote', // kept remote value
        x: 100,
        y: 200,
      });
    });

    it('should resolve multiple conflicts independently', () => {
      const local = { a: 1, b: 2, c: 3 };
      const remote = [
        { a: 10, d: 4 },
        { b: 20, e: 5 },
      ];

      const resolutions = [
        { conflictIndex: 0, strategy: 'use-local' as const }, // keep local 'a'
        { conflictIndex: 1, strategy: 'use-remote' as const }, // use remote 'b'
      ];

      const result = resolver.applyResolutions(local, remote, resolutions);

      expect(result.resolved).toEqual({
        a: 1, // local
        b: 20, // remote
        c: 3,
        d: 4,
        e: 5,
      });
    });

    it('should handle complex resolution with multiple patches', () => {
      const local = { version: 15, x: 1, y: 2, z: 3 };
      const remote = [
        { version: 16, x: 10, a: 100 },
        { version: 17, y: 20, b: 200 },
        { version: 18, z: 30, c: 300 },
      ];

      const resolutions = [
        { conflictIndex: 0, strategy: 'use-remote' as const }, // x = 10
        { conflictIndex: 1, strategy: 'use-local' as const },  // y = 2
        { conflictIndex: 2, strategy: 'use-remote' as const }, // z = 30
      ];

      const result = resolver.applyResolutions(local, remote, resolutions);

      expect(result.resolved).toEqual({
        version: 18,
        x: 10, // remote
        y: 2,  // local
        z: 30, // remote
        a: 100,
        b: 200,
        c: 300,
      });
    });
  });

  describe('version handling', () => {
    it('should use higher version when merging patches with versions', () => {
      const local = { version: 3, textAsset: { text: 'Updated text' } };
      const remote = [{ version: 7, asset: { xOffset: 50, yOffset: 100 } }];

      const result = resolver.mergePatches(local, remote);

      expect(result.success).toBe(true);
      expect(result.merged).toEqual({
        version: 7, // higher version
        textAsset: { text: 'Updated text' },
        asset: { xOffset: 50, yOffset: 100 },
      });
    });

    it('should use highest version from multiple remote patches', () => {
      const local = { version: 15, a: 1 };
      const remote = [
        { version: 16, b: 2 },
        { version: 20, c: 3 },
        { version: 18, d: 4 },
      ];

      const result = resolver.mergePatches(local, remote);

      expect(result.success).toBe(true);
      expect(result.merged?.version).toBe(20);
    });

    it('should not treat version as a conflict', () => {
      const local = { version: 3, message: 'Hello' };
      const remote = [{ version: 7, imageId: 'img123' }];

      const result = resolver.mergePatches(local, remote);

      expect(result.success).toBe(true);
      expect(result.conflicts).toBeUndefined();
      expect(result.merged?.version).toBe(7);
    });

    it('should work without version fields', () => {
      const local = { message: 'Hello' };
      const remote = [{ imageId: 'img123' }];

      const result = resolver.mergePatches(local, remote);

      expect(result.success).toBe(true);
      expect(result.merged).toEqual({
        message: 'Hello',
        imageId: 'img123',
      });
      expect(result.merged).not.toHaveProperty('version');
    });

    it('should handle version in conflict resolution', () => {
      const local = { version: 3, message: 'Local' };
      const remote = [{ version: 7, message: 'Remote' }];

      const resolutions = [
        { conflictIndex: 0, strategy: 'use-local' as const },
      ];

      const result = resolver.applyResolutions(local, remote, resolutions);

      expect(result.resolved).toEqual({
        version: 7, // higher version
        message: 'Local', // local value due to resolution
      });
    });
  });

  describe('realistic scenarios with project fixture', () => {
    it('should merge text changes from mobile with offset changes from desktop', () => {
      // Desktop (version 15): user changes asset position
      const desktopPatch = {
        version: 15,
        asset: {
          ...projectFixture.asset,
          xOffset: 50,
          yOffset: 100,
        },
      };

      // Server has version 16 with text changes
      const serverPatches = [
        {
          version: 16,
          textAsset: {
            ...projectFixture.textAsset,
            text: 'Updated from mobile!',
          },
        },
      ];

      const result = resolver.mergePatches(desktopPatch, serverPatches);

      expect(result.success).toBe(true);
      expect(result.merged).toEqual({
        version: 16,
        textAsset: {
          ...projectFixture.textAsset,
          text: 'Updated from mobile!',
        },
        asset: {
          ...projectFixture.asset,
          xOffset: 50,
          yOffset: 100,
        },
      });
    });

    it('should detect conflict when both local and remote modify same field', () => {
      // Desktop: changes text
      const desktopPatch = {
        version: 15,
        textAsset: {
          ...projectFixture.textAsset,
          text: 'Desktop version',
        },
      };

      // Server: also changes text
      const serverPatches = [
        {
          version: 16,
          textAsset: {
            ...projectFixture.textAsset,
            text: 'Mobile version',
          },
        },
      ];

      const result = resolver.mergePatches(desktopPatch, serverPatches);

      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts?.[0].path).toBe('textAsset');
    });

    it('should handle catching up with multiple server versions', () => {
      // Desktop is at version 15
      const desktopPatch = {
        version: 15,
        message: 'Local changes',
      };

      // Server is at version 20 - need patches 16-20
      const serverPatches = [
        { version: 16, textAsset: { text: 'Change 1' } },
        { version: 17, offsetX: 10 },
        { version: 18, image: { width: 200 } },
        { version: 19, textAsset: { text: 'Change 2' } }, // overwrites v16's textAsset
        { version: 20, offsetY: 20 },
      ];

      const result = resolver.mergePatches(desktopPatch, serverPatches);

      expect(result.success).toBe(true);
      expect(result.merged).toEqual({
        version: 20,
        message: 'Local changes',
        textAsset: { text: 'Change 2' }, // final value from v19
        offsetX: 10, // from v17
        offsetY: 20, // from v20
        image: { width: 200 }, // from v18
      });
    });
  });
});
