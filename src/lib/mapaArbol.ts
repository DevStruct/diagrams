import type { NodoMapa } from '../typesMapa';

const compararHermanos = (a: NodoMapa, b: NodoMapa): number =>
  a.orden - b.orden || a.etiqueta.localeCompare(b.etiqueta, 'es');

export function hijosDe(nodos: NodoMapa[], padreId: string | null): NodoMapa[] {
  return nodos.filter((nodo) => nodo.padreId === padreId).sort(compararHermanos);
}

export function raicesDe(nodos: NodoMapa[]): NodoMapa[] {
  return hijosDe(nodos, null);
}

export function descendientesDe(nodos: NodoMapa[], id: string): NodoMapa[] {
  const encontrados: NodoMapa[] = [];
  const pendientes = [id];

  while (pendientes.length > 0) {
    const padreId = pendientes.pop();
    if (!padreId) continue;
    for (const hijo of hijosDe(nodos, padreId)) {
      encontrados.push(hijo);
      pendientes.push(hijo.id);
    }
  }

  return encontrados;
}

export function contarDescendientes(nodos: NodoMapa[], id: string): number {
  return descendientesDe(nodos, id).length;
}

export interface FilaArbol {
  nodo: NodoMapa;
  profundidad: number;
}

export function aplanarArbol(nodos: NodoMapa[]): FilaArbol[] {
  const filas: FilaArbol[] = [];

  const visitar = (padreId: string | null, profundidad: number) => {
    for (const nodo of hijosDe(nodos, padreId)) {
      filas.push({ nodo, profundidad });
      visitar(nodo.id, profundidad + 1);
    }
  };

  visitar(null, 0);
  return filas;
}
