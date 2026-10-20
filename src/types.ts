import type { Edge, Node } from '@xyflow/react';

export type TipoNodo = 'inicio' | 'proceso' | 'decision' | 'accion' | 'fin';

export interface DatosNodo extends Record<string, unknown> {
  etiqueta: string;
  tipo: TipoNodo;
  color: string;
  colorTexto: string;
}

export type NodoDiagrama = Node<DatosNodo, 'nodo'>;
export type AristaDiagrama = Edge<Record<string, unknown>, 'etiqueta'>;

export interface Diagrama {
  id: string;
  nombre: string;
  nodos: NodoDiagrama[];
  aristas: AristaDiagrama[];
}

export interface Instantanea {
  nodos: NodoDiagrama[];
  aristas: AristaDiagrama[];
}

export interface EstadoGuardado {
  diagramas: Diagrama[];
  diagramaActivoId: string;
}
