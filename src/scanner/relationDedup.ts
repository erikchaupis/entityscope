import { RelationModel, RelationType } from '../model/types';

/** Association type used for deduplication keys (ManyToOne collapses into OneToMany). */
function associationType(type: RelationType): RelationType {
  if (type === 'MANY_TO_ONE') {
    return 'ONE_TO_MANY';
  }
  return type;
}

/**
 * Unique key for an undirected association between two entities.
 * Entity names are sorted alphabetically per spec.
 */
export function relationKey(entityA: string, entityB: string, type: RelationType): string {
  const [a, b] = entityA < entityB ? [entityA, entityB] : [entityB, entityA];
  return `${a}|${b}|${associationType(type)}`;
}

/**
 * Prefer graph direction and type for display:
 * - ManyToOne → reversed OneToMany (User ← Order becomes User → Order)
 * - Other types keep the owning-side declaration (no mappedBy)
 */
export function toCanonicalRelation(rel: RelationModel): RelationModel {
  if (rel.type === 'MANY_TO_ONE') {
    return {
      ...rel,
      source: rel.target,
      target: rel.source,
      type: 'ONE_TO_MANY',
    };
  }

  return rel;
}

function isOwningSide(rel: RelationModel): boolean {
  return !rel.metadata?.mappedBy;
}

function preferRelation(current: RelationModel, candidate: RelationModel): RelationModel {
  const currentOwning = isOwningSide(current);
  const candidateOwning = isOwningSide(candidate);

  if (candidateOwning && !currentOwning) {
    return candidate;
  }
  if (currentOwning && !candidateOwning) {
    return current;
  }

  // Prefer OneToMany direction (parent → children) over ManyToOne when both owning
  if (candidate.type === 'ONE_TO_MANY' && current.type !== 'ONE_TO_MANY') {
    return candidate;
  }

  return current;
}

/**
 * Deduplicate bidirectional JPA associations into a single graph edge.
 *
 * Rules:
 * - Skip fields annotated with mappedBy (inverse side)
 * - One key per entity pair + association type
 * - Prefer the owning side when both would appear
 */
export function deduplicateRelations(relations: RelationModel[]): RelationModel[] {
  const byKey = new Map<string, RelationModel>();

  for (const raw of relations) {
    if (raw.metadata?.mappedBy) {
      continue;
    }

    const canonical = toCanonicalRelation(raw);
    const key = relationKey(canonical.source, canonical.target, canonical.type);

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, canonical);
      continue;
    }

    byKey.set(key, preferRelation(existing, canonical));
  }

  return [...byKey.values()].sort((a, b) => {
    const keyA = relationKey(a.source, a.target, a.type);
    const keyB = relationKey(b.source, b.target, b.type);
    return keyA.localeCompare(keyB);
  });
}
