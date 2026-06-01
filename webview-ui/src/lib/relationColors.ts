import type { RelationType } from '@/types';

export function getRelationColorVar(type: RelationType): string {
  switch (type) {
    case 'ONE_TO_ONE':
      return 'var(--ev-rel-one-to-one)';
    case 'ONE_TO_MANY':
      return 'var(--ev-rel-one-to-many)';
    case 'MANY_TO_ONE':
      return 'var(--ev-rel-many-to-one)';
    case 'MANY_TO_MANY':
      return 'var(--ev-rel-many-to-many)';
    default:
      return 'var(--ev-relation)';
  }
}

export const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  ONE_TO_ONE: 'One-to-one',
  ONE_TO_MANY: 'One-to-many',
  MANY_TO_ONE: 'Many-to-one',
  MANY_TO_MANY: 'Many-to-many',
};

/** Types shown in the graph legend (MANY_TO_ONE is normalized to ONE_TO_MANY in the model). */
export const LEGEND_RELATION_TYPES: RelationType[] = [
  'ONE_TO_ONE',
  'ONE_TO_MANY',
  'MANY_TO_MANY',
];
