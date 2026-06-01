import type { FitViewOptions } from '@xyflow/react';

/** Shared viewport fit — keeps the graph readable without zooming too far out. */
export const FIT_VIEW_OPTIONS: FitViewOptions = {
  padding: 0.03,
  minZoom: 0.95,
  maxZoom: 1.45,
  duration: 280,
};
