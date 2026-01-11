import React, { useRef, useEffect, useState } from 'react';
import { Graph, GraphNode, GraphEdge, ViewportState } from '../types';

interface SVGRendererProps {
  graph: Graph;
  viewport: ViewportState;
  onViewportChange: (viewport: ViewportState) => void;
  onNodeDrag?: (nodeId: string, position: { x: number; y: number }) => void;
}

/**
 * SVG-based renderer - renders the normalized graph model
 * Handles pan, zoom, and drag interactions
 */
export const SVGRenderer: React.FC<SVGRendererProps> = ({
  graph,
  viewport,
  onViewportChange,
  onNodeDrag
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewportStart, setViewportStart] = useState({ x: 0, y: 0 });

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(viewport.scale * scaleFactor, 0.1), 5);
    
    onViewportChange({
      ...viewport,
      scale: newScale
    });
  };

  // Handle pan start
  const handlePanStart = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === 'g') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setViewportStart({ x: viewport.translateX, y: viewport.translateY });
    }
  };

  // Handle pan move
  const handlePanMove = (e: React.MouseEvent) => {
    if (isDragging && !draggedNode) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      onViewportChange({
        ...viewport,
        translateX: viewportStart.x + dx,
        translateY: viewportStart.y + dy
      });
    }
  };

  // Handle pan end
  const handlePanEnd = () => {
    setIsDragging(false);
  };

  // Handle node drag start
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    const node = graph.nodes.find(n => n.id === nodeId);
    if (node?.position) {
      setViewportStart({ x: node.position.x, y: node.position.y });
    }
  };

  // Handle node drag
  const handleNodeDrag = (e: React.MouseEvent) => {
    if (draggedNode && onNodeDrag) {
      const dx = (e.clientX - dragStart.x) / viewport.scale;
      const dy = (e.clientY - dragStart.y) / viewport.scale;
      
      const newX = viewportStart.x + dx;
      const newY = viewportStart.y + dy;
      
      onNodeDrag(draggedNode, { x: newX, y: newY });
    }
  };

  // Handle node drag end
  const handleNodeDragEnd = () => {
    setDraggedNode(null);
  };

  // Render node based on shape
  const renderNode = (node: GraphNode) => {
    const { id, label, shape, position, size } = node;
    const x = position?.x || 0;
    const y = position?.y || 0;
    const width = size?.width || 120;
    const height = size?.height || 60;

    const commonProps = {
      fill: node.style?.fill || '#e1f5fe',
      stroke: node.style?.stroke || '#01579b',
      strokeWidth: node.style?.strokeWidth || 2,
      cursor: draggedNode === id ? 'grabbing' : 'grab',
      onMouseDown: (e: React.MouseEvent) => handleNodeDragStart(id, e)
    };

    switch (shape) {
      case 'circle':
        return (
          <g key={id}>
            <circle
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
              fill="#333"
              pointerEvents="none"
            >
              {label}
            </text>
          </g>
        );
      
      case 'diamond':
        return (
          <g key={id}>
            <path
              d={`M ${x} ${y - height/2} L ${x + width/2} ${y} L ${x} ${y + height/2} L ${x - width/2} ${y} Z`}
              {...commonProps}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fill="#333"
              pointerEvents="none"
            >
              {label}
            </text>
          </g>
        );
      
      default:
        return (
          <g key={id}>
            <rect
              x={x - width/2}
              y={y - height/2}
              width={width}
              height={height}
              rx={shape === 'rounded' ? 8 : 0}
              {...commonProps}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fill="#333"
              pointerEvents="none"
            >
              {label}
            </text>
          </g>
        );
    }
  };

  // Render edge
  const renderEdge = (edge: GraphEdge) => {
    const fromNode = graph.nodes.find(n => n.id === edge.from);
    const toNode = graph.nodes.find(n => n.id === edge.to);
    
    if (!fromNode?.position || !toNode?.position) return null;

    const fromX = fromNode.position.x;
    const fromY = fromNode.position.y;
    const toX = toNode.position.x;
    const toY = toNode.position.y;

    const stroke = edge.style?.stroke || '#666';
    const strokeWidth = edge.style?.strokeWidth || 2;
    const strokeDasharray = edge.type === 'dashed' ? '5,5' : undefined;

    return (
      <g key={edge.id}>
        <defs>
          <marker
            id={`arrowhead-${edge.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3, 0 6"
              fill={stroke}
            />
          </marker>
        </defs>
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          markerEnd={`url(#arrowhead-${edge.id})`}
        />
        {edge.label && (
          <text
            x={(fromX + toX) / 2}
            y={(fromY + toY) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fill="#333"
            background="white"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="svg-renderer" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <svg
        ref={svgRef}
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
          {/* Render edges first (behind nodes) */}
          {graph.edges.map(renderEdge)}
          
          {/* Render nodes */}
          {graph.nodes.map(renderNode)}
        </g>
      </svg>
    </div>
  );
};
