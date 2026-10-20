import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/react';
import type { AristaMapaFlow } from '../typesMapa';

export function AristaMapa({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: EdgeProps<AristaMapaFlow>) {
  const [ruta] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  return (
    <BaseEdge
      id={id}
      path={ruta}
      interactionWidth={0}
      style={{
        ...style,
        stroke: '#111111',
        strokeWidth: 1.4,
        pointerEvents: 'none',
      }}
    />
  );
}
