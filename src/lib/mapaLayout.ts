import type { DiagramaMapa, NivelMapa, NodoMapa } from '../typesMapa';

interface MedidaNivel {
  ancho: number;
  altoMinimo: number;
  caracteresPorLinea: number;
  altoLinea: number;
  rellenoVertical: number;
}

export const MEDIDAS_MAPA: Record<NivelMapa, MedidaNivel> = {
  1: { ancho: 240, altoMinimo: 56, caracteresPorLinea: 27, altoLinea: 15, rellenoVertical: 12 },
  2: { ancho: 162, altoMinimo: 44, caracteresPorLinea: 26, altoLinea: 13, rellenoVertical: 8 },
  3: { ancho: 92, altoMinimo: 46, caracteresPorLinea: 16, altoLinea: 12, rellenoVertical: 6 },
};

export const TAMANO_MINIMO_MAPA: Record<NivelMapa, { ancho: number; alto: number }> = {
  1: { ancho: 140, alto: 44 },
  2: { ancho: 100, alto: 34 },
  3: { ancho: 64, alto: 30 },
};

export const TAMANO_MAXIMO_MAPA = { ancho: 720, alto: 560 };

const SEPARACION_HORIZONTAL = 12;
const SEPARACION_VERTICAL = 42;
const SEPARACION_RAICES = 24;
const MARGEN = 24;

export function altoNodoMapa(nivel: NivelMapa, etiqueta: string): number {
  const medida = MEDIDAS_MAPA[nivel];
  const lineas = etiqueta
    .split('\n')
    .reduce(
      (total, linea) =>
        total + Math.max(1, Math.ceil(linea.length / medida.caracteresPorLinea)),
      0,
    );

  return Math.max(
    medida.altoMinimo,
    lineas * medida.altoLinea + medida.rellenoVertical,
  );
}

export function dimensionesNodoMapa(nodo: NodoMapa): { ancho: number; alto: number } {
  const minimo = TAMANO_MINIMO_MAPA[nodo.nivel];
  return {
    ancho: Math.min(
      TAMANO_MAXIMO_MAPA.ancho,
      Math.max(minimo.ancho, nodo.ancho ?? MEDIDAS_MAPA[nodo.nivel].ancho),
    ),
    alto: Math.min(
      TAMANO_MAXIMO_MAPA.alto,
      Math.max(minimo.alto, nodo.alto ?? altoNodoMapa(nodo.nivel, nodo.etiqueta)),
    ),
  };
}

