import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPackageSegments(packageName: string): string[] {
  if (!packageName) {
    return ['default'];
  }
  return packageName.split('.');
}

export function getTopLevelPackage(packageName: string): string {
  const segments = getPackageSegments(packageName);
  return segments.length > 1 ? segments[segments.length - 1] : segments[0];
}

export function formatRelationType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase();
}

export function getConnectedEntities(
  entityName: string,
  relations: { source: string; target: string }[]
): Set<string> {
  const connected = new Set<string>([entityName]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const rel of relations) {
      if (connected.has(rel.source) && !connected.has(rel.target)) {
        connected.add(rel.target);
        changed = true;
      }
      if (connected.has(rel.target) && !connected.has(rel.source)) {
        connected.add(rel.source);
        changed = true;
      }
    }
  }
  return connected;
}
