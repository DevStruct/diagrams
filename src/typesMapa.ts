import type { Edge, Node } from '@xyflow/react';

export type NivelMapa = 1 | 2 | 3;

export interface PosicionMapa {
  x: number;
  y: number;
}

export interface NodoMapa {
  id: string;
  etiqueta: string;
  nivel: NivelMapa;
  padreId: string | null;
  orden: number;
  /** Posición manual. Si no existe, el nodo se coloca con la distribución automática. */
  posicion?: PosicionMapa;
  /** Tamaño manual. Si no existe, se calcula a partir del nivel y el texto. */
  ancho?: number;
  alto?: number;
}

export interface DiagramaMapa {
  id: string;
  nombre: string;
  nodos: NodoMapa[];
}

export interface EstadoMapasGuardado {
  mapas: DiagramaMapa[];
  mapaActivoId: string;
}

export interface InstantaneaMapa {
  nodos: NodoMapa[];
}

export interface DatosNodoMapa extends Record<string, unknown> {
  etiqueta: string;
  nivel: NivelMapa;
}

export type NodoMapaFlow = Node<DatosNodoMapa, 'mapa'>;
export type AristaMapaFlow = Edge<Record<string, unknown>, 'recta'>;
