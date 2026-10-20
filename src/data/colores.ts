import type { TipoNodo } from '../types';

export const TIPOS_NODO: TipoNodo[] = ['inicio', 'proceso', 'decision', 'accion', 'fin'];

export function esTipoNodo(valor: string): valor is TipoNodo {
  return (TIPOS_NODO as string[]).includes(valor);
}

export const ETIQUETAS_TIPO: Record<TipoNodo, string> = {
  inicio: 'Inicio',
  proceso: 'Proceso',
  decision: 'Decisión',
  accion: 'Acción destacada',
  fin: 'Fin',
};

export const ETIQUETAS_NODO_NUEVO: Record<TipoNodo, string> = {
  inicio: 'Inicio',
  proceso: 'Nuevo proceso',
  decision: '¿Decisión?',
  accion: 'Nueva acción',
  fin: 'Fin',
};

export const COLORES_POR_TIPO: Record<TipoNodo, { fondo: string; texto: string }> = {
  inicio: { fondo: '#2e7d32', texto: '#f2fff3' },
  proceso: { fondo: '#2c313a', texto: '#e9edf2' },
  decision: { fondo: '#8a6a00', texto: '#fff8e1' },
  accion: { fondo: '#2f6f6b', texto: '#e9fffb' },
  fin: { fondo: '#8e3b62', texto: '#ffffff' },
};

export interface MuestraColor {
  nombre: string;
  fondo: string;
  texto: string;
}

export const PALETA_NODOS: MuestraColor[] = [
  { nombre: 'Grafito', fondo: '#2c313a', texto: '#e9edf2' },
  { nombre: 'Pizarra', fondo: '#3a4250', texto: '#eef2f8' },
  { nombre: 'Azul', fondo: '#1f3a5f', texto: '#dbe9ff' },
  { nombre: 'Teal', fondo: '#2f6f6b', texto: '#e9fffb' },
  { nombre: 'Ámbar', fondo: '#8a6a00', texto: '#fff8e1' },
  { nombre: 'Oliva', fondo: '#6b5a00', texto: '#f7efc8' },
  { nombre: 'Verde', fondo: '#2e7d32', texto: '#f2fff3' },
  { nombre: 'Vino', fondo: '#8e3b62', texto: '#ffffff' },
];

export const COLOR_FONDO = '#12151a';
export const COLOR_ARISTA = '#a7b0ba';
export const COLOR_SELECCION = '#f0c040';
