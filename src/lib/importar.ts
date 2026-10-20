import type { Diagrama } from '../types';
import { convertirMermaid } from './convertidores';
import { pareceMermaid } from './convertidores/detectar';
import { diagramasDesdeTextoJson } from './persistencia';

export interface ResultadoImportacion {
  diagramas: Diagrama[];
  avisos: string[];
}

const EXTENSIONES_MERMAID = new Set(['mmd', 'mermaid']);

export async function importarArchivoComoDiagramas(archivo: File): Promise<ResultadoImportacion> {
  const texto = await archivo.text();
  const extension = (archivo.name.split('.').pop() ?? '').toLowerCase();
  const nombreBase = archivo.name.replace(/\.[^.]+$/, '').trim() || 'Mermaid importado';

  if (extension === 'json') {
    return { diagramas: diagramasDesdeTextoJson(texto), avisos: [] };
  }

  if (EXTENSIONES_MERMAID.has(extension) || pareceMermaid(texto)) {
    const { diagrama, avisos } = convertirMermaid(texto, nombreBase);
    for (const aviso of avisos) {
      console.warn(`[Mermaid] ${aviso}`);
    }
    return { diagramas: [diagrama], avisos };
  }

  try {
    return { diagramas: diagramasDesdeTextoJson(texto), avisos: [] };
  } catch {
    throw new Error(
      'Formato no reconocido. Se admite un JSON exportado por la app o un diagrama Mermaid (.mmd, .mermaid).',
    );
  }
}