export interface NodoMapaPosicionado {
  nodo: NodoMapa;
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface AristaMapaLayout {
  id: string;
  source: string;
  target: string;
}

export interface LayoutMapa {
  nodos: NodoMapaPosicionado[];
  aristas: AristaMapaLayout[];
  ancho: number;
  alto: number;
}

const compararOrden = (a: NodoMapa, b: NodoMapa): number =>
  a.orden - b.orden || a.etiqueta.localeCompare(b.etiqueta, 'es');

export function calcularLayoutMapa(diagrama: DiagramaMapa): LayoutMapa {
  if (diagrama.nodos.length === 0) {
    return { nodos: [], aristas: [], ancho: 0, alto: 0 };
  }

  const porId = new Map(diagrama.nodos.map((nodo) => [nodo.id, nodo]));
  const hijos = new Map<string, NodoMapa[]>();
  const raices: NodoMapa[] = [];

  for (const nodo of diagrama.nodos) {
    const padre = nodo.padreId ? porId.get(nodo.padreId) : undefined;
    const padreValido = Boolean(padre && padre.nivel === nodo.nivel - 1);

    if (padreValido && padre) {
      const lista = hijos.get(padre.id) ?? [];
      lista.push(nodo);
      hijos.set(padre.id, lista);
    } else {
      raices.push(nodo);
    }
  }

  for (const lista of hijos.values()) lista.sort(compararOrden);
  raices.sort(compararOrden);

  const medidas = new Map(
    diagrama.nodos.map((nodo) => [nodo.id, dimensionesNodoMapa(nodo)] as const),
  );

  const alturaMaxima: Record<NivelMapa, number> = { 1: 0, 2: 0, 3: 0 };
  for (const nodo of diagrama.nodos) {
    const alto = medidas.get(nodo.id)?.alto ?? 0;
    alturaMaxima[nodo.nivel] = Math.max(alturaMaxima[nodo.nivel], alto);
  }

  const yPorNivel: Record<NivelMapa, number> = {
    1: MARGEN,
    2: MARGEN + alturaMaxima[1] + SEPARACION_VERTICAL,
    3: MARGEN + alturaMaxima[1] + alturaMaxima[2] + SEPARACION_VERTICAL * 2,
  };

  const anchoSubarbol = new Map<string, number>();
  const medirSubarbol = (nodo: NodoMapa): number => {
    const guardado = anchoSubarbol.get(nodo.id);
    if (guardado !== undefined) return guardado;

    const anchoPropio = medidas.get(nodo.id)?.ancho ?? MEDIDAS_MAPA[nodo.nivel].ancho;
    const listaHijos = hijos.get(nodo.id) ?? [];

    let ancho = anchoPropio;
    if (listaHijos.length > 0) {
      const anchoHijos =
        listaHijos.reduce((total, hijo) => total + medirSubarbol(hijo), 0) +
        SEPARACION_HORIZONTAL * (listaHijos.length - 1);
      ancho = Math.max(anchoPropio, anchoHijos);
    }

    anchoSubarbol.set(nodo.id, ancho);
    return ancho;
  };

  for (const raiz of raices) medirSubarbol(raiz);

  const posiciones = new Map<string, { x: number; y: number }>();

  const colocar = (nodo: NodoMapa, izquierda: number) => {
    const ancho = anchoSubarbol.get(nodo.id) ?? medidas.get(nodo.id)?.ancho ?? 0;
    const centro = izquierda + ancho / 2;
    const propia = medidas.get(nodo.id) ?? dimensionesNodoMapa(nodo);

    posiciones.set(
      nodo.id,
      nodo.posicion
        ? { x: nodo.posicion.x, y: nodo.posicion.y }
        : {
            x: Math.round(centro - propia.ancho / 2),
            y: yPorNivel[nodo.nivel],
          },
    );

    const listaHijos = hijos.get(nodo.id) ?? [];
    if (listaHijos.length === 0) return;

    const anchoHijos =
      listaHijos.reduce((total, hijo) => total + medirSubarbol(hijo), 0) +
      SEPARACION_HORIZONTAL * (listaHijos.length - 1);
    let cursor = centro - anchoHijos / 2;

    for (const hijo of listaHijos) {
      colocar(hijo, cursor);
      cursor += medirSubarbol(hijo) + SEPARACION_HORIZONTAL;
    }
  };

  let cursor = MARGEN;
  for (const raiz of raices) {
    colocar(raiz, cursor);
    cursor += medirSubarbol(raiz) + SEPARACION_RAICES;
  }

  const nodos: NodoMapaPosicionado[] = diagrama.nodos.map((nodo) => {
    const posicion = posiciones.get(nodo.id) ?? { x: MARGEN, y: yPorNivel[nodo.nivel] };
    const medida = medidas.get(nodo.id) ?? dimensionesNodoMapa(nodo);

    return {
      nodo,
      x: posicion.x,
      y: posicion.y,
      ancho: medida.ancho,
      alto: medida.alto,
    };
  });

  const aristas: AristaMapaLayout[] = [];
  for (const [padreId, listaHijos] of hijos) {
    for (const hijo of listaHijos) {
      aristas.push({ id: `e-${padreId}-${hijo.id}`, source: padreId, target: hijo.id });
    }
  }

  let ancho = 0;
  let alto = 0;
  for (const nodo of nodos) {
    ancho = Math.max(ancho, nodo.x + nodo.ancho);
    alto = Math.max(alto, nodo.y + nodo.alto);
  }

  return {
    nodos,
    aristas,
    ancho: ancho + MARGEN,
    alto: alto + MARGEN,
  };
}
