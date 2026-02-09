import React from 'react';
import ReactDOM from 'react-dom/client';
import { PatchManager } from 'patch-and-resolve';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Example: Basic Usage</h1>
      <p>
        This example demonstrates how to use the patch-and-resolve library to merge
        conflicting patches from different sources (e.g., desktop and mobile devices).
      </p>
      <p>
        Try modifying the same field in both patches to see the conflict resolution modal!
      </p>

      <PatchManager
        onMergeComplete={(mergedPatch) => {
          console.log('Merged patch:', mergedPatch);
          // In your app, you would save this merged patch to your backend:
          // await fetch('/api/save', { method: 'POST', body: JSON.stringify(mergedPatch) });
        }}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
