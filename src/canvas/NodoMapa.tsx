import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import {
  TAMANO_MAXIMO_MAPA,
  TAMANO_MINIMO_MAPA,
} from '../lib/mapaLayout';
import { useMapaStore } from '../store/mapaStore';
import type { NodoMapaFlow } from '../typesMapa';

const claseNivel = (nivel: number): string => {
  if (nivel === 1) return 'nodo-mapa--proceso';
  if (nivel === 2) return 'nodo-mapa--subproceso';
  return 'nodo-mapa--actividad';
};

export function NodoMapaVisual({ id, data, selected }: NodeProps<NodoMapaFlow>) {
  const actualizarNodo = useMapaStore((estado) => estado.actualizarNodo);
  const iniciarEdicionManual = useMapaStore((estado) => estado.iniciarEdicionManual);
  const seleccionMultiple = useMapaStore((estado) => estado.seleccionadosIds.length > 1);
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(data.etiqueta);
  const cancelarRef = useRef(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editando) setBorrador(data.etiqueta);
  }, [data.etiqueta, editando]);

  useEffect(() => {
    if (editando) {
      areaRef.current?.focus();
      areaRef.current?.select();
    }
  }, [editando]);

  const terminarEdicion = () => {
    if (cancelarRef.current) {
      cancelarRef.current = false;
      setBorrador(data.etiqueta);
      setEditando(false);
      return;
    }

    const limpio = borrador.trim();
    if (limpio && limpio !== data.etiqueta) {
      actualizarNodo(id, limpio);
    } else {
      setBorrador(data.etiqueta);
    }
    setEditando(false);
  };

  return (
    <div
      className={`nodo-mapa ${claseNivel(data.nivel)} ${selected ? 'nodo-mapa--activo' : ''}`}
      onDoubleClick={(evento) => {
        evento.stopPropagation();
        if (editando) return;
        cancelarRef.current = false;
        setBorrador(data.etiqueta);
        setEditando(true);
      }}
    >
      <NodeResizer
        isVisible={selected && !seleccionMultiple}
        minWidth={TAMANO_MINIMO_MAPA[data.nivel].ancho}
        minHeight={TAMANO_MINIMO_MAPA[data.nivel].alto}
        maxWidth={TAMANO_MAXIMO_MAPA.ancho}
        maxHeight={TAMANO_MAXIMO_MAPA.alto}
        color="#111111"
        handleStyle={{ width: 7, height: 7, borderRadius: 0 }}
        lineStyle={{ borderColor: '#111111' }}
        onResizeStart={() => iniciarEdicionManual()}
      />

      <div className="nodo-mapa__figura">
        <div className="nodo-mapa__texto">
          {editando ? (
            <textarea
              ref={areaRef}
              className="nodo-mapa__editor nodrag nopan"
              value={borrador}
              onChange={(evento) => setBorrador(evento.target.value)}
              onBlur={terminarEdicion}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter' && !evento.shiftKey) {
                  evento.preventDefault();
                  evento.currentTarget.blur();
                }
                if (evento.key === 'Escape') {
                  cancelarRef.current = true;
                  evento.currentTarget.blur();
                }
              }}
            />
          ) : (
            <span>{data.etiqueta}</span>
          )}
        </div>
      </div>

      <div className="nodo-mapa__marco" aria-hidden="true" />

      <Handle
        id="arriba"
        type="target"
        position={Position.Top}
        className="manija manija--mapa"
        isConnectable={false}
      />
      <Handle
        id="abajo"
        type="source"
        position={Position.Bottom}
        className="manija manija--mapa"
        isConnectable={false}
      />
    </div>
  );
}
