import React, { useState } from 'react';
import { ConflictModal } from './ConflictModal';
import { usePatchMerger } from '../hooks/usePatchManager';
import type { Patch, MergeResult, ConflictResolution } from '../types';

interface PatchManagerProps {
  onMergeComplete?: (mergedPatch: Patch) => void;
}

/**
 * Demo component showing how to merge multiple patches and handle conflicts
 */
export const PatchManager: React.FC<PatchManagerProps> = ({ onMergeComplete }) => {
  const [localPatchText, setLocalPatchText] = useState(
    JSON.stringify({ version: 15, message: 'Hello from desktop', x: 100, y: 50 }, null, 2),
  );
  const [remotePatches, setRemotePatches] = useState<Patch[]>([
    { version: 16, message: 'Hello from mobile', x: 110, y: 60 },
    { version: 17, z: 300 },
  ]);
  const [remotePatchTexts, setRemotePatchTexts] = useState<string[]>([
    JSON.stringify({ version: 16, message: 'Hello from mobile', x: 110, y: 60 }, null, 2),
    JSON.stringify({ version: 17, z: 300 }, null, 2),
  ]);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { mergePatches, applyResolutions } = usePatchMerger({
    onMergeSuccess: (merged) => {
      setResult({ success: true, merged });
      onMergeComplete?.(merged);
    },
    onConflict: (conflictResult) => {
      setResult(conflictResult);
      setShowModal(true);
    },
  });

  const handleMerge = () => {
    setResult(null);
    // Parse text to patches before merging
    try {
      const local = JSON.parse(localPatchText);
      const remotes = remotePatchTexts.map(text => JSON.parse(text));
      mergePatches(local, remotes);
    } catch (error) {
      setResult({
        success: false,
        conflicts: [{
          path: 'JSON Parse Error',
          localValue: 'Invalid JSON',
          remoteValue: String(error),
        }],
      });
    }
  };

  const handleResolveAll = (resolutions: ConflictResolution[]) => {
    const resolved = applyResolutions(resolutions);
    if (resolved) {
      setResult({ success: true, merged: resolved });
      setShowModal(false);
      onMergeComplete?.(resolved);
    }
  };

  const updateLocalPatch = (value: string) => {
    setLocalPatchText(value);
  };

  const updateRemotePatch = (index: number, value: string) => {
    const newTexts = [...remotePatchTexts];
    newTexts[index] = value;
    setRemotePatchTexts(newTexts);
  };

  const addRemotePatch = () => {
    const newVersion = Math.max(...remotePatches.map(p => p.version || 0)) + 1;
    const newPatch = { version: newVersion };
    setRemotePatches([...remotePatches, newPatch]);
    setRemotePatchTexts([...remotePatchTexts, JSON.stringify(newPatch, null, 2)]);
  };

  const removeRemotePatch = (index: number) => {
    setRemotePatches(remotePatches.filter((_, i) => i !== index));
    setRemotePatchTexts(remotePatchTexts.filter((_, i) => i !== index));
  };

  // Custom renderer for visual previews
  const renderConflictValue = (value: any, context: { conflict: any; side: 'local' | 'remote'; isSelected: boolean }) => {
    const { isSelected } = context;

    // Check if this is a conflict with visual properties we can preview
    const hasMessage = value && typeof value === 'object' && 'message' in value;
    const hasPosition = value && typeof value === 'object' && ('x' in value || 'y' in value);

    // If it has visual properties, render a preview
    if (hasMessage || hasPosition) {
      const message = value.message || 'Preview';
      const x = value.x || 0;
      const y = value.y || 0;

      return (
        <div
          style={{
            backgroundColor: isSelected ? '#e8f5e9' : '#f5f5f5',
            padding: '20px',
            borderRadius: '4px',
            minHeight: '150px',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '10px',
              fontFamily: 'monospace',
            }}
          >
            Position: x={x}, y={y}
          </div>
          {/* Visual preview showing actual position */}
          <div
            style={{
              position: 'absolute',
              left: `${20 + x}px`,
              top: `${40 + y / 10}px`, // Scale y for better visual
              padding: '8px 12px',
              backgroundColor: isSelected ? '#4CAF50' : '#2196F3',
              color: 'white',
              borderRadius: '4px',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              maxWidth: '200px',
              wordWrap: 'break-word',
            }}
          >
            {message}
          </div>
          {/* Also show the raw JSON for reference */}
          <pre
            style={{
              marginTop: '80px',
              fontSize: '11px',
              color: '#666',
              backgroundColor: 'rgba(255,255,255,0.5)',
              padding: '8px',
              borderRadius: '4px',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    }

    // For non-visual data, fall back to JSON display
    return (
      <pre
        style={{
          backgroundColor: isSelected ? '#e8f5e9' : '#f5f5f5',
          padding: '15px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '300px',
          fontSize: '13px',
          margin: 0,
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Patch Merge Demo</h1>
      <p>
        Merge multiple remote patches into a local patch. Example: Desktop has version 15,
        server has versions 16-20. Patches are merged sequentially. If any conflicts occur,
        step through them one at a time.
      </p>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <h2>Local Patch (Your Changes)</h2>
          <textarea
            value={localPatchText}
            onChange={(e) => updateLocalPatch(e.target.value)}
            rows={10}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              padding: '10px',
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Remote Patches (From Server)</h2>
            <button
              onClick={addRemotePatch}
              style={{
                padding: '5px 10px',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              + Add Patch
            </button>
          </div>
          {remotePatches.map((patch, index) => (
            <div key={index} style={{ marginBottom: '10px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <small style={{ color: '#666' }}>
                  Remote Patch #{index + 1} {patch.version ? `(v${patch.version})` : ''}
                </small>
                <button
                  onClick={() => removeRemotePatch(index)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                >
                  × Remove
                </button>
              </div>
              <textarea
                value={remotePatchTexts[index]}
                onChange={(e) => updateRemotePatch(index, e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  padding: '10px',
                  fontSize: '12px',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleMerge}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        Merge Patches
      </button>

      {result && (
        <div style={{ marginTop: '20px' }}>
          {result.success ? (
            <div
              style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                padding: '15px',
                borderRadius: '4px',
              }}
            >
              <h3 style={{ marginTop: 0, color: '#155724' }}>✓ Merged Successfully!</h3>
              <pre style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(result.merged, null, 2)}
              </pre>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                padding: '15px',
                borderRadius: '4px',
              }}
            >
              <h3 style={{ marginTop: 0, color: '#856404' }}>
                ⚠ {result.conflicts?.length} Conflict{result.conflicts?.length !== 1 ? 's' : ''} Detected
              </h3>
              <p>The patches modify the same fields. A modal will help you resolve them one at a time.</p>
            </div>
          )}
        </div>
      )}

      {showModal && result && !result.success && result.conflicts && (
        <ConflictModal
          conflicts={result.conflicts}
          onResolveAll={handleResolveAll}
          onClose={() => setShowModal(false)}
          renderConflictValue={renderConflictValue}
        />
      )}
    </div>
  );
};
