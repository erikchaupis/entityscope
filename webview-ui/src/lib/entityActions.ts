import type { EntityJson } from '@/types';

export interface EntityActionHandlers {
  onShowDetails: (entityName: string) => void;
  onOpenSource: (entityName: string) => void;
  onCenter: (entityName: string) => void;
  onCopyName: (entityName: string) => void;
  onCopyFqn: (entityName: string) => void;
}

/** Actions provided by App; `onCenter` is added inside EntityGraph. */
export type EntityGraphActionsInput = Omit<EntityActionHandlers, 'onCenter'>;

export function getEntityFqn(entity: EntityJson): string {
  return entity.package ? `${entity.package}.${entity.name}` : entity.name;
}
