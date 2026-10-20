import { useReactFlow } from '@xyflow/react';
import { useRef, useState, type ChangeEvent } from 'react';
import { exportarJson, exportarPng, esFondoPng, type FondoPng } from '../lib/exportar';
import { importarArchivoComoDiagramas } from '../lib/importar';
import { useDiagramStore } from '../store/diagramStore';
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

interface PropiedadesBarra {
  seccion: SeccionApp;
  onCambiarSeccion: (seccion: SeccionApp) => void;
  onMensaje: (texto: string) => void;
  onAbrirMermaid: () => void;
}

export function BarraSuperior({
  seccion,
  onCambiarSeccion,
  onMensaje,
  onAbrirMermaid,
}: PropiedadesBarra) {
  const diagrama = useDiagramStore((estado) =>
    estado.diagramas.find((d) => d.id === estado.diagramaActivoId),
  );
  const diagramas = useDiagramStore((estado) => estado.diagramas);
  const activoId = useDiagramStore((estado) => estado.diagramaActivoId);
  const pasado = useDiagramStore((estado) => estado.pasado.length);
  const futuro = useDiagramStore((estado) => estado.futuro.length);
  const renombrarDiagrama = useDiagramStore((estado) => estado.renombrarDiagrama);
  const deshacer = useDiagramStore((estado) => estado.deshacer);
  const rehacer = useDiagramStore((estado) => estado.rehacer);
  const limpiarSeleccion = useDiagramStore((estado) => estado.limpiarSeleccion);
  const importarDiagramas = useDiagramStore((estado) => estado.importarDiagramas);
  const { fitView } = useReactFlow();
  const archivoRef = useRef<HTMLInputElement>(null);
  const [exportando, setExportando] = useState(false);
  const [fondoPng, setFondoPng] = useState<FondoPng>('oscuro');

  const exportarImagen = async () => {
    if (!diagrama) return;
    try {
      setExportando(true);
      limpiarSeleccion();
      await new Promise<void>((resolver) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolver());
        });
      });

      const estado = useDiagramStore.getState();
      const actual = estado.diagramas.find((d) => d.id === estado.diagramaActivoId);
      if (!actual) return;

      await exportarPng(actual.nodos, actual.nombre, fondoPng);
      onMensaje(`Imagen PNG exportada con fondo ${fondoPng}.`);
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
      const { diagramas: importados, avisos } = await importarArchivoComoDiagramas(archivo);
      importarDiagramas(importados);
      if (avisos.length > 0) {
        onMensaje(
          `Se importó ${importados.length} diagrama(s) con ${avisos.length} aviso(s).`,
        );
      } else {
        onMensaje(
          importados.length === 1
            ? 'Diagrama importado correctamente.'
            : `${importados.length} diagramas importados correctamente.`,
        );
      }
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
        value={diagrama?.nombre ?? ''}
        onChange={(evento) => renombrarDiagrama(activoId, evento.target.value)}
        maxLength={80}
        aria-label="Nombre del diagrama"
        title="Nombre del diagrama"
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
          onClick={() => void fitView({ padding: 0.18, duration: 300 })}
          title="Ajustar vista"
          aria-label="Ajustar vista"
        >
          <IconoAjustar />
        </button>

        <span className="barra__separador" aria-hidden="true" />

        <label className="selector-fondo" title="Fondo de la imagen PNG">
          <span>Fondo</span>
          <select
            value={fondoPng}
            aria-label="Fondo de la imagen PNG"
            disabled={exportando}
            onChange={(evento) => {
              const valor = evento.target.value;
              if (esFondoPng(valor)) setFondoPng(valor);
            }}
          >
            <option value="oscuro">Oscuro</option>
            <option value="blanco">Blanco</option>
            <option value="transparente">Transparente</option>
          </select>
        </label>
        <button
          type="button"
          className="boton"
          onClick={() => void exportarImagen()}
          disabled={exportando}
          title="Exportar como imagen PNG"
        >
          <IconoImagen />
          <span>{exportando ? 'Exportando…' : 'PNG'}</span>
        </button>
        <button
          type="button"
          className="boton"
          onClick={() => {
            exportarJson(diagramas, activoId);
            onMensaje('Diagrama exportado como JSON.');
          }}
          title="Exportar JSON"
        >
          <IconoDescargar />
          <span>JSON</span>
        </button>
        <button
          type="button"
          className="boton"
          onClick={onAbrirMermaid}
          title="Convertir código Mermaid"
        >
          <IconoFlujo />
          <span>Mermaid</span>
        </button>
        <button
          type="button"
          className="boton"
          onClick={() => archivoRef.current?.click()}
          title="Importar JSON o Mermaid"
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
