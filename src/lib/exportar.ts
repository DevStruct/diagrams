import { getNodesBounds, getViewportForBounds, type Node } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { COLOR_FONDO } from '../data/colores';
import type { Diagrama } from '../types';
import type { DiagramaMapa } from '../typesMapa';

function fechaArchivo(): string {
  return new Date().toISOString().slice(0, 10);
}

function nombreSeguro(nombre: string): string {
  const limpio = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return limpio || 'diagrama';
}

function descargarEnlace(url: string, nombre: string): void {
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}

export type FondoPng = 'oscuro' | 'blanco' | 'transparente';

const COLOR_FONDO_PNG: Record<FondoPng, string | undefined> = {
  oscuro: COLOR_FONDO,
  blanco: '#ffffff',
  transparente: undefined,
};

export function esFondoPng(valor: string): valor is FondoPng {
  return valor === 'oscuro' || valor === 'blanco' || valor === 'transparente';
}

export function exportarJson(diagramas: Diagrama[], diagramaActivoId: string): void {
  const contenido = {
    version: 1,
    exportadoEn: new Date().toISOString(),
    diagramas,
    diagramaActivoId,
  };
  const blob = new Blob([JSON.stringify(contenido, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  descargarEnlace(url, `diagramas-${fechaArchivo()}.json`);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportarJsonMapas(mapas: DiagramaMapa[], mapaActivoId: string): void {
  const contenido = {
    version: 1,
    tipo: 'mapas-proceso',
    exportadoEn: new Date().toISOString(),
    mapas,
    mapaActivoId,
  };
  const blob = new Blob([JSON.stringify(contenido, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  descargarEnlace(url, `mapas-proceso-${fechaArchivo()}.json`);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportarPng(
  nodos: Node[],
  nombre: string,
  fondo: FondoPng = 'oscuro',
): Promise<void> {
  if (nodos.length === 0) {
    throw new Error('El diagrama está vacío: añade al menos un nodo antes de exportar.');
  }

  const vista = document.querySelector<HTMLElement>('.react-flow__viewport');
  if (!vista) {
    throw new Error('No se encontró el lienzo para exportar.');
  }

  const limites = getNodesBounds(nodos);
  const ancho = Math.max(Math.ceil(limites.width + 160), 640);
  const alto = Math.max(Math.ceil(limites.height + 160), 480);
  const { x, y, zoom } = getViewportForBounds(limites, ancho, alto, 0.2, 2, 0.1);

  const dataUrl = await toPng(vista, {
    backgroundColor: COLOR_FONDO_PNG[fondo],
    width: ancho,
    height: alto,
    pixelRatio: 2,
    cacheBust: true,
    // Los puntos de conexión, los tiradores de tamaño y el marco de selección
    // son ayuda de edición y no forman parte del diagrama: se excluyen del
    // clon que se rasteriza.
    filter: (domNode) =>
      !domNode.classList?.contains('manija') &&
      !domNode.classList?.contains('react-flow__resize-control') &&
      !domNode.classList?.contains('nodo-mapa__marco'),
    style: {
      width: `${ancho}px`,
      height: `${alto}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
  });

  descargarEnlace(dataUrl, `${nombreSeguro(nombre)}-${fechaArchivo()}.png`);
}
