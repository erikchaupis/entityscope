import { getTopLevelPackage } from '@/lib/utils';
import type { EntityJson } from '@/types';

export const PACKAGE_PALETTE_SIZE = 8;

/** Stable hash — same package name always maps to the same palette index. */
export function hashPackageName(packageName: string): number {
  let hash = 0;
  for (let i = 0; i < packageName.length; i++) {
    hash = (hash << 5) - hash + packageName.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % PACKAGE_PALETTE_SIZE;
}

export function getPackageColorVar(packageKey: string): string {
  const index = hashPackageName(packageKey);
  return `var(--ev-package-${index})`;
}

export function getEntityPackageKey(entity: Pick<EntityJson, 'package'>): string {
  return getTopLevelPackage(entity.package);
}

/** Build a stable package → color map for all entities in the model. */
export function buildPackageColorMap(entities: EntityJson[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const entity of entities) {
    const key = getEntityPackageKey(entity);
    if (!map.has(key)) {
      map.set(key, getPackageColorVar(key));
    }
  }
  return map;
}

export function getPackageColorForEntity(
  entity: Pick<EntityJson, 'package'>,
  colorMap: Map<string, string>
): string {
  const key = getEntityPackageKey(entity);
  return colorMap.get(key) ?? getPackageColorVar(key);
}
