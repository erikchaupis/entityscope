import type { MouseEvent } from 'react';
import { ExternalLink, PanelRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntityNodeActionsProps {
  entityName: string;
  visible: boolean;
  onShowDetails: (name: string) => void;
  onOpenSource: (name: string) => void;
}

function stop(e: MouseEvent) {
  e.stopPropagation();
}

export function EntityNodeActions({
  entityName,
  visible,
  onShowDetails,
  onOpenSource,
}: EntityNodeActionsProps) {
  return (
    <div
      className={cn(
        'absolute top-2 right-1.5 flex items-center gap-0.5 rounded-md p-0.5',
        'bg-card/90 border border-border/80 shadow-sm backdrop-blur-sm',
        'transition-opacity duration-150',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
      )}
      onClick={stop}
      onDoubleClick={stop}
    >
      <button
        type="button"
        className="ev-node-action-btn"
        title="View details (Enter)"
        aria-label={`View details for ${entityName}`}
        onClick={() => onShowDetails(entityName)}
      >
        <PanelRight className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="ev-node-action-btn"
        title="Open source (double-click)"
        aria-label={`Open source for ${entityName}`}
        onClick={() => onOpenSource(entityName)}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
