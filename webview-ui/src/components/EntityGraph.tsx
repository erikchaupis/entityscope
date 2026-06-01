import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { layoutGraph } from '@/lib/elkLayout';
import { assignRelationshipHandles } from '@/lib/handleDistribution';
import { buildPackageColorMap, getEntityPackageKey, getPackageColorForEntity } from '@/lib/packageColors';
import { EntityNode } from '@/components/EntityNode';
import { RelationEdge } from '@/components/RelationEdge';
import { RelationLegendHover } from '@/components/RelationLegend';
import { FIT_VIEW_OPTIONS } from '@/lib/fitViewOptions';
import type { EntityActionHandlers, EntityGraphActionsInput } from '@/lib/entityActions';
import type { EntityJson, RelationJson } from '@/types';

function fitGraphView(fitView: ReturnType<typeof useReactFlow>['fitView']) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void fitView(FIT_VIEW_OPTIONS);
    });
  });
}

const nodeTypes = { entity: EntityNode };
const edgeTypes = { relation: RelationEdge };

interface EntityGraphInnerProps {
  entities: EntityJson[];
  relations: RelationJson[];
  selectedEntity: string | null;
  searchQuery: string;
  packageFilter: string | null;
  showProperties: boolean;
  onSelectEntity: (name: string) => void;
  entityActions: EntityGraphActionsInput;
}

function EntityGraphInner({
  entities,
  relations,
  selectedEntity,
  searchQuery,
  packageFilter,
  showProperties,
  onSelectEntity,
  entityActions,
}: EntityGraphInnerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const { fitView } = useReactFlow();

  const centerOnEntity = useCallback(
    (entityName: string) => {
      void fitView({
        nodes: [{ id: entityName }],
        padding: 0.35,
        duration: 300,
        maxZoom: 1.25,
        minZoom: 0.65,
      });
    },
    [fitView]
  );

  const nodeActions = useMemo<EntityActionHandlers>(
    () => ({
      ...entityActions,
      onCenter: centerOnEntity,
    }),
    [entityActions, centerOnEntity]
  );

  const visibleEntityNames = useMemo(() => {
    let filtered = entities;

    if (packageFilter) {
      filtered = filtered.filter((e) => {
        const pkg = e.package.split('.').pop() || e.package;
        return pkg === packageFilter;
      });
    }

    return new Set(filtered.map((e) => e.name));
  }, [entities, packageFilter]);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) {
      return null;
    }
    const q = searchQuery.toLowerCase();
    return new Set(
      entities
        .filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.table.toLowerCase().includes(q)
        )
        .map((e) => e.name)
    );
  }, [entities, searchQuery]);

  const { entityHandles, edgeHandles } = useMemo(
    () => assignRelationshipHandles(relations, visibleEntityNames),
    [relations, visibleEntityNames]
  );

  const packageColorMap = useMemo(() => buildPackageColorMap(entities), [entities]);

  useEffect(() => {
    const relationCounts = new Map<string, number>();
    for (const rel of relations) {
      if (!visibleEntityNames.has(rel.source) || !visibleEntityNames.has(rel.target)) {
        continue;
      }
      relationCounts.set(rel.source, (relationCounts.get(rel.source) ?? 0) + 1);
      relationCounts.set(rel.target, (relationCounts.get(rel.target) ?? 0) + 1);
    }

    const visibleEntities = entities.filter((e) => visibleEntityNames.has(e.name));

    const initialNodes: Node[] = visibleEntities.map((entity) => {
      const isHighlighted = searchMatches ? searchMatches.has(entity.name) : false;
      const isSelected = selectedEntity === entity.name;
      const isDimmed = searchMatches !== null && !searchMatches.has(entity.name);
      const handles = entityHandles.get(entity.name) ?? {
        sourceHandles: [],
        targetHandles: [],
      };
      const packageLabel = getEntityPackageKey(entity);
      const packageColor = getPackageColorForEntity(entity, packageColorMap);

      return {
        id: entity.name,
        type: 'entity',
        position: { x: 0, y: 0 },
        data: {
          entity,
          relationCount: relationCounts.get(entity.name) ?? 0,
          highlighted: isHighlighted || isSelected,
          selected: isSelected,
          dimmed: isDimmed,
          showProperties,
          packageColor,
          packageLabel,
          sourceHandles: handles.sourceHandles,
          targetHandles: handles.targetHandles,
          actions: nodeActions,
          onSelect: onSelectEntity,
        },
      };
    });

    const initialEdges: Edge[] = relations
      .filter((r) => visibleEntityNames.has(r.source) && visibleEntityNames.has(r.target))
      .map((rel) => {
        const id = `${rel.source}-${rel.fieldName}-${rel.target}`;
        const handles = edgeHandles.get(id);
        return {
          id,
          type: 'relation',
          source: rel.source,
          target: rel.target,
          sourceHandle: handles?.sourceHandle ?? 'default',
          targetHandle: handles?.targetHandle ?? 'default',
          data: { relation: rel },
          style: {
            opacity:
              searchMatches && !searchMatches.has(rel.source) && !searchMatches.has(rel.target)
                ? 0.2
                : 1,
          },
        };
      });

    setLayoutReady(false);
    layoutGraph(initialNodes, initialEdges, showProperties).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setLayoutReady(true);
      fitGraphView(fitView);
    });
  }, [
    entities,
    relations,
    visibleEntityNames,
    searchMatches,
    selectedEntity,
    showProperties,
    entityHandles,
    edgeHandles,
    packageColorMap,
    onSelectEntity,
    nodeActions,
    setNodes,
    setEdges,
    fitView,
  ]);

  if (entities.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>No JPA entities found in this project</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      {!layoutReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <p className="text-sm text-muted-foreground">Laying out graph...</p>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.25}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="var(--ev-grid)" />
        <Controls showInteractive={false} fitViewOptions={FIT_VIEW_OPTIONS} />
        <Panel position="top-right" className="!m-3 !pointer-events-auto">
          <RelationLegendHover />
        </Panel>
        <Panel position="bottom-right" className="ev-minimap-panel !m-3 !pointer-events-auto">
          <MiniMap
            pannable
            zoomable
            nodeColor={() => 'var(--ev-entity)'}
            maskColor="var(--ev-background)"
            className="ev-minimap"
            style={{ width: 180, height: 120 }}
          />
        </Panel>
      </ReactFlow>
    </div>
  );
}

interface EntityGraphProps {
  entities: EntityJson[];
  relations: RelationJson[];
  selectedEntity: string | null;
  searchQuery: string;
  packageFilter: string | null;
  showProperties: boolean;
  onSelectEntity: (name: string) => void;
  entityActions: EntityGraphActionsInput;
}

export const EntityGraph = memo(function EntityGraph(props: EntityGraphProps) {
  return (
    <ReactFlowProvider>
      <EntityGraphInner {...props} />
    </ReactFlowProvider>
  );
});
