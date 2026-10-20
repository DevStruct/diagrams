import { create } from 'zustand';
import { crearMapaPlantilla } from '../data/plantillaMapa';
import { nuevoId } from '../lib/id';
import { descendientesDe, hijosDe } from '../lib/mapaArbol';
import {
  calcularLayoutMapa,
  TAMANO_MAXIMO_MAPA,
  TAMANO_MINIMO_MAPA,
} from '../lib/mapaLayout';
import { cargarEstadoMapas } from '../lib/persistenciaMapas';
import type {
  DiagramaMapa,
  InstantaneaMapa,
  NivelMapa,
  NodoMapa,
  PosicionMapa,
} from '../typesMapa';

export const ETIQUETAS_NIVEL: Record<NivelMapa, string> = {
  1: 'Proceso',
  2: 'Subproceso',
  3: 'Actividad',
};

const ETIQUETAS_NODO_NUEVO: Record<NivelMapa, string> = {
  1: 'Nuevo proceso',
  2: 'Nuevo subproceso',
  3: 'Nueva actividad',
};

interface EstadoMapas {
  mapas: DiagramaMapa[];
  mapaActivoId: string;
  seleccionadoId: string | null;
  seleccionadosIds: string[];
  pasado: InstantaneaMapa[];
  futuro: InstantaneaMapa[];
  ultimoHistorial: number;
  seleccionarMapa: (id: string) => void;
  crearMapa: () => void;
  renombrarMapa: (id: string, nombre: string) => void;
  eliminarMapa: (id: string) => void;
  importarMapas: (mapas: DiagramaMapa[]) => void;
  seleccionarNodo: (id: string | null) => void;
  cambiarSeleccionNodo: (id: string, seleccionado: boolean) => void;
  agregarNodo: (nivel: NivelMapa, padreId?: string | null) => void;
  agregarHermano: (id: string) => void;
  actualizarNodo: (id: string, etiqueta: string) => void;
  moverNodo: (id: string, direccion: -1 | 1) => void;
  posicionarNodo: (id: string, posicion: PosicionMapa) => void;
  redimensionarNodo: (id: string, ancho: number, alto: number) => void;
  iniciarEdicionManual: () => void;
  eliminarNodo: (id: string) => void;
  eliminarNodos: (ids: string[]) => void;
  deshacer: () => void;
  rehacer: () => void;
}

const clonar = <T,>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;

const mapaActivo = (estado: EstadoMapas): DiagramaMapa | undefined =>
  estado.mapas.find((mapa) => mapa.id === estado.mapaActivoId);

const instantaneaActual = (estado: EstadoMapas): InstantaneaMapa => {
  const mapa = mapaActivo(estado);
  return { nodos: clonar(mapa?.nodos ?? []) };
};

const reemplazarMapa = (mapas: DiagramaMapa[], actualizado: DiagramaMapa): DiagramaMapa[] =>
  mapas.map((mapa) => (mapa.id === actualizado.id ? actualizado : mapa));

const registrarSnapshot = (estado: EstadoMapas, forzar: boolean): Partial<EstadoMapas> => {
  const ahora = Date.now();

  // Las ediciones de texto se agrupan durante 700 ms para que un solo Ctrl+Z
  // no deshaga letra por letra.
  if (!forzar && ahora - estado.ultimoHistorial < 700) {
    return { futuro: [], ultimoHistorial: ahora };
  }

  return {
    pasado: [...estado.pasado.slice(-49), instantaneaActual(estado)],
    futuro: [],
    ultimoHistorial: forzar ? 0 : ahora,
  };
};

const eliminarNodosDelMapa = (
  estado: EstadoMapas,
  ids: string[],
): Partial<EstadoMapas> => {
  const mapa = mapaActivo(estado);
  if (!mapa) return {};

  const existentes = new Set(
    ids.filter((id) => mapa.nodos.some((nodo) => nodo.id === id)),
  );
  if (existentes.size === 0) return {};

  const aEliminar = new Set(existentes);
  for (const id of existentes) {
    for (const descendiente of descendientesDe(mapa.nodos, id)) {
      aEliminar.add(descendiente.id);
    }
  }

  const seleccionadosIds = estado.seleccionadosIds.filter(
    (id) => !aEliminar.has(id),
  );

  return {
    ...registrarSnapshot(estado, true),
    seleccionadoId: seleccionadosIds[seleccionadosIds.length - 1] ?? null,
    seleccionadosIds,
    mapas: reemplazarMapa(estado.mapas, {
      ...mapa,
      nodos: mapa.nodos.filter((nodo) => !aEliminar.has(nodo.id)),
    }),
  };
};

