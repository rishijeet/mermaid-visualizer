import { GraphNode, GraphEdge, ParseResult } from '../types';

/**
 * Mermaid parser - converts Mermaid flowchart syntax to normalized graph model
 * This layer is completely decoupled from rendering and layout
 */

export class MermaidParser {
  /**
   * Parse Mermaid flowchart code into normalized graph
   */
  static parse(mermaidCode: string): ParseResult {
    try {
      // Basic validation
      if (!mermaidCode.trim()) {
        return { error: { message: 'Empty Mermaid code' } };
      }

      // Extract flowchart content (remove graph declaration)
      const cleanCode = this.cleanMermaidCode(mermaidCode);
      
      // Parse nodes and edges
      const { nodes, edges } = this.parseFlowchartContent(cleanCode);
      
      return { graph: { nodes, edges } };
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown parsing error' 
        } 
      };
    }
  }

  /**
   * Clean and normalize Mermaid code
   */
  private static cleanMermaidCode(code: string): string {
    return code
      .replace(/^(graph|flowchart)\s+(TB|TD|BT|RL|LR)\s*\n?/i, '') // Remove graph declaration
      .trim();
  }

  /**
   * Parse flowchart content into nodes and edges
   */
  private static parseFlowchartContent(code: string): { nodes: GraphNode[], edges: GraphEdge[] } {
    const nodes: Map<string, GraphNode> = new Map();
    const edges: GraphEdge[] = [];
    
    const lines = code.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('%%'));
    
    for (const line of lines) {
      // Parse node definitions: A[Node A]
      const nodeMatch = line.match(/^(\w+)(\[[^\]]+\]|\(\([^\)]+\)\)|\{[^}]+\})$/);
      if (nodeMatch) {
        const [, id, nodeDef] = nodeMatch;
        const node = this.parseNodeDefinition(id, nodeDef);
        nodes.set(id, node);
        continue;
      }

      // Parse edges with node definitions: A[Start] --> B{Decision}
      const edgeWithNodesMatch = line.match(/^(\w+)(\[[^\]]+\]|\(\([^\)]+\)\)|\{[^}]+\})\s*-->\s*(\w+)(\[[^\]]+\]|\(\([^\)]+\)\)|\{[^}]+\})(?:\|([^\|]+)\|)?/);
      if (edgeWithNodesMatch) {
        const [, fromId, fromNodeDef, toId, toNodeDef, label] = edgeWithNodesMatch;
        
        // Parse and create from node
        const fromNode = this.parseNodeDefinition(fromId, fromNodeDef);
        nodes.set(fromId, fromNode);
        
        // Parse and create to node
        const toNode = this.parseNodeDefinition(toId, toNodeDef);
        nodes.set(toId, toNode);
        
        edges.push({
          id: `${fromId}-${toId}`,
          from: fromId,
          to: toId,
          label: label?.trim(),
          type: 'arrow'
        });
        continue;
      }

      // Parse edges with labels and node definitions: B -->|Yes| C[Process A]
      const edgeWithLabelAndNodeMatch = line.match(/^(\w+)\s*-->\s*\|([^\|]+)\|\s*(\w+)(\[[^\]]+\]|\(\([^\)]+\)\)|\{[^}]+\})$/);
      if (edgeWithLabelAndNodeMatch) {
        const [, from, label, toId, toNodeDef] = edgeWithLabelAndNodeMatch;
        
        // Ensure from node exists
        if (!nodes.has(from)) {
          nodes.set(from, { id: from, label: from, shape: 'rectangle' });
        }
        
        // Parse and create to node
        const toNode = this.parseNodeDefinition(toId, toNodeDef);
        nodes.set(toId, toNode);
        
        edges.push({
          id: `${from}-${toId}`,
          from,
          to: toId,
          label: label.trim(),
          type: 'arrow'
        });
        continue;
      }

      // Parse edges with existing nodes: A --> B|Yes|
      const edgeWithLabelMatch = line.match(/^(\w+)\s*-->\s*(\w+)(?:\|([^\|]+)\|)?/);
      if (edgeWithLabelMatch) {
        const [, from, to, label] = edgeWithLabelMatch;
        
        // Ensure nodes exist (create default nodes if not defined)
        if (!nodes.has(from)) {
          nodes.set(from, { id: from, label: from, shape: 'rectangle' });
        }
        if (!nodes.has(to)) {
          nodes.set(to, { id: to, label: to, shape: 'rectangle' });
        }
        
        edges.push({
          id: `${from}-${to}`,
          from,
          to,
          label: label?.trim(),
          type: 'arrow'
        });
        continue;
      }

      // Parse dashed edges: A -.-> B
      const dashedEdgeMatch = line.match(/^(\w+)\s*-\.\->\s*(\w+)(?:\|([^\|]+)\|)?/);
      if (dashedEdgeMatch) {
        const [, from, to, label] = dashedEdgeMatch;
        
        if (!nodes.has(from)) {
          nodes.set(from, { id: from, label: from, shape: 'rectangle' });
        }
        if (!nodes.has(to)) {
          nodes.set(to, { id: to, label: to, shape: 'rectangle' });
        }
        
        edges.push({
          id: `${from}-${to}`,
          from,
          to,
          label: label?.trim(),
          type: 'dashed'
        });
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges
    };
  }

  /**
   * Parse node definition from id and node syntax
   */
  private static parseNodeDefinition(id: string, nodeDef: string): GraphNode {
    if (nodeDef.startsWith('[[') && nodeDef.endsWith(']]')) {
      // Markdown node: A[[Node A]]
      const label = nodeDef.slice(2, -2);
      return { id, label: label.trim(), shape: 'rectangle' };
    } else if (nodeDef.startsWith('[') && nodeDef.endsWith(']')) {
      // Rectangle node: A[Node A]
      const label = nodeDef.slice(1, -1);
      return { id, label: label.trim(), shape: 'rectangle' };
    } else if (nodeDef.startsWith('((') && nodeDef.endsWith('))')) {
      // Circle node: A((Node A))
      const label = nodeDef.slice(2, -2);
      return { id, label: label.trim(), shape: 'circle' };
    } else if (nodeDef.startsWith('{') && nodeDef.endsWith('}')) {
      // Diamond node: A{Node A}
      const label = nodeDef.slice(1, -1);
      return { id, label: label.trim(), shape: 'diamond' };
    } else {
      // Default to rectangle
      return { id, label: id, shape: 'rectangle' };
    }
  }
}
