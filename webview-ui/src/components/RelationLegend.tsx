import { getRelationCardinality } from '@/lib/relationCardinality';
import {
  getRelationColorVar,
  LEGEND_RELATION_TYPES,
  RELATION_TYPE_LABELS,
} from '@/lib/relationColors';

function RelationLegendContent() {
  return (
    <ul className="space-y-1">
      {LEGEND_RELATION_TYPES.map((type) => {
        const color = getRelationColorVar(type);
        const { summary } = getRelationCardinality(type);
        return (
          <li key={type} className="flex items-center gap-2 text-xs whitespace-nowrap">
            <span
              className="w-5 h-0.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="font-medium" style={{ color }}>
                {RELATION_TYPE_LABELS[type]}
              </span>
              <span className="text-muted-foreground ml-1 font-mono text-[10px]">
                {summary}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Compact trigger; full legend on hover (keeps the graph uncluttered). */
export function RelationLegendHover() {
  return (
    <div className="ev-legend-hover">
      <button
        type="button"
        className="ev-legend-trigger"
        aria-label="Show relationship legend"
        title="Relationship colors"
      >
        <span className="flex flex-col gap-1" aria-hidden>
          {LEGEND_RELATION_TYPES.map((type) => (
            <span
              key={type}
              className="h-0.5 w-5 rounded-full"
              style={{ backgroundColor: getRelationColorVar(type) }}
            />
          ))}
        </span>
      </button>
      <div className="ev-relation-legend ev-legend-popup" role="tooltip">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Relationships
        </p>
        <RelationLegendContent />
      </div>
    </div>
  );
}
