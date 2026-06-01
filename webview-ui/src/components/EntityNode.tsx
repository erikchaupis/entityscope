import { useCallback, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_WIDTH, MAX_VISIBLE_PROPERTIES } from '@/lib/elkLayout';
import type { HandleSlot } from '@/lib/handleDistribution';
import { getEntityFqn, type EntityActionHandlers } from '@/lib/entityActions';
import { EntityContextMenu } from '@/components/EntityContextMenu';
import { EntityNodeActions } from '@/components/EntityNodeActions';
import { cn } from '@/lib/utils';
import type { EntityJson } from '@/types';

export interface EntityNodeData extends Record<string, unknown> {
  entity: EntityJson;
  relationCount: number;
  highlighted: boolean;
  selected: boolean;
  dimmed: boolean;
  showProperties: boolean;
  packageColor: string;
  packageLabel: string;
  sourceHandles: HandleSlot[];
  targetHandles: HandleSlot[];
  actions: EntityActionHandlers;
  onSelect: (name: string) => void;
}

const handleClass = '!w-2.5 !h-2.5 !border-0';

export function EntityNode({ data }: NodeProps) {
  const {
    entity,
    relationCount,
    highlighted,
    selected,
    dimmed,
    showProperties,
    packageColor,
    packageLabel,
    sourceHandles,
    targetHandles,
    actions,
    onSelect,
  } = data as EntityNodeData;

  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fqn = getEntityFqn(entity);

  const visibleProperties = showProperties
    ? entity.properties.slice(0, MAX_VISIBLE_PROPERTIES)
    : [];
  const hiddenCount = showProperties
    ? Math.max(0, entity.properties.length - MAX_VISIBLE_PROPERTIES)
    : 0;

  const handleClick = useCallback(() => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      actions.onOpenSource(entity.name);
      return;
    }
    clickTimeout.current = setTimeout(() => {
      clickTimeout.current = null;
      onSelect(entity.name);
    }, 250);
  }, [entity.name, onSelect, actions]);

  const renderHandles = (slots: HandleSlot[], type: 'source' | 'target', position: Position) => {
    if (slots.length === 0) {
      return (
        <Handle
          type={type}
          position={position}
          id="default"
          className={handleClass}
          style={{ backgroundColor: packageColor }}
        />
      );
    }
    return slots.map((slot) => (
      <Handle
        key={slot.id}
        type={type}
        position={position}
        id={slot.id}
        className={handleClass}
        style={{ left: `${slot.leftPercent}%`, backgroundColor: packageColor }}
      />
    ));
  };

  return (
    <div className="group">
      {renderHandles(targetHandles, 'target', Position.Top)}
      <EntityContextMenu entityName={entity.name} fqn={fqn} actions={actions}>
        <div
          className={cn(
            'entity-card relative rounded-lg border shadow-sm cursor-pointer transition-all overflow-hidden',
            highlighted && 'is-highlighted',
            selected && 'is-selected',
            dimmed && 'opacity-30'
          )}
          style={
            {
              width: NODE_WIDTH,
              '--ev-package-accent': packageColor,
            } as React.CSSProperties
          }
          onClick={handleClick}
        >
          <EntityNodeActions
            entityName={entity.name}
            visible={selected}
            onShowDetails={actions.onShowDetails}
            onOpenSource={actions.onOpenSource}
          />
          <div
            className="h-1 w-full shrink-0"
            style={{ backgroundColor: packageColor }}
            title={packageLabel}
          />
          <div className="px-3 pt-2 pb-2 border-b border-border/50 pr-14">
            <div className="font-semibold text-sm truncate text-foreground">{entity.name}</div>
          </div>
          <div className="px-3 py-2">
            <div className="text-xs truncate text-table font-medium">{entity.table}</div>

            {showProperties ? (
              <div className="mt-2 space-y-0.5">
                {visibleProperties.length === 0 && (
                  <div className="text-xs text-muted-foreground italic">No properties</div>
                )}
                {visibleProperties.map((prop) => (
                  <div
                    key={prop.name}
                    className="flex items-center justify-between gap-2 text-[11px] leading-tight"
                  >
                    <span
                      className={cn('truncate text-property', prop.isId && 'font-medium')}
                      style={prop.isId ? { color: packageColor } : undefined}
                    >
                      {prop.isId ? '◆ ' : ''}
                      {prop.name}
                    </span>
                    <span className="text-muted-foreground shrink-0">{prop.type}</span>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <div className="text-[10px] text-muted-foreground pt-0.5">+{hiddenCount} more</div>
                )}
                <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/40 mt-1.5">
                  {relationCount} relations
                </div>
              </div>
            ) : (
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-property">{entity.properties.length} properties</span>
                <span className="text-muted-foreground">{relationCount} relations</span>
              </div>
            )}
          </div>
        </div>
      </EntityContextMenu>
      {renderHandles(sourceHandles, 'source', Position.Bottom)}
    </div>
  );
}
