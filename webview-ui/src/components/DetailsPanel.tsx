import { ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatRelationType, getTopLevelPackage } from '@/lib/utils';
import { getPackageColorVar } from '@/lib/packageColors';
import { getRelationColorVar } from '@/lib/relationColors';
import type { EntityJson, RelationJson } from '@/types';

interface DetailsPanelProps {
  entity: EntityJson | null;
  relations: RelationJson[];
  onClose: () => void;
  onOpenSource: (entityName: string) => void;
  onSelectEntity: (entityName: string) => void;
}

export function DetailsPanel({
  entity,
  relations,
  onClose,
  onOpenSource,
  onSelectEntity,
}: DetailsPanelProps) {
  if (!entity) {
    return null;
  }

  const entityRelations = relations.filter(
    (r) => r.source === entity.name || r.target === entity.name
  );

  const outgoing = entityRelations.filter((r) => r.source === entity.name);
  const incoming = entityRelations.filter((r) => r.target === entity.name);
  const packageKey = getTopLevelPackage(entity.package);
  const packageColor = getPackageColorVar(packageKey);

  return (
    <div className="w-72 border-l border-border bg-card flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-sm">Details</h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Open source"
            onClick={() => onOpenSource(entity.name)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{entity.name}</h3>
            <p className="text-xs mt-0.5 flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: packageColor }}
              />
              <span style={{ color: packageColor }}>{packageKey}</span>
              <span className="text-muted-foreground">· {entity.package}</span>
            </p>
          </div>

          <Card className="border-border bg-background/50">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-table font-semibold uppercase tracking-wide">Table</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <code className="text-sm text-table font-medium">{entity.table}</code>
            </CardContent>
          </Card>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-property mb-2">
              Properties ({entity.properties.length})
            </h4>
            <div className="space-y-1">
              {entity.properties.map((prop) => (
                <div
                  key={prop.name}
                  className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-accent"
                >
                  <span className={prop.isId ? 'font-medium text-entity' : 'text-foreground'}>
                    {prop.isId && '◆ '}
                    {prop.name}
                  </span>
                  <span className="text-xs text-property">{prop.type}</span>
                </div>
              ))}
              {entity.properties.length === 0 && (
                <p className="text-sm text-muted-foreground">No properties detected</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: getRelationColorVar('ONE_TO_MANY') }}>
              Outgoing Relations ({outgoing.length})
            </h4>
            <div className="space-y-1">
              {outgoing.map((rel) => (
                <RelationItem
                  key={`${rel.source}-${rel.fieldName}`}
                  rel={rel}
                  direction="out"
                  onSelect={() => onSelectEntity(rel.target)}
                />
              ))}
              {outgoing.length === 0 && (
                <p className="text-sm text-muted-foreground">None</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: getRelationColorVar('MANY_TO_ONE') }}>
              Incoming Relations ({incoming.length})
            </h4>
            <div className="space-y-1">
              {incoming.map((rel) => (
                <RelationItem
                  key={`${rel.target}-${rel.fieldName}`}
                  rel={rel}
                  direction="in"
                  onSelect={() => onSelectEntity(rel.source)}
                />
              ))}
              {incoming.length === 0 && (
                <p className="text-sm text-muted-foreground">None</p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function RelationItem({
  rel,
  direction,
  onSelect,
}: {
  rel: RelationJson;
  direction: 'in' | 'out';
  onSelect: () => void;
}) {
  const other = direction === 'out' ? rel.target : rel.source;
  const relColor = getRelationColorVar(rel.type);
  return (
    <button
      className="w-full text-left text-sm py-1.5 px-2 rounded hover:bg-accent flex flex-col gap-0.5"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium" style={{ color: relColor }}>
          {rel.fieldName}
        </span>
        <span className="text-xs text-muted-foreground">{formatRelationType(rel.type)}</span>
      </div>
      <span className="text-xs text-foreground">{other}</span>
      {rel.metadata?.mappedBy && (
        <span className="text-xs text-property">mappedBy: {rel.metadata.mappedBy}</span>
      )}
    </button>
  );
}
