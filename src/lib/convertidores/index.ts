import type { Diagrama } from '../../types';
import { construirDiagrama } from './layout';
import { parsearMermaid } from './mermaid';

export interface ResultadoConversion {
  diagrama: Diagrama;
  avisos: string[];
}

export function convertirMermaid(codigo: string, nombre: string): ResultadoConversion {
  const intermedio = parsearMermaid(codigo);

  if (intermedio.nodos.length === 0) {
    throw new Error('No se encontró ningún nodo en el código Mermaid.');
  }

  const nombreFinal = nombre.trim() || intermedio.nombre || 'Mermaid importado';
  const diagrama = construirDiagrama(intermedio, nombreFinal);

  return { diagrama, avisos: intermedio.avisos };
}
