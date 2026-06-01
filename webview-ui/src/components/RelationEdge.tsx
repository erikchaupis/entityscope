import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  type EdgeProps,
} from '@xyflow/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getEndpointLabelStyle } from '@/lib/endpointLabelPosition';
import { getRelationCardinality } from '@/lib/relationCardinality';
import { getRelationColorVar } from '@/lib/relationColors';
import { formatRelationType } from '@/lib/utils';
import type { RelationJson } from '@/types';

function CardinalityBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold leading-none bg-card/95 shadow-sm backdrop-blur-sm z-10"
      style={{
        color,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: color,
      }}
    >
      {label}
    </span>
  );
}

function EndpointCardinality({
  x,
  y,
  position,
  label,
  color,
}: {
  x: number;
  y: number;
  position: Position;
  label: string;
  color: string;
}) {
  const style = getEndpointLabelStyle(x, y, position);
  return (
    <div
      className="nodrag nopan pointer-events-none absolute"
      style={{
        left: style.left,
        top: style.top,
        transform: style.transform,
      }}
    >
      <CardinalityBadge label={label} color={color} />
    </div>
  );
}

export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  const rel = (data as { relation?: RelationJson } | undefined)?.relation;
  const meta = rel?.metadata;
  const cardinality = rel ? getRelationCardinality(rel.type) : null;
  const relationColor = rel ? getRelationColorVar(rel.type) : 'var(--ev-relation)';

  const tooltipContent = rel && cardinality && (
    <div className="space-y-1">
      <div className="font-medium" style={{ color: relationColor }}>
        {rel.fieldName}
      </div>
      <div className="text-foreground">{formatRelationType(rel.type)}</div>
      <div className="font-mono text-xs text-muted-foreground">{cardinality.summary}</div>
      <div className="text-muted-foreground">
        <span className="text-entity">{rel.source}</span>
        {' → '}
        <span className="text-entity">{rel.target}</span>
      </div>
      {meta?.mappedBy && <div className="text-property">mappedBy: {meta.mappedBy}</div>}
      {meta?.fetch && <div className="text-property">fetch: {meta.fetch}</div>}
      {meta?.cascade && <div className="text-property">cascade: {meta.cascade}</div>}
      {meta?.orphanRemoval && <div className="text-property">orphanRemoval: true</div>}
    </div>
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        interactionWidth={20}
        style={{
          ...style,
          stroke: relationColor,
          strokeWidth: selected ? 2.5 : 1.5,
        }}
      />

      {cardinality && rel && (
        <EdgeLabelRenderer>
          <EndpointCardinality
            x={sourceX}
            y={sourceY}
            position={sourcePosition}
            label={cardinality.source.label}
            color={relationColor}
          />
          <EndpointCardinality
            x={targetX}
            y={targetY}
            position={targetPosition}
            label={cardinality.target.label}
            color={relationColor}
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="nodrag nopan absolute pointer-events-auto cursor-default"
                  style={{
                    transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                    width: 24,
                    height: 24,
                    opacity: 0,
                  }}
                  aria-label={`${rel.fieldName} ${cardinality.summary}`}
                />
              </TooltipTrigger>
              {tooltipContent && (
                <TooltipContent side="top" className="max-w-xs border-border">
                  {tooltipContent}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
