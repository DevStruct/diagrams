import dagre from '@dagrejs/dagre';
import { MarkerType } from '@xyflow/react';
import { COLOR_ARISTA, COLORES_POR_TIPO } from '../../data/colores';
import type { AristaDiagrama, Diagrama, NodoDiagrama, TipoNodo } from '../../types';
import { nuevoId } from '../id';
import type { DiagramaIntermedio } from './tipos';

const ANCHOS: Record<TipoNodo, number> = {
  inicio: 120,
  fin: 120,
  proceso: 210,
  accion: 210,
  decision: 150,
};

export function altoNodo(tipo: TipoNodo, etiqueta: string): number {
  if (tipo === 'decision') return 150;
  if (tipo === 'inicio' || tipo === 'fin') return 46;

  const lineas = etiqueta
    .split('\n')
    .reduce((total, linea) => total + Math.max(1, Math.ceil(linea.length / 24)), 0);

  return Math.max(58, Math.min(170, 32 + lineas * 18));
}

interface Centro {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

function calcularLados(origen: Centro, destino: Centro): { sourceHandle: string; targetHandle: string } {
  const dx = destino.x - origen.x;
  const dy = destino.y - origen.y;

  if (Math.abs(dy) > Math.abs(dx)) {
    return dy >= 0
      ? { sourceHandle: 'bottom', targetHandle: 'top' }
      : { sourceHandle: 'top', targetHandle: 'bottom' };
  }

  return dx >= 0
    ? { sourceHandle: 'right', targetHandle: 'left' }
    : { sourceHandle: 'left', targetHandle: 'right' };
}

export function construirDiagrama(intermedio: DiagramaIntermedio, nombre: string): Diagrama {
  // multigraph: permite aristas paralelas entre los mismos dos nodos (nombre propio).
  const grafo = new dagre.graphlib.Graph({ multigraph: true });
  grafo.setGraph({
    rankdir: intermedio.direccion,
    nodesep: 60,
    ranksep: 90,
    marginx: 40,
    marginy: 40,
  });
  grafo.setDefaultEdgeLabel(() => ({}));

  const tamanos = new Map<string, { ancho: number; alto: number }>();

  for (const nodo of intermedio.nodos) {
    const ancho = ANCHOS[nodo.tipo];
    const alto = altoNodo(nodo.tipo, nodo.etiqueta);
    tamanos.set(nodo.id, { ancho, alto });
    grafo.setNode(nodo.id, { width: ancho, height: alto });
  }

  intermedio.aristas.forEach((arista, indice) => {
    if (grafo.hasNode(arista.origen) && grafo.hasNode(arista.destino)) {
      grafo.setEdge(arista.origen, arista.destino, {}, `e${indice}`);
    }
  });

  dagre.layout(grafo);

  const nodosDiagrama: NodoDiagrama[] = intermedio.nodos.map((nodo) => {
    const tamano = tamanos.get(nodo.id) ?? { ancho: ANCHOS[nodo.tipo], alto: altoNodo(nodo.tipo, nodo.etiqueta) };
    const dato = grafo.node(nodo.id) as { x: number; y: number } | undefined;
    const colores = COLORES_POR_TIPO[nodo.tipo];

    return {
      id: nodo.id,
      type: 'nodo',
      position: {
        x: Math.round((dato?.x ?? 0) - tamano.ancho / 2),
        y: Math.round((dato?.y ?? 0) - tamano.alto / 2),
      },
      data: {
        etiqueta: nodo.etiqueta,
        tipo: nodo.tipo,
        color: colores.fondo,
        colorTexto: colores.texto,
      },
      style:
        nodo.tipo === 'decision'
          ? { width: tamano.ancho, height: tamano.alto }
          : { width: tamano.ancho },
    };
  });

  const centros = new Map<string, Centro>();
  for (const nodo of nodosDiagrama) {
    const tamano = tamanos.get(nodo.id) ?? { ancho: ANCHOS[nodo.data.tipo], alto: altoNodo(nodo.data.tipo, nodo.data.etiqueta) };
    centros.set(nodo.id, {
      x: nodo.position.x + tamano.ancho / 2,
      y: nodo.position.y + tamano.alto / 2,
      ancho: tamano.ancho,
      alto: tamano.alto,
    });
  }

  const aristasDiagrama: AristaDiagrama[] = intermedio.aristas
    .filter((arista) => !arista.invisible)
    .map((arista, indice) => {
      const origen = centros.get(arista.origen);
      const destino = centros.get(arista.destino);
      const lados =
        origen && destino
          ? calcularLados(origen, destino)
          : { sourceHandle: 'right', targetHandle: 'left' };

      return {
        id: `a-${indice}-${arista.origen}-${arista.destino}`,
        source: arista.origen,
        target: arista.destino,
        sourceHandle: lados.sourceHandle,
        targetHandle: lados.targetHandle,
        type: 'etiqueta',
        label: arista.etiqueta,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: COLOR_ARISTA,
        },
      };
    });

  return {
    id: nuevoId('d'),
    nombre,
    nodos: nodosDiagrama,
    aristas: aristasDiagrama,
  };
}
