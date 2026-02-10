import { describe, it, expect } from 'vitest';
import { ConflictResolver } from '../../src/services/ConflictResolver';

describe('ConflictResolver - Deep Merging', () => {
  const resolver = new ConflictResolver();

  describe('mergePatches', () => {
    describe('basic nested object merging', () => {
      it('should merge non-conflicting nested paths', () => {
        const localPatch = {
          user: {
            name: 'Alice',
            email: 'alice@example.com',
          },
        };

        const remotePatch = {
          user: {
            phone: '555-1234',
          },
        };

        const result = resolver.mergePatches(localPatch, [remotePatch]);

        expect(result.success).toBe(true);
        expect(result.merged).toEqual({
          user: {
            name: 'Alice',
            email: 'alice@example.com',
            phone: '555-1234',
          },
        });
      });

      it('should detect conflict when exact same path is modified', () => {
        const localPatch = {
          user: {
            name: 'Alice',
          },
        };

        const remotePatch = {
          user: {
            name: 'Bob',
          },
        };

        const result = resolver.mergePatches(localPatch, [remotePatch]);

        expect(result.success).toBe(false);
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts![0]).toEqual({
          path: 'user.name',
          localValue: 'Alice',
          remoteValue: 'Bob',
          remotePatchIndex: 0,
        });
      });

      it('should NOT conflict when different nested paths under same parent', () => {
        const localPatch = {
          user: {
            name: 'Alice',
          },
        };

        const remotePatch = {
          user: {
            email: 'alice@example.com',
          },
        };

        const result = resolver.mergePatches(localPatch, [remotePatch]);

        expect(result.success).toBe(true);
        expect(result.merged).toEqual({
          user: {
            name: 'Alice',
            email: 'alice@example.com',
          },
        });
      });

      it('should handle multiple levels of nesting', () => {
        const localPatch = {
          user: {
            address: {
              street: '123 Main St',
              city: 'Boston',
            },
          },
        };

        const remotePatch = {
          user: {
            address: {
              zipCode: '02101',
            },
          },
        };

        const result = resolver.mergePatches(localPatch, [remotePatch]);

        expect(result.success).toBe(true);
        expect(result.merged).toEqual({
          user: {
            address: {
              street: '123 Main St',
              city: 'Boston',
              zipCode: '02101',
            },
          },
        });
      });
    });

    describe('array handling', () => {
      it('should treat arrays as single values', () => {
        const localPatch = {
          tags: ['javascript', 'react'],
        };

        const remotePatch = {
          tags: ['javascript', 'react', 'typescript'],
        };

        const result = resolver.mergePatches(localPatch, [remotePatch]);

        expect(result.success).toBe(false);
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts![0].path).toBe('tags');
        expect(result.conflicts![0].localValue).toEqual(['javascript', 'react']);
        expect(result.conflicts![0].remoteValue).toEqual(['javascript', 'react', 'typescript']);
      });

      it('should not conflict if arrays are identical', () => {
        const localPatch = {
          tags: ['javascript', 'react'],
        };

        const remotePatch = {
          tags: ['javascript', 'react'],
          name: 'Updated',
        };

        const result = resolver.mergePatches(localPatch, [remotePatch]);

        expect(result.success).toBe(true);
        expect(result.merged).toEqual({
          tags: ['javascript', 'react'],
          name: 'Updated',
        });
      });
    });

    describe('complex project structure', () => {
      it('should merge different fields in nested container', () => {
        const localPatch = {
          pages: [{
            pageNum: 1,
            container: {
              text: {
                fontSize: 14,
                text: 'Hello',
              },
            },
          }],
        };

        const remotePatch = {
          pages: [{
            pageNum: 1,
            container: {
              image: {
                width: 200,
                height: 200,
              },
            },
          }],
        };

        const result = resolver.mergePatches(localPatch, [remotePatch]);

        expect(result.success).toBe(false);
        // Arrays conflict because entire array is different
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts![0].path).toBe('pages');
      });

      it('should handle updates to user info without conflicts', () => {
        const localPatch = {
          title: 'My Project',
          user: {
            name: 'Alice',
          },
        };

        const remotePatch = {
          description: 'Project description',
          user: {
            email: 'alice@example.com',
          },
        };

        const result = resolver.mergePatches(localPatch, [remotePatch]);

        expect(result.success).toBe(true);
        expect(result.merged).toEqual({
          title: 'My Project',
          description: 'Project description',
          user: {
            name: 'Alice',
            email: 'alice@example.com',
          },
        });
      });
    });

    describe('multiple remote patches', () => {
      it('should merge multiple patches sequentially', () => {
        const localPatch = {
          user: {
            name: 'Alice',
          },
          version: 1,
        };

        const remotePatches = [
          {
            user: {
              email: 'alice@example.com',
            },
            version: 2,
          },
          {
            user: {
              phone: '555-1234',
            },
            version: 3,
          },
        ];

        const result = resolver.mergePatches(localPatch, remotePatches);

        expect(result.success).toBe(true);
        expect(result.merged).toEqual({
          user: {
            name: 'Alice',
            email: 'alice@example.com',
            phone: '555-1234',
          },
          version: 3,
        });
      });

      it('should collect conflicts from multiple patches', () => {
        const localPatch = {
          user: {
            name: 'Alice',
            status: 'active',
          },
        };

        const remotePatches = [
          {
            user: {
              name: 'Bob',
            },
          },
          {
            user: {
              status: 'inactive',
            },
          },
        ];

        const result = resolver.mergePatches(localPatch, remotePatches);

        expect(result.success).toBe(false);
        expect(result.conflicts).toHaveLength(2);
        expect(result.conflicts![0].path).toBe('user.name');
        expect(result.conflicts![1].path).toBe('user.status');
      });
    });

    describe('edge cases', () => {
      it('should handle empty nested objects', () => {
        const localPatch = {
          user: {},
        };

        const remotePatch = {
          user: {
            name: 'Alice',
          },
        };

        const result = resolver.mergePatches(localPatch, [remotePatch]);

        expect(result.success).toBe(true);
        expect(result.merged).toEqual({
          user: {
            name: 'Alice',
          },
        });
      });

      it('should handle null values', () => {
        const localPatch = {
          user: {
            name: 'Alice',
            deleted: null,
          },
        };

        const remotePatch = {
          user: {
            email: 'alice@example.com',
          },
        };

        const result = resolver.mergePatches(localPatch, [remotePatch]);

        expect(result.success).toBe(true);
        expect(result.merged?.user.deleted).toBe(null);
        expect(result.merged?.user.email).toBe('alice@example.com');
      });
    });
  });

  describe('applyResolutions', () => {
    it('should resolve conflicts using local values', () => {
      const localPatch = {
        user: {
          name: 'Alice',
          email: 'alice@example.com',
        },
      };

      const remotePatch = {
        user: {
          name: 'Bob',
        },
      };

      const resolutions = [
        { conflictIndex: 0, strategy: 'use-local' as const },
      ];

      const result = resolver.applyResolutions(localPatch, [remotePatch], resolutions);

      expect(result.resolved).toEqual({
        user: {
          name: 'Alice',
          email: 'alice@example.com',
        },
      });
    });

    it('should resolve conflicts using remote values', () => {
      const localPatch = {
        user: {
          name: 'Alice',
        },
      };

      const remotePatch = {
        user: {
          name: 'Bob',
          email: 'bob@example.com',
        },
      };

      const resolutions = [
        { conflictIndex: 0, strategy: 'use-remote' as const },
      ];

      const result = resolver.applyResolutions(localPatch, [remotePatch], resolutions);

      expect(result.resolved).toEqual({
        user: {
          name: 'Bob',
          email: 'bob@example.com',
        },
      });
    });

    it('should handle multiple resolutions independently', () => {
      const localPatch = {
        user: {
          name: 'Alice',
          status: 'active',
        },
        title: 'Local Title',
      };

      const remotePatches = [
        {
          user: {
            name: 'Bob',
          },
        },
        {
          user: {
            status: 'inactive',
          },
          title: 'Remote Title',
        },
      ];

      const resolutions = [
        { conflictIndex: 0, strategy: 'use-local' as const },   // Keep Alice
        { conflictIndex: 1, strategy: 'use-remote' as const },  // Use inactive
        { conflictIndex: 2, strategy: 'use-remote' as const },  // Use Remote Title
      ];

      const result = resolver.applyResolutions(localPatch, remotePatches, resolutions);

      expect(result.resolved).toEqual({
        user: {
          name: 'Alice',
          status: 'inactive',
        },
        title: 'Remote Title',
      });
    });
  });
});
