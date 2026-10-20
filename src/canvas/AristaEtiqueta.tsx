import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import { COLOR_ARISTA, COLOR_SELECCION } from '../data/colores';
import { useDiagramStore } from '../store/diagramStore';
import type { AristaDiagrama } from '../types';

export function AristaEtiqueta({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  label,
  selected,
  style,
}: EdgeProps<AristaDiagrama>) {
  const actualizarEtiqueta = useDiagramStore((estado) => estado.actualizarEtiquetaArista);
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(typeof label === 'string' ? label : '');
  const cancelarRef = useRef(false);

  const texto = typeof label === 'string' ? label : '';

  useEffect(() => {
    if (!editando) {
      setBorrador(texto);
    }
  }, [texto, editando]);

  const [ruta, xEtiqueta, yEtiqueta] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
    offset: 22,
  });

  const confirmar = () => {
    if (cancelarRef.current) {
      cancelarRef.current = false;
      setBorrador(texto);
      setEditando(false);
      return;
    }

    const limpio = borrador.trim();
    if (limpio !== texto) {
      actualizarEtiqueta(id, limpio);
    }
    setEditando(false);
  };

  const mostrarEtiqueta = texto.length > 0 || Boolean(selected);

  return (
    <>
      <BaseEdge
        id={id}
        path={ruta}
        markerEnd={markerEnd}
        interactionWidth={26}
        style={{
          ...style,
          stroke: selected ? COLOR_SELECCION : COLOR_ARISTA,
          strokeWidth: selected ? 2.2 : 1.6,
        }}
      />

      {mostrarEtiqueta && (
        <EdgeLabelRenderer>
          <div
            className={`arista-etiqueta nodrag nopan ${selected ? 'arista-etiqueta--activa' : ''}`}
            style={{
              transform: `translate(-50%, -50%) translate(${xEtiqueta}px, ${yEtiqueta}px)`,
            }}
            onDoubleClick={(evento) => {
              evento.stopPropagation();
              cancelarRef.current = false;
              setEditando(true);
            }}
            onPointerDown={(evento) => evento.stopPropagation()}
          >
            {editando ? (
              <input
                className="arista-etiqueta__campo"
                value={borrador}
                autoFocus
                onChange={(evento) => setBorrador(evento.target.value)}
                onBlur={confirmar}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter') {
                    evento.currentTarget.blur();
                  }
                  if (evento.key === 'Escape') {
                    cancelarRef.current = true;
                    evento.currentTarget.blur();
                  }
                }}
              />
            ) : (
              texto || <span className="arista-etiqueta__vacia">+ etiqueta</span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
