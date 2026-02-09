# TODO

## NPM Publishing Setup

- [ ] Create npm account
- [ ] Generate npm access token (automation token recommended)
- [ ] Add `NPM_TOKEN` to GitHub repository secrets (Settings → Secrets and variables → Actions)
- [ ] Add `"@semantic-release/npm"` back to `.releaserc.json` plugins array (after `"@semantic-release/changelog"`)
- [ ] Add `NPM_TOKEN: ${{ secrets.NPM_TOKEN }}` to the release job environment variables in `.github/workflows/release.yml`

Once complete, the library will automatically publish to npm registry with each release.
