import React from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface EnhancedMermaidEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * Enhanced Monaco Editor with modern styling and syntax highlighting
 */
export const EnhancedMermaidEditor: React.FC<EnhancedMermaidEditorProps> = ({
  value,
  onChange,
  error
}) => {
  const { isDark } = useTheme();

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="enhanced-mermaid-editor h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Mermaid Editor
            </h3>
          </div>
          
          {error ? (
            <motion.div 
              className="flex items-center space-x-2 text-red-500 dark:text-red-400"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Syntax Error</span>
            </motion.div>
          ) : (
            <motion.div 
              className="flex items-center space-x-2 text-green-500 dark:text-green-400"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Valid</span>
            </motion.div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {value.split('\n').length} lines
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Parsing Error
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <div className="flex-1 relative">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        <Editor
          height="100%"
          defaultLanguage="markdown"
          value={value}
          onChange={handleEditorChange}
          theme={isDark ? 'vs-dark' : 'vs-light'}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            padding: { top: 16, bottom: 16 },
            roundedSelection: false,
            cursorBlinking: 'smooth',
            bracketPairColorization: { enabled: true },
            guides: {
              indentation: false,
              bracketPairs: false,
            },
          }}
          beforeMount={(monaco) => {
            // Define custom theme for better Mermaid syntax highlighting
            monaco.editor.defineTheme('mermaid-light', {
              base: 'vs',
              inherit: true,
              rules: [
                { token: 'keyword', foreground: '3b82f6', fontStyle: 'bold' },
                { token: 'string', foreground: '10b981' },
                { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
                { token: 'type', foreground: '8b5cf6', fontStyle: 'bold' },
              ],
              colors: {
                'editor.background': '#ffffff',
                'editor.foreground': '#1f2937',
                'editor.lineHighlightBackground': '#f3f4f6',
                'editor.selectionBackground': '#dbeafe',
                'editorCursor.foreground': '#3b82f6',
              }
            });

            monaco.editor.defineTheme('mermaid-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: 'keyword', foreground: '#60a5fa', fontStyle: 'bold' },
                { token: 'string', foreground: '#34d399' },
                { token: 'comment', foreground: '#6b7280', fontStyle: 'italic' },
                { token: 'type', foreground: '#a78bfa', fontStyle: 'bold' },
              ],
              colors: {
                'editor.background': '#111827',
                'editor.foreground': '#f9fafb',
                'editor.lineHighlightBackground': '#1f2937',
                'editor.selectionBackground': '#1e3a8a',
                'editorCursor.foreground': '#60a5fa',
              }
            });
          }}
          onMount={(editor) => {
            // Apply custom theme after mount
            editor.updateOptions({
              theme: isDark ? 'mermaid-dark' : 'mermaid-light'
            });
          }}
        />
      </div>
    </div>
  );
};
