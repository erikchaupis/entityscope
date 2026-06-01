import ELK from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from '@xyflow/react';

const elk = new ELK();

const NODE_WIDTH = 220;
const NODE_HEIGHT_COMPACT = 90;
const MAX_VISIBLE_PROPERTIES = 10;

export function computeNodeHeight(propertyCount: number, showProperties: boolean): number {
  if (!showProperties) {
    return NODE_HEIGHT_COMPACT;
  }

  const visibleCount = Math.min(propertyCount, MAX_VISIBLE_PROPERTIES);
  const overflowRow = propertyCount > MAX_VISIBLE_PROPERTIES ? 14 : 0;
  const emptyRow = propertyCount === 0 ? 16 : 0;

  // header + table + property rows + relation footer + padding
  return 40 + 20 + 8 + visibleCount * 17 + overflowRow + emptyRow + 22 + 12;
}

export async function layoutGraph(
  nodes: Node[],
  edges: Edge[],
  showProperties: boolean
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  if (nodes.length === 0) {
    return { nodes, edges };
  }

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '72',
      'elk.layered.spacing.nodeNodeBetweenLayers': '96',
      'elk.layered.spacing.edgeNodeBetweenLayers': '48',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    },
    children: nodes.map((node) => {
      const entity = node.data?.entity as { properties?: unknown[] } | undefined;
      const propertyCount = entity?.properties?.length ?? 0;
      return {
        id: node.id,
        width: NODE_WIDTH,
        height: computeNodeHeight(propertyCount, showProperties),
      };
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layouted = await elk.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const layoutNode = layouted.children?.find((n) => n.id === node.id);
    const entity = node.data?.entity as { properties?: unknown[] } | undefined;
    const propertyCount = entity?.properties?.length ?? 0;
    const height = computeNodeHeight(propertyCount, showProperties);
    return {
      ...node,
      position: {
        x: layoutNode?.x ?? 0,
        y: layoutNode?.y ?? 0,
      },
      style: { width: NODE_WIDTH, height },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export { NODE_WIDTH, NODE_HEIGHT_COMPACT as NODE_HEIGHT, MAX_VISIBLE_PROPERTIES };
