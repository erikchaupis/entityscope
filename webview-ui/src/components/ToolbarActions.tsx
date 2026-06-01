import { Eye, EyeOff, Palette, PanelRight, PanelRightClose, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { THEME_LABELS, nextTheme } from '@/hooks/useTheme';
import type { AppTheme } from '@/types';

interface ToolbarActionsProps {
  showProperties: boolean;
  onToggleProperties: () => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onRefresh: () => void;
  entityCount?: number;
  detailsOpen?: boolean;
  canShowDetails?: boolean;
  onToggleDetails?: () => void;
}

export function ToolbarActions({
  showProperties,
  onToggleProperties,
  theme,
  onThemeChange,
  onRefresh,
  entityCount,
  detailsOpen,
  canShowDetails,
  onToggleDetails,
}: ToolbarActionsProps) {
  const next = nextTheme(theme);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1.5 px-3 border-l border-border shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={detailsOpen ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              disabled={!canShowDetails}
              onClick={onToggleDetails}
            >
              {detailsOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRight className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {detailsOpen
              ? 'Hide entity details'
              : canShowDetails
                ? 'Show entity details'
                : 'Select an entity first'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showProperties ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 gap-1.5 text-xs px-2.5"
              onClick={onToggleProperties}
            >
              {showProperties ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {showProperties ? 'Hide properties' : 'Show properties'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {showProperties ? 'Hide property fields on graph nodes' : 'Show property fields on graph nodes'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs px-2.5"
              onClick={() => onThemeChange(next)}
            >
              <Palette className="h-3.5 w-3.5 text-package" />
              <span className="hidden sm:inline">{THEME_LABELS[theme]}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Switch theme (next: {THEME_LABELS[next]})</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh model</TooltipContent>
        </Tooltip>

        {entityCount !== undefined && (
          <span className="text-xs text-muted-foreground whitespace-nowrap pl-1">
            {entityCount} entities
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}
