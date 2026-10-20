import type { DiagramaMapa, NivelMapa, NodoMapa } from '../typesMapa';
import { parsearMermaid } from './convertidores/mermaid';
import { nuevoId } from './id';

export interface ResultadoMapaMermaid {
  mapa: DiagramaMapa;
  avisos: string[];
}

interface Asignacion {
  nivel: NivelMapa;
  padreId: string | null;
}

const nivelSiguiente = (nivel: NivelMapa): NivelMapa => (nivel === 1 ? 2 : 3);

const unirEtiqueta = (etiqueta: string): string =>
  etiqueta
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean)
    .join(' ');

/**
 * Convierte un flowchart de Mermaid en un mapa de tres niveles.
 * La profundidad del grafo decide el nivel: raíces = proceso, hijos =
 * subproceso y nietos o niveles inferiores = actividad.
 */
export function mapaDesdeMermaid(codigo: string, nombre = ''): ResultadoMapaMermaid {
  const intermedio = parsearMermaid(codigo);

  if (intermedio.nodos.length === 0) {
    throw new Error('No se encontró ningún nodo en el código Mermaid.');
  }

  const avisos = [...intermedio.avisos];
  const ids = new Set(intermedio.nodos.map((nodo) => nodo.id));
  const nodosPorId = new Map(intermedio.nodos.map((nodo) => [nodo.id, nodo] as const));
  const indicePorId = new Map(
    intermedio.nodos.map((nodo, indice) => [nodo.id, indice] as const),
  );

  const hijos = new Map<string, string[]>();
  const padreDe = new Map<string, string>();
  const conVariosPadres = new Set<string>();

  for (const arista of intermedio.aristas) {
    if (arista.invisible) continue;

    const { origen, destino } = arista;
    if (!ids.has(origen) || !ids.has(destino) || origen === destino) continue;

    const lista = hijos.get(origen) ?? [];
    if (!lista.includes(destino)) {
      lista.push(destino);
      hijos.set(origen, lista);
    }

    const padreAnterior = padreDe.get(destino);
    if (padreAnterior && padreAnterior !== origen) {
      conVariosPadres.add(destino);
    } else if (!padreAnterior) {
      padreDe.set(destino, origen);
    }
  }

  let raices = intermedio.nodos
    .filter((nodo) => !padreDe.has(nodo.id))
    .map((nodo) => nodo.id);

  if (raices.length === 0 && intermedio.nodos[0]) {
    raices = [intermedio.nodos[0].id];
  }

  const asignados = new Map<string, Asignacion>();
  const pendientes: { id: string; nivel: NivelMapa; padreId: string | null }[] = raices.map(
    (id) => ({ id, nivel: 1 as NivelMapa, padreId: null }),
  );
  let aplanados = 0;

  while (pendientes.length > 0) {
    const actual = pendientes.shift();
    if (!actual || asignados.has(actual.id)) continue;

    asignados.set(actual.id, { nivel: actual.nivel, padreId: actual.padreId });

    for (const hijo of hijos.get(actual.id) ?? []) {
      if (asignados.has(hijo)) continue;

      if (actual.nivel < 3) {
        pendientes.push({
          id: hijo,
          nivel: nivelSiguiente(actual.nivel),
          padreId: actual.id,
        });
      } else {
        // El mapa solo admite tres niveles: los descendientes de una
        // actividad se aplanan como actividades del mismo subproceso.
        pendientes.push({ id: hijo, nivel: 3, padreId: actual.padreId });
        aplanados++;
      }
    }
  }

  for (const nodo of intermedio.nodos) {
    if (asignados.has(nodo.id)) continue;
    asignados.set(nodo.id, { nivel: 1, padreId: null });
    avisos.push(
      `El nodo «${nodo.etiqueta}» no estaba conectado y se añadió como proceso principal.`,
    );
  }

  if (aplanados > 0) {
    avisos.push(
      `${aplanados} nodo(s) de nivel 4 o superior se aplanaron como actividades del subproceso correspondiente.`,
    );
  }

  if (conVariosPadres.size > 0) {
    avisos.push(
      `${conVariosPadres.size} nodo(s) con varios padres se enlazaron al primero encontrado.`,
    );
  }

  const hermanos = new Map<string | null, string[]>();
  for (const nodo of intermedio.nodos) {
    const asignacion = asignados.get(nodo.id);
    if (!asignacion) continue;
    const lista = hermanos.get(asignacion.padreId) ?? [];
    lista.push(nodo.id);
    hermanos.set(asignacion.padreId, lista);
  }

  const ordenPorId = new Map<string, number>();
  for (const lista of hermanos.values()) {
    lista
      .sort((a, b) => (indicePorId.get(a) ?? 0) - (indicePorId.get(b) ?? 0))
      .forEach((id, indice) => ordenPorId.set(id, indice));
  }

  const nodos: NodoMapa[] = intermedio.nodos.map((nodo) => {
    const asignacion: Asignacion = asignados.get(nodo.id) ?? { nivel: 1, padreId: null };
    return {
      id: nodo.id,
      etiqueta: nodo.etiqueta || nodo.id,
      nivel: asignacion.nivel,
      padreId: asignacion.padreId,
      orden: ordenPorId.get(nodo.id) ?? 0,
    };
  });

  const raizPrincipal = raices[0] ? nodosPorId.get(raices[0]) : undefined;
  const nombreFinal =
    nombre.trim() ||
    intermedio.nombre?.trim() ||
    (raizPrincipal ? unirEtiqueta(raizPrincipal.etiqueta) : '') ||
    'Mapa importado';

  return {
    mapa: {
      id: nuevoId('m'),
      nombre: nombreFinal,
      nodos,
    },
    avisos,
  };
}
