import React, { useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Graph, GraphNode, GraphEdge, ViewportState } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface EnhancedSVGRendererProps {
  graph: Graph;
  viewport: ViewportState;
  onViewportChange: (viewport: ViewportState) => void;
  onNodeDrag?: (nodeId: string, position: { x: number; y: number }) => void;
  selectedNode?: string;
  onNodeSelect?: (nodeId: string | undefined) => void;
  svgRef?: React.RefObject<SVGSVGElement>;
}

/**
 * Enhanced SVG renderer with modern styling and animations
 */
export const EnhancedSVGRenderer: React.FC<EnhancedSVGRendererProps> = ({
  graph,
  viewport,
  onViewportChange,
  onNodeDrag,
  selectedNode,
  onNodeSelect,
  svgRef
}) => {
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewportStart, setViewportStart] = useState({ x: 0, y: 0 });
  const { isDark } = useTheme();

  // Use the passed ref if available, otherwise use internal ref
  const svgRefToUse = svgRef as React.RefObject<SVGSVGElement> || internalSvgRef;

  // Determine node type based on label and shape
  const getNodeType = useCallback((node: GraphNode): 'start' | 'process' | 'decision' | 'error' => {
    const label = node.label.toLowerCase();
    if (label.includes('start') || label.includes('begin') || label.includes('end')) return 'start';
    if (node.shape === 'diamond') return 'decision';
    if (label.includes('error') || label.includes('fail')) return 'error';
    return 'process';
  }, []);

  // Get node gradient based on type and theme
  const getNodeGradient = useCallback((nodeType: string) => {
    if (isDark) {
      switch (nodeType) {
        case 'start': return 'url(#gradient-start-dark)';
        case 'process': return 'url(#gradient-process-dark)';
        case 'decision': return 'url(#gradient-decision-dark)';
        case 'error': return 'url(#gradient-error-dark)';
        default: return 'url(#gradient-process-dark)';
      }
    } else {
      switch (nodeType) {
        case 'start': return 'url(#gradient-start-light)';
        case 'process': return 'url(#gradient-process-light)';
        case 'decision': return 'url(#gradient-decision-light)';
        case 'error': return 'url(#gradient-error-light)';
        default: return 'url(#gradient-process-light)';
      }
    }
  }, [isDark]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(viewport.scale * scaleFactor, 0.1), 5);
    
    onViewportChange({
      ...viewport,
      scale: newScale
    });
  }, [viewport, onViewportChange]);

  // Handle pan start
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRefToUse.current || (e.target as Element).tagName === 'g') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setViewportStart({ x: viewport.translateX, y: viewport.translateY });
    }
  }, [viewport]);

  // Handle pan move
  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && !draggedNode) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      onViewportChange({
        ...viewport,
        translateX: viewportStart.x + dx,
        translateY: viewportStart.y + dy
      });
    }
  }, [isDragging, draggedNode, dragStart, viewportStart, viewport, onViewportChange]);

  // Handle pan end
  const handlePanEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle node drag start
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    const node = graph.nodes.find(n => n.id === nodeId);
    if (node?.position) {
      setViewportStart({ x: node.position.x, y: node.position.y });
    }
    
    onNodeSelect?.(nodeId);
  }, [graph.nodes, onNodeSelect]);

  // Handle node drag
  const handleNodeDrag = useCallback((e: React.MouseEvent) => {
    if (draggedNode && onNodeDrag) {
      const dx = (e.clientX - dragStart.x) / viewport.scale;
      const dy = (e.clientY - dragStart.y) / viewport.scale;
      
      const newX = viewportStart.x + dx;
      const newY = viewportStart.y + dy;
      
      onNodeDrag(draggedNode, { x: newX, y: newY });
    }
  }, [draggedNode, dragStart, viewportStart, viewport.scale, onNodeDrag]);

  // Handle node drag end
  const handleNodeDragEnd = useCallback(() => {
    setDraggedNode(null);
  }, []);

  // Render enhanced node
  const renderNode = useCallback((node: GraphNode) => {
    const { id, label, shape, position, size } = node;
    const x = position?.x || 0;
    const y = position?.y || 0;
    const width = size?.width || 120;
    const height = size?.height || 60;
    const nodeType = getNodeType(node);
    const gradient = getNodeGradient(nodeType);
    const isSelected = selectedNode === id;

    const nodeVariants = {
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      hover: { scale: 1.02 },
      tap: { scale: 0.98 }
    };

    const commonProps = {
      fill: gradient,
      stroke: isSelected ? '#3b82f6' : isDark ? '#475569' : '#e2e8f0',
      strokeWidth: isSelected ? 3 : 2,
      cursor: draggedNode === id ? 'grabbing' : 'grab',
      filter: isSelected ? 'url(#glow)' : undefined,
      onMouseDown: (e: React.MouseEvent) => handleNodeDragStart(id, e),
      style: { transition: 'all 0.2s ease' }
    };

    return (
      <motion.g
        key={id}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        variants={nodeVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {shape === 'circle' ? (
          <>
            <motion.circle
              cx={x}
              cy={y}
              r={Math.min(width, height) / 2}
              {...commonProps}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fontWeight="600"
              fill={isDark ? '#f1f5f9' : '#1e293b'}
              pointerEvents="none"
              className="select-none"
            >
              {label}
            </text>
          </>
        ) : shape === 'diamond' ? (
          <>
            <motion.path
              d={`M ${x} ${y - height/2} L ${x + width/2} ${y} L ${x} ${y + height/2} L ${x - width/2} ${y} Z`}
              {...commonProps}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fontWeight="600"
              fill={isDark ? '#f1f5f9' : '#1e293b'}
              pointerEvents="none"
              className="select-none"
            >
              {label}
            </text>
          </>
        ) : (
          <>
            <motion.rect
              x={x - width/2}
              y={y - height/2}
              width={width}
              height={height}
              rx={12}
              {...commonProps}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fontWeight="600"
              fill={isDark ? '#f1f5f9' : '#1e293b'}
              pointerEvents="none"
              className="select-none"
            >
              {label}
            </text>
          </>
        )}
      </motion.g>
    );
  }, [graph.nodes, selectedNode, isDark, draggedNode, getNodeType, getNodeGradient, handleNodeDragStart]);

  // Render enhanced edge
  const renderEdge = useCallback((edge: GraphEdge) => {
    const fromNode = graph.nodes.find(n => n.id === edge.from);
    const toNode = graph.nodes.find(n => n.id === edge.to);
    
    if (!fromNode?.position || !toNode?.position) return null;

    const fromX = fromNode.position.x;
    const fromY = fromNode.position.y;
    const toX = toNode.position.x;
    const toY = toNode.position.y;

    const stroke = isDark ? '#64748b' : '#94a3b8';
    const strokeWidth = 2;

    return (
      <motion.g
        key={edge.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <defs>
          <marker
            id={`arrowhead-${edge.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0 0, 10 3, 0 6"
              fill={stroke}
            />
          </marker>
        </defs>
        <motion.line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={edge.type === 'dashed' ? '5,5' : undefined}
          markerEnd={`url(#arrowhead-${edge.id})`}
          className="edge-path"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        {edge.label && (
          <text
            x={(fromX + toX) / 2}
            y={(fromY + toY) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontWeight="500"
            fill={isDark ? '#94a3b8' : '#64748b'}
            className="select-none"
          >
            {edge.label}
          </text>
        )}
      </motion.g>
    );
  }, [graph.nodes, isDark]);

  // Memoize gradients
  const gradients = useMemo(() => (
    <defs>
      {/* Light theme gradients */}
      <linearGradient id="gradient-start-light" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="gradient-process-light" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="gradient-decision-light" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d946ef" />
      </linearGradient>
      <linearGradient id="gradient-error-light" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
      
      {/* Dark theme gradients */}
      <linearGradient id="gradient-start-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="gradient-process-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1d4ed8" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
      <linearGradient id="gradient-decision-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#a21caf" />
      </linearGradient>
      <linearGradient id="gradient-error-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
      
      {/* Filters */}
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  ), []);

  return (
    <div className="enhanced-svg-renderer w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900 grid-pattern">
      <svg
        ref={svgRefToUse}
        width="100%"
        height="100%"
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        onMouseMove={(e) => {
          handlePanMove(e);
          handleNodeDrag(e);
        }}
        onMouseUp={() => {
          handlePanEnd();
          handleNodeDragEnd();
        }}
        onMouseLeave={() => {
          handlePanEnd();
          handleNodeDragEnd();
        }}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <g transform={`translate(${viewport.translateX}, ${viewport.translateY}) scale(${viewport.scale})`}>
          {gradients}
          
          {/* Render edges first (behind nodes) */}
          <AnimatePresence>
            {graph.edges.map(renderEdge)}
          </AnimatePresence>
          
          {/* Render nodes */}
          <AnimatePresence>
            {graph.nodes.map(renderNode)}
          </AnimatePresence>
        </g>
      </svg>
    </div>
  );
};
