import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Graph, ViewportState } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface MinimapProps {
  graph: Graph;
  viewport: ViewportState;
  onViewportChange: (viewport: ViewportState) => void;
  bounds: { width: number; height: number };
}

/**
 * Minimap component for navigation
 */
export const Minimap: React.FC<MinimapProps> = ({
  graph,
  viewport,
  onViewportChange,
  bounds
}) => {
  const { isDark } = useTheme();
  const minimapRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const minimapSize = { width: 200, height: 150 };
  const scale = Math.min(
    minimapSize.width / bounds.width,
    minimapSize.height / bounds.height
  );

  const viewportRect = {
    x: (-viewport.translateX / viewport.scale) * scale,
    y: (-viewport.translateY / viewport.scale) * scale,
    width: (window.innerWidth / viewport.scale) * scale,
    height: (window.innerHeight / viewport.scale) * scale
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && minimapRef.current) {
      const rect = minimapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newTranslateX = -(x / scale) * viewport.scale;
      const newTranslateY = -(y / scale) * viewport.scale;

      onViewportChange({
        ...viewport,
        translateX: newTranslateX,
        translateY: newTranslateY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass rounded-xl shadow-large border border-white/20 dark:border-gray-700/30 p-2">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 px-1">
          Overview
        </div>
        
        <svg
          ref={minimapRef}
          width={minimapSize.width}
          height={minimapSize.height}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <g transform={`scale(${scale})`}>
            {/* Render nodes */}
            {graph.nodes.map(node => {
              const x = node.position?.x || 0;
              const y = node.position?.y || 0;
              const width = node.size?.width || 120;
              const height = node.size?.height || 60;

              return (
                <rect
                  key={node.id}
                  x={x - width/2}
                  y={y - height/2}
                  width={width}
                  height={height}
                  rx={4}
                  fill={isDark ? '#4f46e5' : '#3b82f6'}
                  opacity={0.6}
                />
              );
            })}

            {/* Render edges */}
            {graph.edges.map(edge => {
              const fromNode = graph.nodes.find(n => n.id === edge.from);
              const toNode = graph.nodes.find(n => n.id === edge.to);
              
              if (!fromNode?.position || !toNode?.position) return null;

              return (
                <line
                  key={edge.id}
                  x1={fromNode.position.x}
                  y1={fromNode.position.y}
                  x2={toNode.position.x}
                  y2={toNode.position.y}
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  strokeWidth={1}
                  opacity={0.4}
                />
              );
            })}
          </g>

          {/* Viewport indicator */}
          <rect
            x={viewportRect.x}
            y={viewportRect.y}
            width={viewportRect.width}
            height={viewportRect.height}
            fill="none"
            stroke={isDark ? '#60a5fa' : '#3b82f6'}
            strokeWidth={2}
            strokeDasharray="4,2"
            className="pointer-events-none"
          />
        </svg>
      </div>
    </motion.div>
  );
};
