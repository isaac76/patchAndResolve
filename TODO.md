# TODO

## ✅ Completed

### NPM Publishing Setup
- ✅ Published to npm as `@iodev/patch-and-resolve`
- ✅ Automated releases with semantic-release
- ✅ GitHub Actions CI/CD pipeline
- ✅ Keywords and GPL-3.0 license configured

### Nested Object Support
- ✅ Deep merging implemented with field-level conflict detection
- ✅ Unified API (single `mergePatches()` method handles both flat and nested)
- ✅ All 75 tests passing

---

## Future Enhancements

### 1. Verify NPM Package Integration
**Goal:** Confirm the published package works as expected in real projects

**Tasks:**
- [ ] Create a test React app: `npm create vite@latest test-app -- --template react-ts`
- [ ] Install the published package: `npm install @iodev/patch-and-resolve`
- [ ] Import and verify all exports work correctly
- [ ] Test basic functionality (mergePatches, ConflictModal, etc.)
- [ ] Verify TypeScript types are properly included
- [ ] Document any issues or missing exports

### 2. Visual Diff Demo Project
**Goal:** Create a demo showing UI changes (not just JSON), making conflicts more intuitive

**Vision:**
- Two side-by-side panels: "Local version" vs "Remote version"
- Live rendered preview showing actual visual differences
- Conflicts highlighted in the UI itself (not just in JSON)
- Use existing ConflictModal for resolution logic

**Possible Demo Ideas:**
- **Rich text editor** - show formatting changes with conflict resolution
  - Tools: Monaco Editor, Slate.js, Quill
  - Conflicts: text formatting, content changes, cursor positions
  
- **Form builder** - drag/drop components, show layout conflicts
  - Conflicts: component positions, property changes, structure
  
- **Visual design tool** - colors, positions, styles with live preview
  - Conflicts: CSS properties, element positions, z-index
  
- **Document editor** - Google Docs style with change tracking
  - Highlight conflicting text sections visually
  - Show inline diff markers

**Technical Approach:**
- Separate repo or `/examples/visual-demo/` folder
- Use the published `@iodev/patch-and-resolve` package
- Rich component library (e.g., Semantic UI, Material-UI)
- Real-time preview updates as patches are applied
- Visual conflict indicators in the rendered UI

**Benefits:**
- Better showcase for potential users
- More intuitive understanding of conflict resolution
- Real-world usage demonstration
- Marketing/documentation tool

### 3. Advanced Features (Lower Priority)
- [ ] Add provenance/attestation for npm publishing (Trusted Publishing)
- [ ] Performance benchmarks for deeply nested objects
- [ ] Support for array item merging (currently treats arrays as atomic values)
- [ ] Plugin system for custom conflict resolution strategies
- [ ] Integration guides for popular frameworks (Next.js, Remix, etc.)

---

## Semantic Versioning Reference

For future commits, remember conventional commit format for semantic-release:

- **`fix:`** → Patch bump (1.0.7 → 1.0.8)
- **`feat:`** → Minor bump (1.0.7 → 1.1.0)
- **`feat!:`** or **`BREAKING CHANGE:`** → Major bump (1.0.7 → 2.0.0)
- **`chore:`, `docs:`, `style:`, `refactor:`, `test:`, `ci:`** → No version bump

Example breaking change:
```bash
git commit -m "feat!: redesign conflict resolution API

BREAKING CHANGE: mergePatches now requires options object"
```
