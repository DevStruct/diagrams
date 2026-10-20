import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import type { NodoDiagrama } from '../types';

export function NodoProceso({ id, data, selected }: NodeProps<NodoDiagrama>) {
  const actualizarNodo = useDiagramStore((estado) => estado.actualizarNodo);
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(data.etiqueta);
  const cancelarRef = useRef(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editando) {
      setBorrador(data.etiqueta);
    }
  }, [data.etiqueta, editando]);

  useEffect(() => {
    if (editando) {
      areaRef.current?.focus();
      areaRef.current?.select();
    }
  }, [editando]);

  const empezarEdicion = () => {
    cancelarRef.current = false;
    setBorrador(data.etiqueta);
    setEditando(true);
  };

  const terminarEdicion = () => {
    if (cancelarRef.current) {
      cancelarRef.current = false;
      setBorrador(data.etiqueta);
      setEditando(false);
      return;
    }

    const limpio = borrador.trim();
    if (limpio && limpio !== data.etiqueta) {
      actualizarNodo(id, { etiqueta: limpio });
    } else {
      setBorrador(data.etiqueta);
    }
    setEditando(false);
  };

  const estilo = {
    '--fondo': data.color,
    '--texto-nodo': data.colorTexto,
  } as unknown as CSSProperties;

  return (
    <div
      className={`nodo nodo--${data.tipo} ${selected ? 'nodo--activo' : ''}`}
      style={estilo}
      onDoubleClick={(evento) => {
        evento.stopPropagation();
        empezarEdicion();
      }}
    >
      {data.tipo === 'decision' && (
        <>
          <div className="nodo__rombo nodo__rombo--borde" />
          <div className="nodo__rombo nodo__rombo--fondo" />
        </>
      )}

      <Handle id="top" type="source" position={Position.Top} className="manija" />
      <Handle id="right" type="source" position={Position.Right} className="manija" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="manija" />
      <Handle id="left" type="source" position={Position.Left} className="manija" />

      <div className="nodo__contenido">
        {editando ? (
          <textarea
            ref={areaRef}
            className="nodo__editor nodrag nopan"
            value={borrador}
            rows={3}
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
  );
}
