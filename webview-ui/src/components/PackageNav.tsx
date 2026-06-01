import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { buildPackageColorMap, getPackageColorForEntity, getPackageColorVar } from '@/lib/packageColors';
import { cn, getTopLevelPackage } from '@/lib/utils';
import type { EntityJson } from '@/types';

interface PackageNavProps {
  entities: EntityJson[];
  expandedPackages: Set<string>;
  selectedPackage: string | null;
  onTogglePackage: (pkg: string) => void;
  onFocusPackage: (pkg: string | null) => void;
  onSelectEntity: (entityName: string) => void;
  selectedEntity: string | null;
}

export function PackageNav({
  entities,
  expandedPackages,
  selectedPackage,
  onTogglePackage,
  onFocusPackage,
  onSelectEntity,
  selectedEntity,
}: PackageNavProps) {
  const packageColorMap = useMemo(() => buildPackageColorMap(entities), [entities]);

  const packages = new Map<string, EntityJson[]>();

  for (const entity of entities) {
    const pkg = getTopLevelPackage(entity.package);
    if (!packages.has(pkg)) {
      packages.set(pkg, []);
    }
    packages.get(pkg)!.push(entity);
  }

  const sortedPackages = [...packages.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-package">
          Packages
        </span>
        {selectedPackage && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onFocusPackage(null)}
          >
            Clear
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {sortedPackages.map(([pkg, pkgEntities]) => {
            const isExpanded = expandedPackages.has(pkg);
            const isFocused = selectedPackage === pkg;
            const pkgColor = packageColorMap.get(pkg) ?? getPackageColorVar(pkg);

            return (
              <div key={pkg}>
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-md px-1 py-1 hover:bg-accent group',
                    isFocused && 'pkg-selected'
                  )}
                >
                  <button
                    className="p-0.5 hover:bg-secondary rounded"
                    onClick={() => onTogglePackage(pkg)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    className="flex-1 flex items-center gap-1.5 text-left text-sm truncate py-0.5 min-w-0"
                    title={isFocused ? 'Show all packages' : 'Filter graph to this package'}
                    onClick={() => onFocusPackage(isFocused ? null : pkg)}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: pkgColor }}
                      aria-hidden
                    />
                    <span className="truncate font-medium" style={{ color: pkgColor }}>
                      {pkg}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal shrink-0">
                      ({pkgEntities.length})
                    </span>
                  </button>
                </div>
                {isExpanded && (
                  <div className="ml-4 space-y-0.5">
                    {pkgEntities
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((entity) => {
                        const entityPkgColor = getPackageColorForEntity(entity, packageColorMap);
                        const isSelected = selectedEntity === entity.name;
                        return (
                        <button
                          key={entity.name}
                          className={cn(
                            'w-full text-left text-sm px-2 py-1 rounded-md truncate hover:bg-accent text-foreground',
                            isSelected && 'entity-nav-selected font-medium'
                          )}
                          style={isSelected ? { color: entityPkgColor } : undefined}
                          onClick={() => onSelectEntity(entity.name)}
                        >
                          {entity.name}
                        </button>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
