import React from 'react';
import ReactDOM from 'react-dom/client';
import { PatchManager } from './index';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PatchManager
      onMergeComplete={(merged) => {
        console.log('Merged patch:', merged);
        // In a real app, this is where you would save the merged patch
        // e.g., await savePatch(merged);
      }}
    />
  </React.StrictMode>,
);
