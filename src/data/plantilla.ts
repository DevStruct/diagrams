import { MarkerType } from '@xyflow/react';
import type { AristaDiagrama, Diagrama, NodoDiagrama, TipoNodo } from '../types';
import { COLOR_ARISTA, COLORES_POR_TIPO } from './colores';
import { nuevoId } from '../lib/id';

const crearNodo = (
  id: string,
  tipo: TipoNodo,
  etiqueta: string,
  x: number,
  y: number,
  ancho: number,
  alto?: number,
): NodoDiagrama => ({
  id,
  type: 'nodo',
  position: { x, y },
  data: {
    etiqueta,
    tipo,
    color: COLORES_POR_TIPO[tipo].fondo,
    colorTexto: COLORES_POR_TIPO[tipo].texto,
  },
  style: alto ? { width: ancho, height: alto } : { width: ancho },
});

const crearArista = (
  id: string,
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string,
  label = '',
): AristaDiagrama => ({
  id,
  source,
  target,
  sourceHandle,
  targetHandle,
  type: 'etiqueta',
  label,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: COLOR_ARISTA,
  },
});

export function crearDiagramaPlantilla(): Diagrama {
  const nodos: NodoDiagrama[] = [
    crearNodo('inicio', 'inicio', 'Inicio', 40, 40, 120),
    crearNodo('recepcion', 'proceso', 'Recepción de Camión y Verificación de Sellos', 240, 150, 200),
    crearNodo('sellos', 'decision', '¿Sellos Íntegros y Conformes?', 520, 120, 150, 150),
    crearNodo(
      'registrar',
      'proceso',
      'Registrar Incidencia (Guía / Notificar a quien corresponda y dejar constancia parcial/total)',
      800,
      20,
      230,
    ),
    crearNodo('conteo', 'proceso', 'Conteo y Descarga de Cajas en Sitio de Venta', 800, 240, 210),
    crearNodo('confirmacion', 'accion', 'Confirmación Digital de Recepción', 800, 420, 210),
    crearNodo('distribucion', 'proceso', 'Distribución de Palets por Pasillo', 1120, 20, 210),
    crearNodo(
      'reposicion',
      'proceso',
      'Reposición en Anaquel y Fretro (Retiro de Producto Vencido/Dañado)',
      1420,
      20,
      220,
    ),
    crearNodo('actualizacion', 'proceso', 'Actualización y Verificación de Etiquetas de Precio', 1730, 20, 220),
    crearNodo('precios', 'decision', '¿Precios Correctos vs Sistema?', 2060, 0, 150, 150),
    crearNodo('corregir', 'proceso', 'Corregir etiqueta / Actualizar sistema antes de emitir', 1730, 260, 220),
    crearNodo('auditoria', 'proceso', 'Auditoría de Limpieza, Iluminación y Equipos de Frío', 40, 640, 210),
    crearNodo('infra', 'decision', '¿Infraestructura y Frío Conformes?', 330, 660, 150, 150),
    crearNodo('ejecutar', 'proceso', 'Ejecutar Limpieza y/o Solicitar Mantenimiento de Inmediato', 570, 660, 210),
    crearNodo('arqueo', 'proceso', 'Arqueo Inicial y Verificación de POS', 360, 900, 210),
    crearNodo('cajas', 'decision', '¿Cajas Abiertas y POS operativos?', 650, 830, 150, 150),
    crearNodo('resolver', 'proceso', 'Resolver Incidencia de Fondo / Reiniciar Terminal POS', 900, 900, 230),
    crearNodo('habilitacion', 'proceso', 'Habilitación de Puertas y Apertura al Público', 900, 660, 230),
    crearNodo('fin', 'fin', 'Fin del proceso', 1400, 665, 140),
  ];

  const aristas: AristaDiagrama[] = [
    crearArista('a1', 'inicio', 'recepcion', 'right', 'left'),
    crearArista('a2', 'recepcion', 'sellos', 'right', 'left'),
    crearArista('a3', 'sellos', 'registrar', 'top', 'bottom', 'No'),
    crearArista('a4', 'sellos', 'conteo', 'right', 'left', 'Sí'),
    crearArista('a5', 'registrar', 'distribucion', 'right', 'left'),
    crearArista('a6', 'conteo', 'confirmacion', 'bottom', 'top'),
    crearArista('a7', 'confirmacion', 'distribucion', 'right', 'bottom'),
    crearArista('a8', 'distribucion', 'reposicion', 'right', 'left'),
    crearArista('a9', 'reposicion', 'actualizacion', 'right', 'left'),
    crearArista('a10', 'actualizacion', 'precios', 'right', 'left'),
    crearArista('a11', 'precios', 'auditoria', 'bottom', 'top', 'Sí'),
    crearArista('a12', 'precios', 'corregir', 'right', 'right', 'No'),
    crearArista('a13', 'corregir', 'actualizacion', 'top', 'bottom'),
    crearArista('a14', 'auditoria', 'infra', 'right', 'left'),
    crearArista('a15', 'infra', 'arqueo', 'bottom', 'top', 'Sí'),
    crearArista('a16', 'infra', 'ejecutar', 'right', 'left', 'No'),
    crearArista('a17', 'ejecutar', 'auditoria', 'top', 'top'),
    crearArista('a18', 'arqueo', 'cajas', 'right', 'left'),
    crearArista('a19', 'cajas', 'habilitacion', 'right', 'left', 'Sí'),
    crearArista('a20', 'cajas', 'resolver', 'bottom', 'left', 'No'),
    crearArista('a21', 'resolver', 'arqueo', 'bottom', 'bottom'),
    crearArista('a22', 'habilitacion', 'fin', 'right', 'left'),
  ];

  return {
    id: nuevoId('d'),
    nombre: 'Recepción y apertura de tienda',
    nodos,
    aristas,
  };
}
