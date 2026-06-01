import type { RelationJson } from '@/types';

export interface HandleSlot {
  id: string;
  leftPercent: number;
}

export interface EntityHandleLayout {
  sourceHandles: HandleSlot[];
  targetHandles: HandleSlot[];
}

export interface EdgeHandleAssignment {
  sourceHandle: string;
  targetHandle: string;
}

function edgeId(rel: RelationJson): string {
  return `${rel.source}-${rel.fieldName}-${rel.target}`;
}

/** Spread handles between 18% and 82% of the border width. */
export function handleLeftPercent(index: number, total: number): number {
  if (total <= 1) {
    return 50;
  }
  const min = 18;
  const max = 82;
  return min + ((max - min) * index) / (total - 1);
}

/**
 * Assign distributed source/target handles for each edge and per-entity handle slots.
 */
export function assignRelationshipHandles(
  relations: RelationJson[],
  visibleEntityNames: Set<string>
): {
  entityHandles: Map<string, EntityHandleLayout>;
  edgeHandles: Map<string, EdgeHandleAssignment>;
} {
  const visibleRelations = relations.filter(
    (r) => visibleEntityNames.has(r.source) && visibleEntityNames.has(r.target)
  );

  const outgoingByEntity = new Map<string, string[]>();
  const incomingByEntity = new Map<string, string[]>();

  for (const rel of visibleRelations) {
    const id = edgeId(rel);
    outgoingByEntity.set(rel.source, [...(outgoingByEntity.get(rel.source) ?? []), id]);
    incomingByEntity.set(rel.target, [...(incomingByEntity.get(rel.target) ?? []), id]);
  }

  const edgeHandles = new Map<string, EdgeHandleAssignment>();
  const entityHandles = new Map<string, EntityHandleLayout>();

  const ensureEntity = (name: string): EntityHandleLayout => {
    let layout = entityHandles.get(name);
    if (!layout) {
      layout = { sourceHandles: [], targetHandles: [] };
      entityHandles.set(name, layout);
    }
    return layout;
  };

  for (const [entity, edgeIds] of outgoingByEntity) {
    const layout = ensureEntity(entity);
    const sorted = [...edgeIds].sort();
    sorted.forEach((id, index) => {
      const handleId = `source-${index}`;
      const leftPercent = handleLeftPercent(index, sorted.length);
      layout.sourceHandles.push({ id: handleId, leftPercent });
      const existing = edgeHandles.get(id) ?? { sourceHandle: handleId, targetHandle: '' };
      existing.sourceHandle = handleId;
      edgeHandles.set(id, existing);
    });
  }

  for (const [entity, edgeIds] of incomingByEntity) {
    const layout = ensureEntity(entity);
    const sorted = [...edgeIds].sort();
    sorted.forEach((id, index) => {
      const handleId = `target-${index}`;
      const leftPercent = handleLeftPercent(index, sorted.length);
      layout.targetHandles.push({ id: handleId, leftPercent });
      const existing = edgeHandles.get(id) ?? { sourceHandle: '', targetHandle: handleId };
      existing.targetHandle = handleId;
      edgeHandles.set(id, existing);
    });
  }

  for (const name of visibleEntityNames) {
    ensureEntity(name);
  }

  return { entityHandles, edgeHandles };
}
