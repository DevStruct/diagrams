import type { TipoNodo } from '../../types';

export type DireccionMermaid = 'TB' | 'BT' | 'LR' | 'RL';

export interface NodoIntermedio {
  id: string;
  etiqueta: string;
  tipo: TipoNodo;
}

export interface AristaIntermedia {
  origen: string;
  destino: string;
  etiqueta: string;
  /** Enlace invisible de Mermaid (`~~~`): influye en el layout pero no se dibuja. */
  invisible?: boolean;
}

export interface DiagramaIntermedio {
  nombre?: string;
  direccion: DireccionMermaid;
  nodos: NodoIntermedio[];
  aristas: AristaIntermedia[];
  avisos: string[];
}
