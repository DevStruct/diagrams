import {
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import { create } from 'zustand';
import { COLOR_ARISTA, COLORES_POR_TIPO, ETIQUETAS_NODO_NUEVO } from '../data/colores';
import { crearDiagramaPlantilla } from '../data/plantillaFlujo';
import { cargarEstado } from '../lib/persistencia';
import { nuevoId } from '../lib/id';
import type {
  AristaDiagrama,
  DatosNodo,
  Diagrama,
  Instantanea,
  NodoDiagrama,
  TipoNodo,
} from '../types';

interface EstadoDiagramas {
  diagramas: Diagrama[];
  diagramaActivoId: string;
  pasado: Instantanea[];
  futuro: Instantanea[];
  ultimoHistorial: number;
  onNodesChange: (cambios: NodeChange<NodoDiagrama>[]) => void;
  onEdgesChange: (cambios: EdgeChange<AristaDiagrama>[]) => void;
  onConnect: (conexion: Connection) => void;
  registrarHistorial: () => void;
  agregarNodo: (tipo: TipoNodo, posicion: { x: number; y: number }) => void;
  actualizarNodo: (id: string, cambios: Partial<DatosNodo>) => void;
  duplicarNodo: (id: string) => void;
  eliminarNodo: (id: string) => void;
  actualizarEtiquetaArista: (id: string, etiqueta: string) => void;
  eliminarArista: (id: string) => void;
  limpiarSeleccion: () => void;
  seleccionarDiagrama: (id: string) => void;
  crearDiagrama: () => void;
  renombrarDiagrama: (id: string, nombre: string) => void;
  eliminarDiagrama: (id: string) => void;
  importarDiagramas: (diagramas: Diagrama[]) => void;
  deshacer: () => void;
  rehacer: () => void;
}

const clonar = <T,>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;

const diagramaActivo = (estado: EstadoDiagramas): Diagrama | undefined =>
  estado.diagramas.find((diagrama) => diagrama.id === estado.diagramaActivoId);

const instantaneaActual = (estado: EstadoDiagramas): Instantanea => {
  const diagrama = diagramaActivo(estado);
  return {
    nodos: clonar(diagrama?.nodos ?? []),
    aristas: clonar(diagrama?.aristas ?? []),
  };
};

const registrarSnapshot = (estado: EstadoDiagramas, forzar: boolean): Partial<EstadoDiagramas> => {
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

const reemplazarDiagrama = (diagramas: Diagrama[], actualizado: Diagrama): Diagrama[] =>
  diagramas.map((diagrama) => (diagrama.id === actualizado.id ? actualizado : diagrama));

const estadoGuardado = cargarEstado();
const diagramasIniciales = estadoGuardado?.diagramas.length
  ? estadoGuardado.diagramas
  : [crearDiagramaPlantilla()];
const diagramaActivoInicial =
  estadoGuardado && diagramasIniciales.some((d) => d.id === estadoGuardado.diagramaActivoId)
    ? estadoGuardado.diagramaActivoId
    : diagramasIniciales[0].id;

export const useDiagramStore = create<EstadoDiagramas>((set) => ({
  diagramas: diagramasIniciales,
  diagramaActivoId: diagramaActivoInicial,
  pasado: [],
  futuro: [],
  ultimoHistorial: 0,

  onNodesChange: (cambios) =>
    set((estado) => {
      const diagrama = diagramaActivo(estado);
      if (!diagrama) return {};

      const hayBorrado = cambios.some(
        (cambio) =>
          cambio.type === 'remove' && diagrama.nodos.some((nodo) => nodo.id === cambio.id),
      );
      const historial = hayBorrado ? registrarSnapshot(estado, true) : {};
      const nodos = applyNodeChanges<NodoDiagrama>(cambios, diagrama.nodos);
      let aristas = diagrama.aristas;

      if (hayBorrado) {
        const eliminados = new Set(
          cambios.flatMap((cambio) => (cambio.type === 'remove' ? [cambio.id] : [])),
        );
        aristas = aristas.filter(
          (arista) => !eliminados.has(arista.source) && !eliminados.has(arista.target),
        );
      }

      return {
        ...historial,
        diagramas: reemplazarDiagrama(estado.diagramas, { ...diagrama, nodos, aristas }),
      };
    }),

  onEdgesChange: (cambios) =>
    set((estado) => {
      const diagrama = diagramaActivo(estado);
      if (!diagrama) return {};

      const hayBorrado = cambios.some(
        (cambio) =>
          cambio.type === 'remove' && diagrama.aristas.some((arista) => arista.id === cambio.id),
      );
      const historial = hayBorrado ? registrarSnapshot(estado, true) : {};
      const aristas = applyEdgeChanges<AristaDiagrama>(cambios, diagrama.aristas);

      return {
        ...historial,
        diagramas: reemplazarDiagrama(estado.diagramas, { ...diagrama, aristas }),
      };
    }),

  onConnect: (conexion) =>
    set((estado) => {
      const diagrama = diagramaActivo(estado);
      if (!diagrama || !conexion.source || !conexion.target) return {};

      const historial = registrarSnapshot(estado, true);
      const arista: AristaDiagrama = {
        id: nuevoId('a'),
        source: conexion.source,
        target: conexion.target,
        sourceHandle: conexion.sourceHandle,
        targetHandle: conexion.targetHandle,
        type: 'etiqueta',
        label: '',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: COLOR_ARISTA,
        },
      };

      return {
        ...historial,
        diagramas: reemplazarDiagrama(estado.diagramas, {
          ...diagrama,
          aristas: [...diagrama.aristas, arista],
        }),
      };
    }),

  registrarHistorial: () => set((estado) => registrarSnapshot(estado, true)),

  agregarNodo: (tipo, posicion) =>
    set((estado) => {
      const diagrama = diagramaActivo(estado);
      if (!diagrama) return {};

      const historial = registrarSnapshot(estado, true);
      const colores = COLORES_POR_TIPO[tipo];
      const ancho = tipo === 'decision' ? 150 : tipo === 'inicio' || tipo === 'fin' ? 120 : 190;
      const nodo: NodoDiagrama = {
        id: nuevoId('n'),
        type: 'nodo',
        position: { x: Math.round(posicion.x), y: Math.round(posicion.y) },
        data: {
          etiqueta: ETIQUETAS_NODO_NUEVO[tipo],
          tipo,
          color: colores.fondo,
          colorTexto: colores.texto,
        },
        style:
          tipo === 'decision'
            ? { width: ancho, height: ancho }
            : { width: ancho },
        selected: true,
      };

      return {
        ...historial,
        diagramas: reemplazarDiagrama(estado.diagramas, {
          ...diagrama,
          nodos: [...diagrama.nodos.map((n) => ({ ...n, selected: false })), nodo],
        }),
      };
    }),

  actualizarNodo: (id, cambios) =>
    set((estado) => {
      const diagrama = diagramaActivo(estado);
      if (!diagrama) return {};

      const historial = registrarSnapshot(estado, false);
      const nodos = diagrama.nodos.map((nodo) =>
        nodo.id === id ? { ...nodo, data: { ...nodo.data, ...cambios } } : nodo,
      );

      return {
        ...historial,
        diagramas: reemplazarDiagrama(estado.diagramas, { ...diagrama, nodos }),
      };
    }),

  duplicarNodo: (id) =>
    set((estado) => {
      const diagrama = diagramaActivo(estado);
      const original = diagrama?.nodos.find((nodo) => nodo.id === id);
      if (!diagrama || !original) return {};

      const historial = registrarSnapshot(estado, true);
      const copia: NodoDiagrama = {
        ...clonar(original),
        id: nuevoId('n'),
        position: {
          x: original.position.x + 40,
          y: original.position.y + 40,
        },
        selected: true,
      };
      const nodos: NodoDiagrama[] = [
        ...diagrama.nodos.map((nodo) => ({ ...nodo, selected: false })),
        copia,
      ];

      return {
        ...historial,
        diagramas: reemplazarDiagrama(estado.diagramas, { ...diagrama, nodos }),
      };
    }),

  eliminarNodo: (id) =>
    set((estado) => {
      const diagrama = diagramaActivo(estado);
      if (!diagrama) return {};

      const historial = registrarSnapshot(estado, true);
      const nodos = diagrama.nodos.filter((nodo) => nodo.id !== id);
      const aristas = diagrama.aristas.filter(
        (arista) => arista.source !== id && arista.target !== id,
      );

      return {
        ...historial,
        diagramas: reemplazarDiagrama(estado.diagramas, { ...diagrama, nodos, aristas }),
      };
    }),

  actualizarEtiquetaArista: (id, etiqueta) =>
    set((estado) => {
      const diagrama = diagramaActivo(estado);
      if (!diagrama) return {};

      const historial = registrarSnapshot(estado, false);
      const aristas = diagrama.aristas.map((arista) =>
        arista.id === id ? { ...arista, label: etiqueta } : arista,
      );

      return {
        ...historial,
        diagramas: reemplazarDiagrama(estado.diagramas, { ...diagrama, aristas }),
      };
    }),

  eliminarArista: (id) =>
    set((estado) => {
      const diagrama = diagramaActivo(estado);
      if (!diagrama) return {};

      const historial = registrarSnapshot(estado, true);
      const aristas = diagrama.aristas.filter((arista) => arista.id !== id);

      return {
        ...historial,
        diagramas: reemplazarDiagrama(estado.diagramas, { ...diagrama, aristas }),
      };
    }),

  limpiarSeleccion: () =>
    set((estado) => {
      const diagrama = diagramaActivo(estado);
      if (!diagrama) return {};

      return {
        diagramas: reemplazarDiagrama(estado.diagramas, {
          ...diagrama,
          nodos: diagrama.nodos.map((nodo) => ({ ...nodo, selected: false })),
          aristas: diagrama.aristas.map((arista) => ({ ...arista, selected: false })),
        }),
      };
    }),

  seleccionarDiagrama: (id) =>
    set((estado) => {
      if (id === estado.diagramaActivoId) return {};
      if (!estado.diagramas.some((diagrama) => diagrama.id === id)) return {};
      return {
        diagramaActivoId: id,
        pasado: [],
        futuro: [],
        ultimoHistorial: 0,
      };
    }),

  crearDiagrama: () =>
    set((estado) => {
      const nuevo: Diagrama = {
        id: nuevoId('d'),
        nombre: `Diagrama ${estado.diagramas.length + 1}`,
        nodos: [],
        aristas: [],
      };
      return {
        diagramas: [...estado.diagramas, nuevo],
        diagramaActivoId: nuevo.id,
        pasado: [],
        futuro: [],
        ultimoHistorial: 0,
      };
    }),

  renombrarDiagrama: (id, nombre) =>
    set((estado) => ({
      diagramas: estado.diagramas.map((diagrama) =>
        diagrama.id === id ? { ...diagrama, nombre } : diagrama,
      ),
    })),

  eliminarDiagrama: (id) =>
    set((estado) => {
      const restantes = estado.diagramas.filter((diagrama) => diagrama.id !== id);
      if (restantes.length === 0) {
        const nuevo: Diagrama = {
          id: nuevoId('d'),
          nombre: 'Diagrama sin título',
          nodos: [],
          aristas: [],
        };
        return {
          diagramas: [nuevo],
          diagramaActivoId: nuevo.id,
          pasado: [],
          futuro: [],
          ultimoHistorial: 0,
        };
      }

      const conservarActivo = estado.diagramaActivoId !== id;
      return {
        diagramas: restantes,
        diagramaActivoId: conservarActivo ? estado.diagramaActivoId : restantes[0].id,
        pasado: [],
        futuro: [],
        ultimoHistorial: 0,
      };
    }),

  importarDiagramas: (importados) =>
    set((estado) => {
      if (importados.length === 0) return {};

      const nombres = new Set(estado.diagramas.map((diagrama) => diagrama.nombre));
      const nuevos = importados.map((diagrama, indice) => {
        let nombre = diagrama.nombre.trim() || `Diagrama importado ${indice + 1}`;
        while (nombres.has(nombre)) {
          nombre = `${nombre} (copia)`;
        }
        nombres.add(nombre);

        return {
          ...diagrama,
          id: nuevoId('d'),
          nombre,
          nodos: clonar(diagrama.nodos),
          aristas: clonar(diagrama.aristas),
        };
      });

      return {
        diagramas: [...estado.diagramas, ...nuevos],
        diagramaActivoId: nuevos[0].id,
        pasado: [],
        futuro: [],
        ultimoHistorial: 0,
      };
    }),

  deshacer: () =>
    set((estado) => {
      const anterior = estado.pasado[estado.pasado.length - 1];
      const diagrama = diagramaActivo(estado);
      if (!anterior || !diagrama) return {};

      return {
        diagramas: reemplazarDiagrama(estado.diagramas, {
          ...diagrama,
          nodos: clonar(anterior.nodos),
          aristas: clonar(anterior.aristas),
        }),
        pasado: estado.pasado.slice(0, -1),
        futuro: [...estado.futuro, instantaneaActual(estado)],
        ultimoHistorial: 0,
      };
    }),

  rehacer: () =>
    set((estado) => {
      const siguiente = estado.futuro[estado.futuro.length - 1];
      const diagrama = diagramaActivo(estado);
      if (!siguiente || !diagrama) return {};

      return {
        diagramas: reemplazarDiagrama(estado.diagramas, {
          ...diagrama,
          nodos: clonar(siguiente.nodos),
          aristas: clonar(siguiente.aristas),
        }),
        pasado: [...estado.pasado, instantaneaActual(estado)],
        futuro: estado.futuro.slice(0, -1),
        ultimoHistorial: 0,
      };
    }),
}));
