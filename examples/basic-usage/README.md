# Integration Test Example

This example application demonstrates how to use the `patch-and-resolve` library in a real project.

## Setup

```bash
npm install
npm run dev
```

The app will run on http://localhost:3002

## Testing the Library

1. Modify the JSON document in the textarea
2. Click "Save Document"
3. To test conflict resolution, you would need a backend server returning 409 conflicts

## Backend Mock

For integration testing, you'll need to set up a mock backend server that:
- Accepts POST requests to `/api/projects/:id/patch`
- Returns 200 with updated document on success
- Returns 409 with current version on conflict
