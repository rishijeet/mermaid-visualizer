import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedMermaidEditor } from './components/EnhancedMermaidEditor';
import { EnhancedSVGRenderer } from './components/EnhancedSVGRenderer';
import { FloatingToolbar } from './components/FloatingToolbar';
import { Minimap } from './components/Minimap';
import { MermaidParser } from './parsers/mermaid';
import { ELKLayoutEngine } from './layout/elk';
import { useDebounce } from './hooks/useDebounce';
import { Graph, ViewportState, ParseResult } from './types';
import { ThemeProvider } from './contexts/ThemeContext';

/**
 * Main application component - orchestrates the entire pipeline
 */
const AppContent: React.FC = () => {
  // State management
  const [mermaidCode, setMermaidCode] = useState<string>(
    `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`
  );
  
  const [parseResult, setParseResult] = useState<ParseResult>({ graph: { nodes: [], edges: [] } });
  const [layoutedGraph, setLayoutedGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [viewport, setViewport] = useState<ViewportState>({
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  const [selectedNode, setSelectedNode] = useState<string | undefined>();
  const [showMinimap, setShowMinimap] = useState(true);
  const [layoutBounds, setLayoutBounds] = useState({ width: 800, height: 600 });
  const [svgElementAvailable, setSvgElementAvailable] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Debounce Mermaid code changes to avoid excessive re-parsing
  const debouncedCode = useDebounce(mermaidCode, 300);

  // Parse Mermaid code when debounced code changes
  React.useEffect(() => {
    const result = MermaidParser.parse(debouncedCode);
    setParseResult(result);
    
    if (result.graph) {
      // Apply layout to parsed graph
      ELKLayoutEngine.layout(result.graph).then(layoutResult => {
        setLayoutedGraph(layoutResult.graph);
        setLayoutBounds(layoutResult.bounds);
      });
    }
  }, [debouncedCode]);

  // Check if SVG element is available
  React.useEffect(() => {
    const element = svgRef.current;
    setSvgElementAvailable(!!element);
  }, [svgRef.current]);
    
  // Export functionality
  const exportSVG = useCallback(() => {
    try {
      // Use the ref to access the SVG element directly
      const svgElement = svgRef.current;
      
      if (!svgElement) {
        console.warn('SVG element not found for export');
        return;
      }
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.svg';
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('SVG export failed:', error);
    }
  }, []);

  const exportPNG = useCallback(() => {
    try {
      // Use the ref to access the SVG element directly
      const svgElement = svgRef.current;
      if (!svgElement) {
        console.warn('SVG element not found for PNG export');
        return;
      }
      
      // Get the actual SVG dimensions
      const svgRect = svgElement.getBoundingClientRect();
      const svgWidth = svgRect.width;
      const svgHeight = svgRect.height;
      
      // Create a high-resolution canvas (2x scale for better quality)
      const scale = 2;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return;
      }
      
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      
      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Scale the context for high DPI
      ctx.scale(scale, scale);
      
      // Serialize SVG and create image
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      
      img.onload = () => {
        // Draw the image on canvas
        ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
        
        // Clean up SVG URL
        URL.revokeObjectURL(svgUrl);
        
        // Convert canvas to PNG
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'diagram.png';
            a.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png', 0.9); // Quality: 0.9
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
      };
      
      img.src = svgUrl;
      
    } catch (error) {
      console.error('PNG export failed:', error);
    }
  }, []);

  // Handle viewport changes
  const handleViewportChange = useCallback((newViewport: ViewportState) => {
    setViewport(newViewport);
  }, []);

  // Handle node dragging
  const handleNodeDrag = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setLayoutedGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId 
          ? { ...node, position, isDragged: true }
          : node
      )
    }));
  }, []);

  // Fit to screen
  const fitToScreen = useCallback(() => {
    const padding = 50;
    const scaleX = (window.innerWidth - padding) / layoutBounds.width;
    const scaleY = (window.innerHeight - padding - 100) / layoutBounds.height; // Account for toolbar
    const newScale = Math.min(scaleX, scaleY, 2);
    
    setViewport({
      scale: newScale,
      translateX: (window.innerWidth - layoutBounds.width * newScale) / 2,
      translateY: (window.innerHeight - layoutBounds.height * newScale) / 2
    });
  }, [layoutBounds]);

  // Auto layout
  const autoLayout = useCallback(() => {
    if (layoutedGraph.nodes.length > 0) {
      ELKLayoutEngine.layout(layoutedGraph).then(layoutResult => {
        setLayoutedGraph(layoutResult.graph);
        setLayoutBounds(layoutResult.bounds);
      });
    }
  }, [layoutedGraph]);

  return (
    <div className="app-container">
      {/* Floating Toolbar */}
      <FloatingToolbar
        onExportSVG={exportSVG}
        onExportPNG={exportPNG}
        onFitToScreen={fitToScreen}
        onAutoLayout={autoLayout}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        showMinimap={showMinimap}
      />

      {/* Main Content */}
      <div className="flex h-full">
        {/* Editor Panel */}
        <motion.div 
          className="w-2/5 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <EnhancedMermaidEditor
            value={mermaidCode}
            onChange={setMermaidCode}
            error={parseResult.error?.message}
          />
          {svgElementAvailable && (
            <div className="absolute top-2 right-2 bg-green-500 dark:bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              SVG Ready
            </div>
          )}
        </motion.div>

        {/* Renderer Panel */}
        <motion.div 
          className="flex-1 relative bg-gray-50 dark:bg-gray-900 grid-pattern"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {layoutedGraph.nodes.length > 0 ? (
              <motion.div
                key="renderer"
                className="w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EnhancedSVGRenderer
                  graph={layoutedGraph}
                  viewport={viewport}
                  onViewportChange={handleViewportChange}
                  onNodeDrag={handleNodeDrag}
                  selectedNode={selectedNode}
                  onNodeSelect={setSelectedNode}
                  svgRef={svgRef}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="w-full h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 01-2 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {parseResult.error ? 'Invalid Mermaid Syntax' : 'Start Creating Your Diagram'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                    {parseResult.error 
                      ? 'Please check your Mermaid syntax and try again.'
                      : 'Enter Mermaid code in editor to visualize your flowchart.'
                    }
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Minimap */}
          <AnimatePresence>
            {showMinimap && layoutedGraph.nodes.length > 0 && (
              <Minimap
                graph={layoutedGraph}
                viewport={viewport}
                onViewportChange={handleViewportChange}
                bounds={layoutBounds}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
