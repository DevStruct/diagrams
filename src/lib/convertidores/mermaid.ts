import type { TipoNodo } from '../../types';
import type { AristaIntermedia, DiagramaIntermedio, DireccionMermaid, NodoIntermedio } from './tipos';

const ETIQUETA_INICIO = /(^|\b)(inicio|start|comienzo|entrada)(\b|$)/i;
const ETIQUETA_FIN = /(^|\b)(fin|final|end|salida|terminar)(\b|$)/i;

interface FormaNodo {
  etiqueta: string;
  tipo: TipoNodo;
  pildora: boolean;
  detectarTexto: boolean;
  reconocida: boolean;
}

function quitarComentario(linea: string): string {
  const indice = linea.indexOf('%%');
  return indice >= 0 ? linea.slice(0, indice) : linea;
}

export function limpiarEtiqueta(texto: string): string {
  let limpio = texto.trim();

  if (
    (limpio.startsWith('"') && limpio.endsWith('"')) ||
    (limpio.startsWith("'") && limpio.endsWith("'"))
  ) {
    limpio = limpio.slice(1, -1);
  }

  return limpio
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/(?:&|#)quot;/g, '"')
    .replace(/(?:&|#)lt;/g, '<')
    .replace(/(?:&|#)gt;/g, '>')
    .replace(/(?:&|#)nbsp;/g, ' ')
    .replace(/(?:&|#)amp;/g, '&')
    .replace(/#35;/g, '#')
    .replace(/`/g, '')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

function normalizarDireccion(valor: string | undefined): DireccionMermaid {
  switch ((valor ?? '').toUpperCase()) {
    case 'LR':
      return 'LR';
    case 'RL':
      return 'RL';
    case 'BT':
      return 'BT';
    default:
      return 'TB';
  }
}

function analizarForma(resto: string): FormaNodo {
  const forma = resto.replace(/:{2,}[\w.\-]+\s*$/, '').trim();

  if (!forma) {
    return { etiqueta: '', tipo: 'proceso', pildora: false, detectarTexto: false, reconocida: true };
  }

  const patrones: {
    patron: RegExp;
    tipo: TipoNodo;
    pildora?: boolean;
    detectarTexto?: boolean;
  }[] = [
    { patron: /^\{\{(.*)\}\}$/s, tipo: 'accion' },
    { patron: /^\[\[(.*)\]\]$/s, tipo: 'proceso' },
    { patron: /^\[\((.*)\)\]$/s, tipo: 'proceso' },
    { patron: /^\[\/(.*)\/\]$/s, tipo: 'proceso' },
    { patron: /^\[\\(.*)\\]$/s, tipo: 'proceso' },
    { patron: /^\(\((.*)\)\)$/s, tipo: 'proceso', detectarTexto: true },
    { patron: /^\(\[(.*)\]\)$/s, tipo: 'proceso', pildora: true, detectarTexto: true },
    { patron: /^\{(.*)\}$/s, tipo: 'decision' },
    { patron: /^\[(.*)\]$/s, tipo: 'proceso' },
    { patron: /^\((.*)\)$/s, tipo: 'proceso' },
    { patron: /^>(.*)\]$/s, tipo: 'proceso' },
  ];

  for (const { patron, tipo, pildora, detectarTexto } of patrones) {
    const coincidencia = patron.exec(forma);
    if (coincidencia) {
      return {
        etiqueta: limpiarEtiqueta(coincidencia[1]),
        tipo,
        pildora: Boolean(pildora),
        detectarTexto: Boolean(detectarTexto),
        reconocida: true,
      };
    }
  }

  return { etiqueta: '', tipo: 'proceso', pildora: false, detectarTexto: false, reconocida: false };
}

export function parsearMermaid(codigo: string): DiagramaIntermedio {
  const avisos: string[] = [];
  const nodos = new Map<string, NodoIntermedio>();
  const orden: string[] = [];
  const pildoras: string[] = [];
  const aristas: AristaIntermedia[] = [];
  let direccion: DireccionMermaid = 'TB';
  let nombre: string | undefined;

  const lineas = codigo.replace(/\r\n?/g, '\n').split('\n').map(quitarComentario);

  // Front matter opcional (--- title: ... ---)
  let desde = 0;
  const primera = lineas.find((linea) => linea.trim());
  if (primera?.trim() === '---') {
    let cierre = -1;
    for (let i = 1; i < lineas.length; i++) {
      if (lineas[i].trim() === '---') {
        cierre = i;
        break;
      }
    }
    if (cierre > 0) {
      for (let i = 1; i < cierre; i++) {
        const coincidencia = /^title:\s*(.+)$/i.exec(lineas[i].trim());
        if (coincidencia) {
          nombre = limpiarEtiqueta(coincidencia[1]);
        }
      }
      desde = cierre + 1;
    }
  }

  let indiceCabecera = -1;
  for (let i = desde; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea) continue;
    const coincidencia = /^(?:flowchart|graph)\s*(TB|TD|BT|LR|RL)?\b/i.exec(linea);
    if (coincidencia) {
      direccion = normalizarDireccion(coincidencia[1]);
      indiceCabecera = i;
      break;
    }
  }

  if (indiceCabecera < 0) {
    avisos.push('No se encontró la cabecera «flowchart» o «graph»; se interpretó el resto igualmente.');
  }

  const registrarRef = (referencia: string, numeroLinea: number): string | null => {
    const coincidencia = /^([\w.\-]+)\s*([\s\S]*)$/.exec(referencia.trim());
    if (!coincidencia) {
      avisos.push(`Línea ${numeroLinea}: no se pudo interpretar «${referencia.trim()}».`);
      return null;
    }

    const id = coincidencia[1];
    const forma = analizarForma(coincidencia[2]);
    if (!forma.reconocida) {
      avisos.push(`Línea ${numeroLinea}: forma no reconocida en «${referencia.trim()}».`);
      return null;
    }

    let tipo = forma.tipo;
    if (forma.detectarTexto) {
      if (ETIQUETA_INICIO.test(forma.etiqueta)) tipo = 'inicio';
      else if (ETIQUETA_FIN.test(forma.etiqueta)) tipo = 'fin';
    }

    const existente = nodos.get(id);
    if (existente) {
      if (forma.etiqueta) {
        existente.etiqueta = forma.etiqueta;
        existente.tipo = tipo;
      }
      return id;
    }

    if (forma.pildora) {
      pildoras.push(id);
    }

    nodos.set(id, { id, etiqueta: forma.etiqueta || id, tipo });
    orden.push(id);
    return id;
  };

  // El '&' separa varios nodos, pero puede aparecer dentro de una entidad HTML
  // (por ejemplo "&amp;"). Se protege con un centinela antes de dividir.
  const expandirRefs = (segmento: string, numeroLinea: number): string[] =>
    segmento
      .replace(/&(?:amp|quot|lt|gt|nbsp|#\d+|#\w+);/gi, (entidad) => `\u0000${entidad.slice(1)}`)
      .split('&')
      .map((parte) => parte.replace(/\u0000/g, '&').trim())
      .filter(Boolean)
      .map((parte) => registrarRef(parte, numeroLinea))
      .filter((id): id is string => id !== null);

  const procesarSentencia = (sentencia: string, numeroLinea: number) => {
    if (/^subgraph\b/i.test(sentencia)) {
      avisos.push(`Línea ${numeroLinea}: el bloque «subgraph» se aplana.`);
      return;
    }
    if (/^(end|direction)\b/i.test(sentencia)) return;
    if (/^(classDef|class|style|linkStyle|click|accTitle|accDescr)\b/i.test(sentencia)) {
      avisos.push(`Línea ${numeroLinea}: se ignoró «${sentencia.split(/\s/)[0]}».`);
      return;
    }

    const texto = sentencia
      .replace(/--(?![->])\s*([^|]+?)\s*-->/g, '-->|$1|')
      .replace(/-\.\s*([^|]+?)\s*\.->/g, '-.->|$1|')
      .replace(/==\s*([^|]+?)\s*==>/g, '==>|$1|');

    const reFlecha =
      /<-->|[ox]--[ox]|~{3,}|-{2,}[>ox]?|={2,}[>ox]?|-\.-*[>ox]?|\.-+[>ox]?/g;
    const segmentos: string[] = [];
    const etiquetas: string[] = [];
    const invisibles: boolean[] = [];
    let ultimo = 0;
    let coincidencia: RegExpExecArray | null;

    while ((coincidencia = reFlecha.exec(texto)) !== null) {
      segmentos.push(texto.slice(ultimo, coincidencia.index));
      invisibles.push(coincidencia[0].startsWith('~'));
      let fin = coincidencia.index + coincidencia[0].length;
      const etiquetaPipe = /^\s*\|([^|]*)\|/.exec(texto.slice(fin));
      if (etiquetaPipe) {
        etiquetas.push(limpiarEtiqueta(etiquetaPipe[1]));
        fin += etiquetaPipe[0].length;
      } else {
        etiquetas.push('');
      }
      ultimo = fin;
      reFlecha.lastIndex = fin;
    }
    segmentos.push(texto.slice(ultimo));

    // Sin flechas: es una definición de nodo aislada.
    if (etiquetas.length === 0) {
      expandirRefs(segmentos[0], numeroLinea);
      return;
    }

    const referencias = segmentos.map((segmento) => segmento.trim());
    if (referencias.some((referencia) => !referencia)) {
      avisos.push(`Línea ${numeroLinea}: conexión incompleta en «${sentencia}».`);
      return;
    }

    for (let i = 0; i < etiquetas.length; i++) {
      const origenes = expandirRefs(referencias[i], numeroLinea);
      const destinos = expandirRefs(referencias[i + 1], numeroLinea);
      for (const origen of origenes) {
        for (const destino of destinos) {
          aristas.push({
            origen,
            destino,
            etiqueta: etiquetas[i],
            invisible: invisibles[i],
          });
        }
      }
    }
  };

  for (let i = desde; i < lineas.length; i++) {
    if (i === indiceCabecera) continue;
    const linea = lineas[i].trim();
    if (!linea) continue;
    for (const sentencia of linea.split(';').map((parte) => parte.trim()).filter(Boolean)) {
      if (/^(?:flowchart|graph)\s*(TB|TD|BT|LR|RL)?$/i.test(sentencia)) continue;
      procesarSentencia(sentencia, i + 1);
    }
  }

  // A las píldoras sin texto reconocible se les asigna inicio (primera) y fin (resto).
  const sinTipo = pildoras.filter((id) => {
    const nodo = nodos.get(id);
    return nodo !== undefined && nodo.tipo !== 'inicio' && nodo.tipo !== 'fin';
  });

  if (sinTipo.length > 0) {
    const primero = nodos.get(sinTipo[0]);
    if (primero) primero.tipo = 'inicio';
    for (let i = 1; i < sinTipo.length; i++) {
      const nodo = nodos.get(sinTipo[i]);
      if (nodo) nodo.tipo = 'fin';
    }
  }

  return {
    nombre,
    direccion,
    nodos: orden
      .map((id) => nodos.get(id))
      .filter((nodo): nodo is NodoIntermedio => nodo !== undefined),
    aristas,
    avisos,
  };
}
