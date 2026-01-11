/**
 * Core graph model - completely decoupled from Mermaid implementation
 * This is the canonical data structure that all layers operate on
 */

export interface GraphNode {
  id: string;
  label: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'rounded' | 'stadium';
  position?: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  style?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
  isDragged?: boolean; // Flag to skip auto-layout for manually positioned nodes
}

export interface GraphEdge {
  id: string;
  from: string; // Source node ID
  to: string; // Target node ID
  label?: string;
  type?: 'arrow' | 'dashed' | 'dotted';
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
  points?: Array<{ x: number; y: number }>; // Layout engine can provide routing points
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface LayoutResult {
  graph: Graph;
  bounds: {
    width: number;
    height: number;
  };
}

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
}

export interface ParseResult {
  graph?: Graph;
  error?: ParseError;
}

/**
 * Viewport state for interactive features
 */
export interface ViewportState {
  scale: number;
  translateX: number;
  translateY: number;
}

/**
 * Export options
 */
export interface ExportOptions {
  format: 'svg' | 'png';
  width?: number;
  height?: number;
  backgroundColor?: string;
}
