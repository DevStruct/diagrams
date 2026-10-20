import type {
  DiagramaMapa,
  EstadoMapasGuardado,
  NivelMapa,
  NodoMapa,
  PosicionMapa,
} from '../typesMapa';
import { nuevoId } from './id';

const CLAVE = 'diagramas-procesos-mapas-v1';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function esNivelMapa(valor: unknown): valor is NivelMapa {
  return valor === 1 || valor === 2 || valor === 3;
}

function normalizarPosicion(valor: unknown): PosicionMapa | undefined {
  if (!esObjeto(valor)) return undefined;
  const { x, y } = valor;
  if (typeof x !== 'number' || typeof y !== 'number') return undefined;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return { x, y };
}

function normalizarMedida(valor: unknown): number | undefined {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    return undefined;
  }
  return valor;
}

function normalizarNodo(entrada: unknown, indice: number): NodoMapa {
  const bruto = esObjeto(entrada) ? entrada : {};
  const nivel = esNivelMapa(bruto.nivel) ? bruto.nivel : 1;
  const posicion = normalizarPosicion(bruto.posicion);
  const ancho = normalizarMedida(bruto.ancho);
  const alto = normalizarMedida(bruto.alto);

  return {
    id: typeof bruto.id === 'string' && bruto.id ? bruto.id : nuevoId('mn'),
    etiqueta:
      typeof bruto.etiqueta === 'string' && bruto.etiqueta.trim()
        ? bruto.etiqueta
        : 'Nodo sin título',
    nivel,
    padreId: typeof bruto.padreId === 'string' && bruto.padreId ? bruto.padreId : null,
    orden: typeof bruto.orden === 'number' ? bruto.orden : indice,
    ...(posicion ? { posicion } : {}),
    ...(ancho !== undefined ? { ancho } : {}),
    ...(alto !== undefined ? { alto } : {}),
  };
}

function normalizarJerarquia(nodos: NodoMapa[]): void {
  const porId = new Map(nodos.map((nodo) => [nodo.id, nodo]));

  for (const nodo of [...nodos].sort((a, b) => a.nivel - b.nivel)) {
    if (nodo.nivel === 1) {
      nodo.padreId = null;
      continue;
    }

    const padre = nodo.padreId ? porId.get(nodo.padreId) : undefined;
    if (!padre || padre.id === nodo.id || padre.nivel !== nodo.nivel - 1) {
      nodo.padreId = null;
      nodo.nivel = 1;
    }
  }

  const grupos = new Map<string | null, NodoMapa[]>();
  for (const nodo of nodos) {
    const clave = nodo.padreId ?? null;
    const grupo = grupos.get(clave) ?? [];
    grupo.push(nodo);
    grupos.set(clave, grupo);
  }

  for (const grupo of grupos.values()) {
    grupo
      .sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id))
      .forEach((nodo, indice) => {
        nodo.orden = indice;
      });
  }
}

function normalizarDiagrama(entrada: unknown, indice: number): DiagramaMapa {
  const bruto = esObjeto(entrada) ? entrada : {};
  const brutoNodos = Array.isArray(bruto.nodos) ? bruto.nodos : [];

  const ids = new Set<string>();
  const nodos: NodoMapa[] = [];

  brutoNodos.forEach((entradaNodo, i) => {
    const nodo = normalizarNodo(entradaNodo, i);
    if (ids.has(nodo.id)) nodo.id = nuevoId('mn');
    ids.add(nodo.id);
    nodos.push(nodo);
  });

  normalizarJerarquia(nodos);

  return {
    id: typeof bruto.id === 'string' ? bruto.id : nuevoId('m'),
    nombre:
      typeof bruto.nombre === 'string' && bruto.nombre.trim()
        ? bruto.nombre
        : `Mapa ${indice + 1}`,
    nodos,
  };
}

export function cargarEstadoMapas(): EstadoMapasGuardado | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;

    const datos: unknown = JSON.parse(crudo);
    if (!esObjeto(datos) || !Array.isArray(datos.mapas) || datos.mapas.length === 0) {
      return null;
    }

    const mapas = datos.mapas.map((mapa, i) => normalizarDiagrama(mapa, i));
    const activoGuardado = typeof datos.mapaActivoId === 'string' ? datos.mapaActivoId : '';
    const mapaActivoId = mapas.some((mapa) => mapa.id === activoGuardado)
      ? activoGuardado
      : mapas[0].id;

    return { mapas, mapaActivoId };
  } catch (error) {
    console.warn('No se pudo leer el estado guardado de los mapas de proceso.', error);
    return null;
  }
}

export function guardarEstadoMapas(estado: EstadoMapasGuardado): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch (error) {
    console.warn('No se pudo guardar el estado de los mapas de proceso.', error);
  }
}

export function mapasDesdeTextoJson(texto: string): DiagramaMapa[] {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  const candidatos: unknown[] = Array.isArray(datos)
    ? datos
    : esObjeto(datos) && Array.isArray(datos.mapas)
      ? datos.mapas
      : [datos];

  const mapas = candidatos
    .map((candidato, i) => normalizarDiagrama(candidato, i))
    .filter((mapa) => mapa.nodos.length > 0);

  if (mapas.length === 0) {
    throw new Error('El archivo no contiene ningún mapa de proceso válido.');
  }

  return mapas;
}

export async function mapasDesdeArchivo(archivo: File): Promise<DiagramaMapa[]> {
  return mapasDesdeTextoJson(await archivo.text());
}