const estadoGuardado = cargarEstadoMapas();
const mapasIniciales: DiagramaMapa[] =
  estadoGuardado && estadoGuardado.mapas.length > 0
    ? estadoGuardado.mapas
    : [crearMapaPlantilla()];
const mapaActivoInicial =
  estadoGuardado && mapasIniciales.some((mapa) => mapa.id === estadoGuardado.mapaActivoId)
    ? estadoGuardado.mapaActivoId
    : mapasIniciales[0].id;

export const useMapaStore = create<EstadoMapas>((set) => ({
  mapas: mapasIniciales,
  mapaActivoId: mapaActivoInicial,
  seleccionadoId: null,
  seleccionadosIds: [],
  pasado: [],
  futuro: [],
  ultimoHistorial: 0,

  seleccionarMapa: (id) =>
    set((estado) => {
      if (id === estado.mapaActivoId) return {};
      if (!estado.mapas.some((mapa) => mapa.id === id)) return {};
      return {
        mapaActivoId: id,
        seleccionadoId: null,
        seleccionadosIds: [],
        pasado: [],
        futuro: [],
        ultimoHistorial: 0,
      };
    }),

  crearMapa: () =>
    set((estado) => {
      const nuevo: DiagramaMapa = {
        id: nuevoId('m'),
        nombre: `Mapa ${estado.mapas.length + 1}`,
        nodos: [],
      };
      return {
        mapas: [...estado.mapas, nuevo],
        mapaActivoId: nuevo.id,
        seleccionadoId: null,
        seleccionadosIds: [],
        pasado: [],
        futuro: [],
        ultimoHistorial: 0,
      };
    }),

  renombrarMapa: (id, nombre) =>
    set((estado) => ({
      mapas: estado.mapas.map((mapa) => (mapa.id === id ? { ...mapa, nombre } : mapa)),
    })),

  eliminarMapa: (id) =>
    set((estado) => {
      const restantes = estado.mapas.filter((mapa) => mapa.id !== id);
      if (restantes.length === 0) {
        const nuevo: DiagramaMapa = {
          id: nuevoId('m'),
          nombre: 'Mapa sin título',
          nodos: [],
        };
        return {
          mapas: [nuevo],
          mapaActivoId: nuevo.id,
          seleccionadoId: null,
          seleccionadosIds: [],
          pasado: [],
          futuro: [],
          ultimoHistorial: 0,
        };
      }

      const conservarActivo = estado.mapaActivoId !== id;
      return {
        mapas: restantes,
        mapaActivoId: conservarActivo ? estado.mapaActivoId : restantes[0].id,
        seleccionadoId: conservarActivo ? estado.seleccionadoId : null,
        seleccionadosIds: conservarActivo ? estado.seleccionadosIds : [],
        pasado: [],
        futuro: [],
        ultimoHistorial: 0,
      };
    }),

  importarMapas: (importados) =>
    set((estado) => {
      if (importados.length === 0) return {};

      const nombres = new Set(estado.mapas.map((mapa) => mapa.nombre));
      const nuevos = importados.map((mapa, indice) => {
        let nombre = mapa.nombre.trim() || `Mapa importado ${indice + 1}`;
        while (nombres.has(nombre)) {
          nombre = `${nombre} (copia)`;
        }
        nombres.add(nombre);

        return {
          ...mapa,
          id: nuevoId('m'),
          nombre,
          nodos: clonar(mapa.nodos),
        };
      });

      return {
        mapas: [...estado.mapas, ...nuevos],
        mapaActivoId: nuevos[0].id,
        seleccionadoId: null,
        seleccionadosIds: [],
        pasado: [],
        futuro: [],
        ultimoHistorial: 0,
      };
    }),

  seleccionarNodo: (id) =>
    set((estado) => {
      if (id === null) {
        if (estado.seleccionadoId === null && estado.seleccionadosIds.length === 0) {
          return {};
        }
        return { seleccionadoId: null, seleccionadosIds: [] };
      }

      const mapa = mapaActivo(estado);
      if (!mapa || !mapa.nodos.some((nodo) => nodo.id === id)) return {};
      if (estado.seleccionadoId === id && estado.seleccionadosIds.length === 1) {
        return {};
      }

      return { seleccionadoId: id, seleccionadosIds: [id] };
    }),

  cambiarSeleccionNodo: (id, seleccionado) =>
    set((estado) => {
      const mapa = mapaActivo(estado);
      if (!mapa || !mapa.nodos.some((nodo) => nodo.id === id)) return {};

      const yaSeleccionado = estado.seleccionadosIds.includes(id);
      if (seleccionado === yaSeleccionado) return {};

      const seleccionadosIds = seleccionado
        ? [...estado.seleccionadosIds, id]
        : estado.seleccionadosIds.filter((actual) => actual !== id);

      return {
        seleccionadosIds,
        seleccionadoId: seleccionadosIds[seleccionadosIds.length - 1] ?? null,
      };
    }),

  agregarNodo: (nivel, padreId) =>
    set((estado) => {
      const mapa = mapaActivo(estado);
      if (!mapa) return {};

      const padre =
        nivel === 1 || !padreId ? undefined : mapa.nodos.find((nodo) => nodo.id === padreId);
      if (nivel > 1 && (!padre || padre.nivel !== nivel - 1)) return {};

      const hermanos = hijosDe(mapa.nodos, nivel === 1 ? null : padre?.id ?? null);
      const orden =
        hermanos.length === 0 ? 0 : Math.max(...hermanos.map((nodo) => nodo.orden)) + 1;

      const nodo: NodoMapa = {
        id: nuevoId('mn'),
        etiqueta: ETIQUETAS_NODO_NUEVO[nivel],
        nivel,
        padreId: nivel === 1 ? null : padre?.id ?? null,
        orden,
      };

      const historial = registrarSnapshot(estado, true);
      return {
        ...historial,
        seleccionadoId: nodo.id,
        seleccionadosIds: [nodo.id],
        mapas: reemplazarMapa(estado.mapas, {
          ...mapa,
          nodos: [...mapa.nodos, nodo],
        }),
      };
    }),

  agregarHermano: (id) =>
    set((estado) => {
      const mapa = mapaActivo(estado);
      const original = mapa?.nodos.find((nodo) => nodo.id === id);
      if (!mapa || !original) return {};

      const hermanos = hijosDe(mapa.nodos, original.padreId);
      const indice = hermanos.findIndex((nodo) => nodo.id === id);
      const nodo: NodoMapa = {
        id: nuevoId('mn'),
        etiqueta: ETIQUETAS_NODO_NUEVO[original.nivel],
        nivel: original.nivel,
        padreId: original.padreId,
        orden: indice + 1,
      };

      const reordenados = [...hermanos];
      reordenados.splice(indice + 1, 0, nodo);
      const ordenPorId = new Map(reordenados.map((hermano, i) => [hermano.id, i] as const));

      const nodos: NodoMapa[] = [
        ...mapa.nodos.map((existente) => {
          const orden = ordenPorId.get(existente.id);
          return orden === undefined ? existente : { ...existente, orden };
        }),
        { ...nodo, orden: ordenPorId.get(nodo.id) ?? nodo.orden },
      ];

      const historial = registrarSnapshot(estado, true);
      return {
        ...historial,
        seleccionadoId: nodo.id,
        seleccionadosIds: [nodo.id],
        mapas: reemplazarMapa(estado.mapas, { ...mapa, nodos }),
      };
    }),

  actualizarNodo: (id, etiqueta) =>
    set((estado) => {
      const mapa = mapaActivo(estado);
      if (!mapa) return {};

      const historial = registrarSnapshot(estado, false);
      const nodos = mapa.nodos.map((nodo) =>
        nodo.id === id ? { ...nodo, etiqueta } : nodo,
      );

      return {
        ...historial,
        mapas: reemplazarMapa(estado.mapas, { ...mapa, nodos }),
      };
    }),

  moverNodo: (id, direccion) =>
    set((estado) => {
      const mapa = mapaActivo(estado);
      const original = mapa?.nodos.find((nodo) => nodo.id === id);
      if (!mapa || !original) return {};

      const hermanos = hijosDe(mapa.nodos, original.padreId);
      const indice = hermanos.findIndex((nodo) => nodo.id === id);
      const destino = indice + direccion;
      if (indice < 0 || destino < 0 || destino >= hermanos.length) return {};

      const reordenados = [...hermanos];
      [reordenados[indice], reordenados[destino]] = [reordenados[destino], reordenados[indice]];
      const ordenPorId = new Map(reordenados.map((nodo, i) => [nodo.id, i] as const));
      const nodos = mapa.nodos.map((nodo) => {
        const orden = ordenPorId.get(nodo.id);
        return orden === undefined ? nodo : { ...nodo, orden };
      });

      const historial = registrarSnapshot(estado, true);
      return {
        ...historial,
        mapas: reemplazarMapa(estado.mapas, { ...mapa, nodos }),
      };
    }),

  posicionarNodo: (id, posicion) =>
    set((estado) => {
      const mapa = mapaActivo(estado);
      const nodo = mapa?.nodos.find((actual) => actual.id === id);
      if (!mapa || !nodo) return {};

      const x = Math.round(posicion.x);
      const y = Math.round(posicion.y);
      if (nodo.posicion?.x === x && nodo.posicion?.y === y) return {};

      return {
        mapas: reemplazarMapa(estado.mapas, {
          ...mapa,
          nodos: mapa.nodos.map((actual) =>
            actual.id === id ? { ...actual, posicion: { x, y } } : actual,
          ),
        }),
      };
    }),

  redimensionarNodo: (id, ancho, alto) =>
    set((estado) => {
      const mapa = mapaActivo(estado);
      const nodo = mapa?.nodos.find((actual) => actual.id === id);
      if (!mapa || !nodo || !Number.isFinite(ancho) || !Number.isFinite(alto)) {
        return {};
      }

      const minimo = TAMANO_MINIMO_MAPA[nodo.nivel];
      const nuevoAncho = Math.min(
        TAMANO_MAXIMO_MAPA.ancho,
        Math.max(minimo.ancho, Math.round(ancho)),
      );
      const nuevoAlto = Math.min(
        TAMANO_MAXIMO_MAPA.alto,
        Math.max(minimo.alto, Math.round(alto)),
      );
      if (nodo.ancho === nuevoAncho && nodo.alto === nuevoAlto) return {};

      return {
        mapas: reemplazarMapa(estado.mapas, {
          ...mapa,
          nodos: mapa.nodos.map((actual) =>
            actual.id === id
              ? { ...actual, ancho: nuevoAncho, alto: nuevoAlto }
              : actual,
          ),
        }),
      };
    }),

  // Fija las posiciones actuales de todos los nodos antes de mover o
  // redimensionar, para que la distribución automática no desplace el resto.
  iniciarEdicionManual: () =>
    set((estado) => {
      const mapa = mapaActivo(estado);
      if (!mapa) return {};

      const layout = calcularLayoutMapa(mapa);
      const posiciones = new Map(
        layout.nodos.map(({ nodo, x, y }) => [nodo.id, { x, y }] as const),
      );
      const nodos = mapa.nodos.map((nodo) =>
        nodo.posicion
          ? nodo
          : { ...nodo, posicion: posiciones.get(nodo.id) ?? { x: 0, y: 0 } },
      );

      return {
        ...registrarSnapshot(estado, true),
        mapas: reemplazarMapa(estado.mapas, { ...mapa, nodos }),
      };
    }),

  eliminarNodo: (id) => set((estado) => eliminarNodosDelMapa(estado, [id])),

  eliminarNodos: (ids) => set((estado) => eliminarNodosDelMapa(estado, ids)),

  deshacer: () =>
    set((estado) => {
      const anterior = estado.pasado[estado.pasado.length - 1];
      const mapa = mapaActivo(estado);
      if (!anterior || !mapa) return {};

      return {
        mapas: reemplazarMapa(estado.mapas, {
          ...mapa,
          nodos: clonar(anterior.nodos),
        }),
        seleccionadoId: null,
        seleccionadosIds: [],
        pasado: estado.pasado.slice(0, -1),
        futuro: [...estado.futuro, instantaneaActual(estado)],
        ultimoHistorial: 0,
      };
    }),

  rehacer: () =>
    set((estado) => {
      const siguiente = estado.futuro[estado.futuro.length - 1];
      const mapa = mapaActivo(estado);
      if (!siguiente || !mapa) return {};

      return {
        mapas: reemplazarMapa(estado.mapas, {
          ...mapa,
          nodos: clonar(siguiente.nodos),
        }),
        seleccionadoId: null,
        seleccionadosIds: [],
        pasado: [...estado.pasado, instantaneaActual(estado)],
        futuro: estado.futuro.slice(0, -1),
        ultimoHistorial: 0,
      };
    }),
}));
