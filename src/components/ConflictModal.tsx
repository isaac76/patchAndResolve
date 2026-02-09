import React, { useState } from 'react';
import type { Conflict, ResolveStrategy, ConflictResolution } from '../types';

export interface ConflictValueRenderContext {
  conflict: Conflict;
  side: 'local' | 'remote';
  isSelected: boolean;
}

interface ConflictModalProps {
  conflicts: Conflict[];
  onResolveAll: (resolutions: ConflictResolution[]) => void;
  onClose: () => void;
  /**
   * Optional custom renderer for conflict values.
   * Use this to show semantic previews instead of raw JSON.
   * If not provided, displays values as formatted JSON.
   */
  renderConflictValue?: (value: any, context: ConflictValueRenderContext) => React.ReactNode;
}

/**
 * Modal component for stepping through and resolving patch conflicts one at a time
 */
export const ConflictModal: React.FC<ConflictModalProps> = ({
  conflicts,
  onResolveAll,
  onClose,
  renderConflictValue,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Map<number, ResolveStrategy>>(new Map());

  const currentConflict = conflicts[currentIndex];
  const totalConflicts = conflicts.length;
  const isFirstConflict = currentIndex === 0;
  const isLastConflict = currentIndex === totalConflicts - 1;
  const currentResolution = resolutions.get(currentIndex);

  const handleResolve = (strategy: ResolveStrategy) => {
    setResolutions(new Map(resolutions.set(currentIndex, strategy)));
  };

  // Default renderer for conflict values
  const defaultRenderer = (value: any) => (
    <pre
      style={{
        backgroundColor: '#f5f5f5',
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

  const renderValue = (value: any, side: 'local' | 'remote') => {
    const isSelected = currentResolution === (side === 'local' ? 'use-local' : 'use-remote');

    if (renderConflictValue) {
      return renderConflictValue(value, {
        conflict: currentConflict,
        side,
        isSelected,
      });
    }

    return defaultRenderer(value);
  };

  const handlePrevious = () => {
    if (!isFirstConflict) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isLastConflict && currentResolution) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleFinish = () => {
    if (resolutions.size === totalConflicts) {
      const resolutionArray: ConflictResolution[] = [];
      resolutions.forEach((strategy, index) => {
        resolutionArray.push({ conflictIndex: index, strategy });
      });
      onResolveAll(resolutionArray);
    }
  };

  const allResolved = resolutions.size === totalConflicts;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '900px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <h2>Patch Conflict Resolution</h2>
        <p style={{ color: '#666' }}>
          Conflict {currentIndex + 1} of {totalConflicts}
        </p>

        <div
          style={{
            backgroundColor: '#fff3cd',
            padding: '15px',
            borderRadius: '4px',
            marginTop: '20px',
            border: '1px solid #ffc107',
          }}
        >
          <div style={{ marginBottom: '10px' }}>
            <strong>Field:</strong> <code>{currentConflict.path}</code>
          </div>
          {currentConflict.remotePatchIndex !== undefined && (
            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
              Conflict from remote patch #{currentConflict.remotePatchIndex + 1}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{ flex: 1 }}>
            <h3>Local Value</h3>
            <div
              style={{
                border: currentResolution === 'use-local'
                  ? '2px solid #4CAF50'
                  : '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              {renderValue(currentConflict.localValue, 'local')}
            </div>
            <button
              onClick={() => handleResolve('use-local')}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                backgroundColor: currentResolution === 'use-local' ? '#4CAF50' : '#ddd',
                color: currentResolution === 'use-local' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                fontWeight: currentResolution === 'use-local' ? 'bold' : 'normal',
              }}
            >
              {currentResolution === 'use-local' ? '✓ Selected' : 'Use Local'}
            </button>
          </div>

          <div style={{ flex: 1 }}>
            <h3>Remote Value</h3>
            <div
              style={{
                border: currentResolution === 'use-remote'
                  ? '2px solid #2196F3'
                  : '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              {renderValue(currentConflict.remoteValue, 'remote')}
            </div>
            <button
              onClick={() => handleResolve('use-remote')}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                backgroundColor: currentResolution === 'use-remote' ? '#2196F3' : '#ddd',
                color: currentResolution === 'use-remote' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                fontWeight: currentResolution === 'use-remote' ? 'bold' : 'normal',
              }}
            >
              {currentResolution === 'use-remote' ? '✓ Selected' : 'Use Remote'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrevious}
              disabled={isFirstConflict}
              style={{
                padding: '10px 20px',
                backgroundColor: isFirstConflict ? '#e0e0e0' : '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isFirstConflict ? 'not-allowed' : 'pointer',
              }}
            >
              ← Previous
            </button>
            <button
              onClick={handleNext}
              disabled={isLastConflict || !currentResolution}
              style={{
                padding: '10px 20px',
                backgroundColor: (isLastConflict || !currentResolution) ? '#e0e0e0' : '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (isLastConflict || !currentResolution) ? 'not-allowed' : 'pointer',
              }}
            >
              Next →
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleFinish}
              disabled={!allResolved}
              style={{
                padding: '10px 20px',
                backgroundColor: allResolved ? '#4CAF50' : '#e0e0e0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: allResolved ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              Finish ({resolutions.size}/{totalConflicts})
            </button>
          </div>
        </div>

        {!currentResolution && (
          <p style={{ marginTop: '15px', color: '#ff9800', fontSize: '14px', textAlign: 'center' }}>
            Please select either Local or Remote to continue
          </p>
        )}
      </div>
    </div>
  );
};
