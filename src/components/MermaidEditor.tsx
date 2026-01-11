import React from 'react';
import Editor from '@monaco-editor/react';

interface MermaidEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * Monaco Editor component for Mermaid code input
 */
export const MermaidEditor: React.FC<MermaidEditorProps> = ({
  value,
  onChange,
  error
}) => {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="mermaid-editor" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid #ddd', padding: '8px', background: '#f5f5f5' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Mermaid Editor</h3>
        {error && (
          <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>
            Error: {error}
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          defaultLanguage="markdown"
          value={value}
          onChange={handleEditorChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
          }}
        />
      </div>
    </div>
  );
};
