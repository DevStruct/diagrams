import { nuevoId } from '../lib/id';
import type { DiagramaMapa, NivelMapa, NodoMapa } from '../typesMapa';

const crearNodo = (
  id: string,
  nivel: NivelMapa,
  etiqueta: string,
  padreId: string | null,
  orden: number,
): NodoMapa => ({ id, etiqueta, nivel, padreId, orden });

/**
 * Ejemplo de mapa de proceso de tres niveles: proceso, subprocesos y
 * actividades. Se usa como plantilla la primera vez que se abre la sección.
 */
export function crearMapaPlantilla(): DiagramaMapa {
  const nodos: NodoMapa[] = [
    crearNodo(
      'mapa-raiz',
      1,
      'PO-07 Control de inventario, mermas y vencimientos',
      null,
      0,
    ),

    crearNodo(
      'mapa-sub-1',
      2,
      'PO-07.01 Verificación y conciliación de existencias',
      'mapa-raiz',
      0,
    ),
    crearNodo('mapa-sub-1-a', 3, 'Definir el alcance del inventario', 'mapa-sub-1', 0),
    crearNodo('mapa-sub-1-b', 3, 'Contar las existencias físicas', 'mapa-sub-1', 1),
    crearNodo(
      'mapa-sub-1-c',
      3,
      'Comparar registros e investigar diferencias',
      'mapa-sub-1',
      2,
    ),
    crearNodo('mapa-sub-1-d', 3, 'Documentar resultados', 'mapa-sub-1', 3),

    crearNodo(
      'mapa-sub-2',
      2,
      'PO-07.02 Control de vencimientos y aptitud del producto',
      'mapa-raiz',
      1,
    ),
    crearNodo(
      'mapa-sub-2-a',
      3,
      'Revisar fechas y condición del producto',
      'mapa-sub-2',
      0,
    ),
    crearNodo(
      'mapa-sub-2-b',
      3,
      'Identificar y registrar riesgos de vencimiento',
      'mapa-sub-2',
      1,
    ),
    crearNodo(
      'mapa-sub-2-c',
      3,
      'Determinar y comunicar el retiro de productos no aptos',
      'mapa-sub-2',
      2,
    ),

    crearNodo(
      'mapa-sub-3',
      2,
      'PO-07.03 Registro y tratamiento de mermas',
      'mapa-raiz',
      2,
    ),
    crearNodo('mapa-sub-3-a', 3, 'Identificar cantidad y causa de pérdida', 'mapa-sub-3', 0),
    crearNodo(
      'mapa-sub-3-b',
      3,
      'Registrar la merma y tramitar su validación',
      'mapa-sub-3',
      1,
    ),
    crearNodo(
      'mapa-sub-3-c',
      3,
      'Documentar el tratamiento y la baja correspondiente',
      'mapa-sub-3',
      2,
    ),

    crearNodo(
      'mapa-sub-4',
      2,
      'PO-07.04 Análisis de diferencias y pérdidas',
      'mapa-raiz',
      3,
    ),
    crearNodo(
      'mapa-sub-4-a',
      3,
      'Consolidar resultados de inventario y mermas',
      'mapa-sub-4',
      0,
    ),
    crearNodo('mapa-sub-4-b', 3, 'Analizar recurrencias y causas', 'mapa-sub-4', 1),
    crearNodo(
      'mapa-sub-4-c',
      3,
      'Comunicar y dar seguimiento a acciones correctivas',
      'mapa-sub-4',
      2,
    ),
  ];

  return {
    id: nuevoId('m'),
    nombre: 'PO-07 Control de inventario, mermas y vencimientos',
    nodos,
  };
}
