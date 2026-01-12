import ELK from 'elkjs/lib/elk.bundled.js';
import { Graph, GraphNode, GraphEdge, LayoutResult } from '../types';

/**
 * ELK layout engine - positions nodes and routes edges
 * Operates only on the normalized graph model
 */

const elk = new ELK();

export class ELKLayoutEngine {
  /**
   * Layout the graph using ELK algorithm
   */
  static async layout(graph: Graph): Promise<LayoutResult> {
    // Handle empty graph
    if (graph.nodes.length === 0) {
      return {
        graph: { nodes: [], edges: [] },
        bounds: { width: 800, height: 600 }
      };
    }

    // Store original graph data for preservation
    const originalNodes = new Map(graph.nodes.map(node => [node.id, node]));

    // Convert our graph model to ELK graph format
    const elkGraph = this.convertToELKGraph(graph);
    
    try {
      // Apply ELK layout
      const layoutedGraph = await elk.layout(elkGraph);
      
      // Convert back to our normalized graph model
      const result = this.convertFromELKGraph(layoutedGraph, originalNodes);
      
      return {
        graph: result,
        bounds: {
          width: layoutedGraph.width || 800,
          height: layoutedGraph.height || 600
        }
      };
    } catch (error) {
      console.warn('ELK layout failed, using fallback:', error);
      // Fallback to simple grid layout
      return this.fallbackLayout(graph);
    }
  }

  /**
   * Convert our graph model to ELK graph format
   */
  private static convertToELKGraph(graph: Graph): any {
    return {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.layered.spacing.nodeNodeBetweenLayers': '100',
        'elk.layered.spacing.nodeNode': '80',
        'elk.direction': 'DOWN',
        'elk.padding': '[top=50,left=50,bottom=50,right=50]',
        'elk.layered.thoroughness': '7',
        'elk.layered.unnecessaryBendpoints': 'false'
      },
      children: graph.nodes.map(node => ({
        id: node.id,
        label: node.label,
        width: node.size?.width || this.getDefaultNodeSize(node.shape).width,
        height: node.size?.height || this.getDefaultNodeSize(node.shape).height,
        // Preserve manually positioned nodes
        x: node.isDragged && node.position ? node.position.x : undefined,
        y: node.isDragged && node.position ? node.position.y : undefined,
        layoutOptions: node.isDragged ? {
          'elk.position': 'fixed'
        } : undefined,
        // Store shape information for later retrieval
        shape: node.shape
      })),
      edges: graph.edges.map(edge => ({
        id: edge.id,
        sources: [edge.from],
        targets: [edge.to],
        labels: edge.label ? [{
          text: edge.label,
          layoutOptions: {
            'elk.edge.labels.placement': 'CENTER'
          }
        }] : []
      }))
    };
  }

  /**
   * Convert ELK result back to our graph model
   */
  private static convertFromELKGraph(elkGraph: any, originalNodes: Map<string, GraphNode>): Graph {
    const nodes: GraphNode[] = elkGraph.children?.map((child: any) => {
      // Get original node to preserve shape and other properties
      const originalNode = originalNodes.get(child.id);
      
      return {
        id: child.id,
        label: child.label || child.id,
        shape: child.shape || originalNode?.shape || 'rectangle',
        position: {
          x: child.x || 0,
          y: child.y || 0
        },
        size: {
          width: child.width || 120,
          height: child.height || 60
        },
        isDragged: originalNode?.isDragged || false
      };
    }) || [];

    const edges: GraphEdge[] = elkGraph.edges?.map((edge: any) => ({
      id: edge.id,
      from: edge.sources[0],
      to: edge.targets[0],
      label: edge.labels?.[0]?.text,
      points: edge.sections?.[0]?.bendPoints || []
    })) || [];

    return { nodes, edges };
  }

  /**
   * Fallback simple grid layout when ELK fails
   */
  private static fallbackLayout(graph: Graph): LayoutResult {
    const nodeWidth = 120;
    const nodeHeight = 60;
    const horizontalSpacing = 150;
    const verticalSpacing = 100;
    const nodesPerRow = 4;

    const nodes = graph.nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % nodesPerRow) * horizontalSpacing + 50,
        y: Math.floor(index / nodesPerRow) * verticalSpacing + 50
      },
      size: {
        width: nodeWidth,
        height: nodeHeight
      }
    }));

    const maxRow = Math.ceil(graph.nodes.length / nodesPerRow);
    const bounds = {
      width: nodesPerRow * horizontalSpacing + 100,
      height: maxRow * verticalSpacing + 100
    };

    return { graph: { nodes, edges: graph.edges }, bounds };
  }

  /**
   * Get default node size based on shape
   */
  private static getDefaultNodeSize(shape: GraphNode['shape']): { width: number; height: number } {
    switch (shape) {
      case 'circle':
        return { width: 80, height: 80 };
      case 'diamond':
        return { width: 100, height: 80 };
      default:
        return { width: 120, height: 60 };
    }
  }
}
