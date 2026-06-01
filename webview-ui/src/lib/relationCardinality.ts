import type { RelationType } from '@/types';

export interface CardinalityEnd {
  /** Short label shown on the edge endpoint */
  label: string;
  /** Visual style for the terminal marker */
  kind: 'one' | 'optional-one' | 'many';
}

export interface RelationCardinality {
  source: CardinalityEnd;
  target: CardinalityEnd;
  /** Human-readable summary, e.g. "1 → 0..*" */
  summary: string;
}

export function getRelationCardinality(type: RelationType): RelationCardinality {
  switch (type) {
    case 'ONE_TO_ONE':
      return {
        source: { label: '0..1', kind: 'optional-one' },
        target: { label: '0..1', kind: 'optional-one' },
        summary: '0..1 → 0..1',
      };
    case 'ONE_TO_MANY':
      return {
        source: { label: '1', kind: 'one' },
        target: { label: '0..*', kind: 'many' },
        summary: '1 → 0..*',
      };
    case 'MANY_TO_ONE':
      return {
        source: { label: '0..*', kind: 'many' },
        target: { label: '0..1', kind: 'optional-one' },
        summary: '0..* → 0..1',
      };
    case 'MANY_TO_MANY':
      return {
        source: { label: '*', kind: 'many' },
        target: { label: '*', kind: 'many' },
        summary: '* ↔ *',
      };
  }
}

export function getEndpointAngle(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): number {
  return Math.atan2(targetY - sourceY, targetX - sourceX);
}

export function offsetPoint(
  x: number,
  y: number,
  angle: number,
  distance: number
): { x: number; y: number } {
  return {
    x: x + Math.cos(angle) * distance,
    y: y + Math.sin(angle) * distance,
  };
}
