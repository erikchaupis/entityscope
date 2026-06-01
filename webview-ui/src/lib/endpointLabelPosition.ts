import { Position } from '@xyflow/react';

const GAP = 12;

/**
 * Place cardinality text just outside the entity border at the handle.
 */
export function getEndpointLabelStyle(
  x: number,
  y: number,
  position: Position
): { left: number; top: number; transform: string } {
  switch (position) {
    case Position.Top:
      return { left: x, top: y - GAP, transform: 'translate(-50%, -100%)' };
    case Position.Bottom:
      return { left: x, top: y + GAP, transform: 'translate(-50%, 0)' };
    case Position.Left:
      return { left: x - GAP, top: y, transform: 'translate(-100%, -50%)' };
    case Position.Right:
      return { left: x + GAP, top: y, transform: 'translate(0, -50%)' };
    default:
      return { left: x, top: y - GAP, transform: 'translate(-50%, -100%)' };
  }
}
