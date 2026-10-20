import { useReactFlow } from '@xyflow/react';
import { useRef, useState, type ChangeEvent } from 'react';
import { pareceMermaid } from '../lib/convertidores/detectar';
import { exportarJsonMapas, exportarPng } from '../lib/exportar';
import { mapaDesdeMermaid } from '../lib/mapaMermaid';
import { calcularLayoutMapa } from '../lib/mapaLayout';
import { mapasDesdeTextoJson } from '../lib/persistenciaMapas';
import { useMapaStore } from '../store/mapaStore';
import type { NodoMapaFlow } from '../typesMapa';
import {
  IconoAjustar,
  IconoDeshacer,
  IconoDescargar,
  IconoFlujo,
  IconoImagen,
  IconoRehacer,
  IconoSubir,
} from './Iconos';
import { SelectorSeccion, type SeccionApp } from './SelectorSeccion';

interface PropiedadesBarraMapas {
  seccion: SeccionApp;
  onCambiarSeccion: (seccion: SeccionApp) => void;
  onMensaje: (texto: string) => void;
  onAbrirMermaid: () => void;
}

export function BarraMapas({
  seccion,
  onCambiarSeccion,
  onMensaje,
  onAbrirMermaid,
}: PropiedadesBarraMapas) {
  const mapa = useMapaStore((estado) =>
    estado.mapas.find((diagrama) => diagrama.id === estado.mapaActivoId),
  );
  const mapas = useMapaStore((estado) => estado.mapas);
  const mapaActivoId = useMapaStore((estado) => estado.mapaActivoId);
  const pasado = useMapaStore((estado) => estado.pasado.length);
  const futuro = useMapaStore((estado) => estado.futuro.length);
  const renombrarMapa = useMapaStore((estado) => estado.renombrarMapa);
  const deshacer = useMapaStore((estado) => estado.deshacer);
  const rehacer = useMapaStore((estado) => estado.rehacer);
  const seleccionarNodo = useMapaStore((estado) => estado.seleccionarNodo);
  const importarMapas = useMapaStore((estado) => estado.importarMapas);
  const { fitView } = useReactFlow();
  const archivoRef = useRef<HTMLInputElement>(null);
  const [exportando, setExportando] = useState(false);

  const exportarImagen = async () => {
    if (!mapa) return;
    if (mapa.nodos.length === 0) {
      onMensaje('El mapa está vacío: añade al menos un nodo antes de exportar.');
      return;
    }

    try {
      setExportando(true);
      seleccionarNodo(null);
      await new Promise<void>((resolver) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolver());
        });
      });

      const estado = useMapaStore.getState();
      const actual = estado.mapas.find((diagrama) => diagrama.id === estado.mapaActivoId);
      if (!actual) return;

      const layout = calcularLayoutMapa(actual);
      const nodos: NodoMapaFlow[] = layout.nodos.map(
        ({ nodo, x, y, ancho, alto }): NodoMapaFlow => ({
          id: nodo.id,
          type: 'mapa',
          position: { x, y },
          data: { etiqueta: nodo.etiqueta, nivel: nodo.nivel },
          style: { width: ancho, height: alto },
          width: ancho,
          height: alto,
        }),
      );

      await exportarPng(nodos, actual.nombre, 'blanco');
      onMensaje('Imagen PNG exportada con fondo blanco.');
    } catch (error) {
      onMensaje(error instanceof Error ? error.message : 'No se pudo exportar la imagen.');
    } finally {
      setExportando(false);
    }
  };

  const importarArchivo = async (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;

    try {
      const texto = await archivo.text();
      const extension = (archivo.name.split('.').pop() ?? '').toLowerCase();

      if (extension === 'mmd' || extension === 'mermaid' || pareceMermaid(texto)) {
        const nombreBase = archivo.name.replace(/\.[^.]+$/, '').trim();
        const { mapa: mapaImportado, avisos } = mapaDesdeMermaid(texto, nombreBase);
        importarMapas([mapaImportado]);

        for (const aviso of avisos) {
          console.warn(`[Mermaid] ${aviso}`);
        }

        onMensaje(
          avisos.length === 0
            ? `Mapa «${mapaImportado.nombre}» creado desde Mermaid.`
            : `Mapa «${mapaImportado.nombre}» creado con ${avisos.length} aviso(s).`,
        );
        return;
      }

      const importados = mapasDesdeTextoJson(texto);
      importarMapas(importados);
      onMensaje(
        importados.length === 1
          ? 'Mapa de proceso importado correctamente.'
          : `${importados.length} mapas de proceso importados correctamente.`,
      );
    } catch (error) {
      onMensaje(error instanceof Error ? error.message : 'No se pudo importar el archivo.');
    }
  };

  return (
    <header className="barra">
      <div className="barra__marca">
        <span className="barra__logo" aria-hidden="true">
          ◈
        </span>
        <span className="barra__titulo">Diagramas de Proceso</span>
      </div>

      <SelectorSeccion seccion={seccion} onCambiar={onCambiarSeccion} />

      <input
        className="barra__nombre"
        type="text"
        value={mapa?.nombre ?? ''}
        onChange={(evento) => renombrarMapa(mapaActivoId, evento.target.value)}
        maxLength={80}
        aria-label="Nombre del mapa de proceso"
        title="Nombre del mapa de proceso"
      />

      <span className="guardado">Autoguardado local</span>

      <div className="barra__acciones">
        <button
          type="button"
          className="boton boton--icono"
          onClick={deshacer}
          disabled={pasado === 0}
          title="Deshacer (Ctrl+Z)"
          aria-label="Deshacer"
        >
          <IconoDeshacer />
        </button>
        <button
          type="button"
          className="boton boton--icono"
          onClick={rehacer}
          disabled={futuro === 0}
          title="Rehacer (Ctrl+Y)"
          aria-label="Rehacer"
        >
          <IconoRehacer />
        </button>
        <button
          type="button"
          className="boton boton--icono"
          onClick={() => void fitView({ padding: 0.16, duration: 300 })}
          title="Ajustar vista"
          aria-label="Ajustar vista"
        >
          <IconoAjustar />
        </button>

        <span className="barra__separador" aria-hidden="true" />

        <button
          type="button"
          className="boton"
          onClick={() => void exportarImagen()}
          disabled={exportando}
          title="Exportar como imagen PNG con fondo blanco"
        >
          <IconoImagen />
          <span>{exportando ? 'Exportando…' : 'PNG'}</span>
        </button>
        <button
          type="button"
          className="boton"
          onClick={() => {
            exportarJsonMapas(mapas, mapaActivoId);
            onMensaje('Mapa de proceso exportado como JSON.');
          }}
          title="Exportar los mapas de proceso como JSON"
        >
          <IconoDescargar />
          <span>JSON</span>
        </button>
        <button
          type="button"
          className="boton"
          onClick={onAbrirMermaid}
          title="Crear un mapa desde código Mermaid"
        >
          <IconoFlujo />
          <span>Mermaid</span>
        </button>
        <button
          type="button"
          className="boton"
          onClick={() => archivoRef.current?.click()}
          title="Importar mapas de proceso desde JSON o Mermaid"
        >
          <IconoSubir />
          <span>Importar</span>
        </button>
        <input
          ref={archivoRef}
          type="file"
          accept="application/json,.json,.mmd,.mermaid,.txt"
          className="archivo-oculto"
          onChange={(evento) => void importarArchivo(evento)}
        />
      </div>
    </header>
  );
}
