# TODO

## NPM Publishing Setup

- [ ] Create npm account
- [ ] Generate npm access token (automation token recommended)
- [ ] Add `NPM_TOKEN` to GitHub repository secrets (Settings → Secrets and variables → Actions)
- [ ] In `.releaserc.json`, change `"npmPublish": false` to `"npmPublish": true` in the `@semantic-release/npm` plugin configuration
- [ ] Add `NPM_TOKEN: ${{ secrets.NPM_TOKEN }}` to the release job environment variables in `.github/workflows/release.yml`

Once complete, the library will automatically publish to npm registry with each release.

## Nested Path Support (Future Enhancement)

Currently, the library only supports flat object patches (top-level fields). To support JSON Patch nested paths like `/user/address/city`, we need to add deep merging capabilities.

**Proposed Approach:**
- [ ] Add a new method (e.g., `mergeDeepPatches()`) to ConflictResolver to avoid breaking existing behavior
- [ ] Keep current `mergePatches()` unchanged for backward compatibility
- [ ] If deep merging proves successful, consider deprecating flat merging in a future major version

**Technical Challenges:**

1. **Path Parsing & Object Creation**
   - Parse JSON Patch paths: `/user/address/city` → `['user', 'address', 'city']`
   - Create nested object structures from path segments
   - Handle array indices in paths (e.g., `/items/0/name`)

2. **Deep Merge Logic**
   - Recursively merge nested objects
   - **Design Decision: Field-level conflict detection (most granular)**
   - Example scenarios:
     - Local changes `/user/name`, remote changes `/user/address/city` → **No conflict** (different paths, merge both)
     - Local changes `/user/name`, remote changes `/user/name` → **Conflict** (same path)
     - Local changes `/user/address/city`, remote changes `/user/address/city` → **Conflict** (same path)
   - Only exact path matches trigger conflicts, allowing maximum merge flexibility

3. **Conflict Detection**
   - Track full paths for conflicts (e.g., `"user.address.city"` instead of `"city"`)
   - Conflicts occur **only when exact same path is modified** by both patches
   - Different paths under same parent object merge without conflict
   - Special case: If one patch replaces entire parent object (e.g., `/user`) and another modifies child (e.g., `/user/name`), the parent replacement takes precedence (removes child changes)
   - Special handling for array operations (replace entire array vs. modify elements)

4. **UI/UX Considerations**
   - Display nested paths clearly in ConflictModal
   - Show context for deeply nested conflicts
   - Potentially allow users to view/compare entire parent objects
   - Consider tree view for complex nested structures

5. **Type Safety**
   - Update TypeScript types to support nested structures
   - Consider making Patch type generic: `Patch<T>`
   - Ensure type safety through deep object paths

6. **Testing**
   - Unit tests for various nesting levels
   - Edge cases: empty objects, null values, arrays
   - Performance testing with deeply nested structures
   - Backward compatibility tests

**Example API:**
```typescript
// New method for deep merging
const result = resolver.mergeDeepPatches(localPatch, remotePatches);

// Conflicts would include full paths
// { path: "user.address.city", localValue: "Boston", remoteValue: "NYC" }
```

**References:**
- JSON Patch RFC 6902 for path format standards
- Libraries like `lodash.merge` for deep merge inspiration
- Consider `immer` for immutable nested updates

