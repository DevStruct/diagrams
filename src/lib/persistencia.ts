import type { CSSProperties } from 'react';
import { MarkerType } from '@xyflow/react';
import type { AristaDiagrama, Diagrama, EstadoGuardado, NodoDiagrama, TipoNodo } from '../types';
import { COLOR_ARISTA, COLORES_POR_TIPO, TIPOS_NODO } from '../data/colores';
import { nuevoId } from './id';

const CLAVE = 'diagramas-procesos-v1';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function normalizarNodo(entrada: unknown, indice: number): NodoDiagrama {
  const bruto = esObjeto(entrada) ? entrada : {};
  const datos = esObjeto(bruto.data) ? bruto.data : {};
  const posicion = esObjeto(bruto.position) ? bruto.position : {};

  const tipo: TipoNodo =
    typeof datos.tipo === 'string' && (TIPOS_NODO as string[]).includes(datos.tipo)
      ? (datos.tipo as TipoNodo)
      : 'proceso';
  const colores = COLORES_POR_TIPO[tipo];

  const anchoPorTipo = tipo === 'decision' ? 150 : tipo === 'inicio' || tipo === 'fin' ? 120 : 190;
  const estilo: CSSProperties = {};
  if (esObjeto(bruto.style)) {
    const ancho = bruto.style.width;
    const alto = bruto.style.height;
    if (typeof ancho === 'number' || typeof ancho === 'string') estilo.width = ancho;
    if (typeof alto === 'number' || typeof alto === 'string') estilo.height = alto;
  }
  if (estilo.width === undefined) estilo.width = anchoPorTipo;
  if (tipo === 'decision' && estilo.height === undefined) estilo.height = anchoPorTipo;

  return {
    id: typeof bruto.id === 'string' ? bruto.id : nuevoId('n'),
    type: 'nodo',
    position: {
      x: typeof posicion.x === 'number' ? posicion.x : indice * 240,
      y: typeof posicion.y === 'number' ? posicion.y : 0,
    },
    data: {
      etiqueta: typeof datos.etiqueta === 'string' ? datos.etiqueta : 'Nodo',
      tipo,
      color: typeof datos.color === 'string' ? datos.color : colores.fondo,
      colorTexto: typeof datos.colorTexto === 'string' ? datos.colorTexto : colores.texto,
    },
    style: estilo,
    selected: false,
  };
}

function normalizarArista(entrada: unknown, indice: number): AristaDiagrama {
  const bruto = esObjeto(entrada) ? entrada : {};
  return {
    id: typeof bruto.id === 'string' ? bruto.id : nuevoId('a'),
    source: typeof bruto.source === 'string' ? bruto.source : '',
    target: typeof bruto.target === 'string' ? bruto.target : '',
    sourceHandle: typeof bruto.sourceHandle === 'string' ? bruto.sourceHandle : null,
    targetHandle: typeof bruto.targetHandle === 'string' ? bruto.targetHandle : null,
    type: 'etiqueta',
    label: typeof bruto.label === 'string' ? bruto.label : '',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: COLOR_ARISTA,
    },
    selected: false,
    ariaLabel: `Conexión ${indice + 1}`,
  };
}

function normalizarDiagrama(entrada: unknown, indice: number): Diagrama {
  const bruto = esObjeto(entrada) ? entrada : {};
  const nodos = Array.isArray(bruto.nodos)
    ? bruto.nodos.map((nodo, i) => normalizarNodo(nodo, i))
    : [];
  const ids = new Set(nodos.map((nodo) => nodo.id));
  const aristas = Array.isArray(bruto.aristas)
    ? bruto.aristas
        .map((arista, i) => normalizarArista(arista, i))
        .filter((arista) => arista.source && arista.target && ids.has(arista.source) && ids.has(arista.target))
    : [];

  return {
    id: typeof bruto.id === 'string' ? bruto.id : nuevoId('d'),
    nombre:
      typeof bruto.nombre === 'string' && bruto.nombre.trim()
        ? bruto.nombre
        : `Diagrama ${indice + 1}`,
    nodos,
    aristas,
  };
}

export function cargarEstado(): EstadoGuardado | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;

    const datos: unknown = JSON.parse(crudo);
    if (!esObjeto(datos) || !Array.isArray(datos.diagramas) || datos.diagramas.length === 0) {
      return null;
    }

    const diagramas = datos.diagramas.map((diagrama, i) => normalizarDiagrama(diagrama, i));
    const activoGuardado = typeof datos.diagramaActivoId === 'string' ? datos.diagramaActivoId : '';
    const diagramaActivoId = diagramas.some((d) => d.id === activoGuardado)
      ? activoGuardado
      : diagramas[0].id;

    return { diagramas, diagramaActivoId };
  } catch (error) {
    console.warn('No se pudo leer el estado guardado del navegador.', error);
    return null;
  }
}

export function guardarEstado(estado: EstadoGuardado): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch (error) {
    console.warn('No se pudo guardar el estado en el navegador.', error);
  }
}

export function diagramasDesdeTextoJson(texto: string): Diagrama[] {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  const candidatos: unknown[] = Array.isArray(datos)
    ? datos
    : esObjeto(datos) && Array.isArray(datos.diagramas)
      ? datos.diagramas
      : [datos];

  const diagramas = candidatos
    .map((candidato, i) => normalizarDiagrama(candidato, i))
    .filter((diagrama) => diagrama.nodos.length > 0);

  if (diagramas.length === 0) {
    throw new Error('El archivo no contiene ningún diagrama válido.');
  }

  return diagramas;
}

export async function leerDiagramasDeArchivo(archivo: File): Promise<Diagrama[]> {
  return diagramasDesdeTextoJson(await archivo.text());
}
