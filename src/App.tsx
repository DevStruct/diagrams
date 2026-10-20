import { useCallback, useEffect, useState } from 'react';
import { BarraMapas } from './components/BarraMapas';
import { BarraSuperior } from './components/BarraSuperior';
import { DialogoMermaid } from './components/DialogoMermaid';
import { DialogoMermaidMapa } from './components/DialogoMermaidMapa';
import { Inspector } from './components/Inspector';
import { InspectorMapa } from './components/InspectorMapa';
import { PanelDiagramas } from './components/PanelDiagramas';
import { PanelMapas } from './components/PanelMapas';
import { type SeccionApp } from './components/SelectorSeccion';
import { DiagramCanvas } from './canvas/DiagramCanvas';
import { LienzoMapa } from './canvas/LienzoMapa';
import { descendientesDe } from './lib/mapaArbol';
import { guardarEstado } from './lib/persistencia';
import { guardarEstadoMapas } from './lib/persistenciaMapas';
import { useDiagramStore } from './store/diagramStore';
import { useMapaStore } from './store/mapaStore';

export default function App() {
  const diagramas = useDiagramStore((estado) => estado.diagramas);
  const diagramaActivoId = useDiagramStore((estado) => estado.diagramaActivoId);
  const mapas = useMapaStore((estado) => estado.mapas);
  const mapaActivoId = useMapaStore((estado) => estado.mapaActivoId);
  const [seccion, setSeccion] = useState<SeccionApp>('flujo');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [mermaidAbierto, setMermaidAbierto] = useState(false);
  const [mermaidMapaAbierto, setMermaidMapaAbierto] = useState(false);

  const mostrarMensaje = useCallback((texto: string) => {
    setMensaje(texto);
  }, []);

  const cambiarSeccion = useCallback((nueva: SeccionApp) => {
    setSeccion(nueva);
    setMermaidAbierto(false);
    setMermaidMapaAbierto(false);
  }, []);

  useEffect(() => {
    if (!mensaje) return;
    const temporizador = window.setTimeout(() => setMensaje(null), 3500);
    return () => window.clearTimeout(temporizador);
  }, [mensaje]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      guardarEstado({ diagramas, diagramaActivoId });
    }, 350);
    return () => window.clearTimeout(temporizador);
  }, [diagramas, diagramaActivoId]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      guardarEstadoMapas({ mapas, mapaActivoId });
    }, 350);
    return () => window.clearTimeout(temporizador);
  }, [mapas, mapaActivoId]);

  useEffect(() => {
    const alPulsar = (evento: KeyboardEvent) => {
      const objetivo = evento.target as HTMLElement | null;
      const editando =
        objetivo?.tagName === 'INPUT' ||
        objetivo?.tagName === 'TEXTAREA' ||
        objetivo?.tagName === 'SELECT' ||
        Boolean(objetivo?.isContentEditable);
      const conModificador = evento.ctrlKey || evento.metaKey;
      const tecla = evento.key.toLowerCase();

      if (seccion === 'mapas') {
        if (conModificador && !editando) {
          const estadoMapa = useMapaStore.getState();
          if (tecla === 'z') {
            evento.preventDefault();
            if (evento.shiftKey) {
              estadoMapa.rehacer();
            } else {
              estadoMapa.deshacer();
            }
          } else if (tecla === 'y') {
            evento.preventDefault();
            estadoMapa.rehacer();
          }
          return;
        }

        if (!conModificador && !editando && (tecla === 'delete' || tecla === 'backspace')) {
          const estadoMapa = useMapaStore.getState();
          const mapa = estadoMapa.mapas.find(
            (diagrama) => diagrama.id === estadoMapa.mapaActivoId,
          );
          const nodos = mapa
            ? mapa.nodos.filter((nodo) =>
                estadoMapa.seleccionadosIds.includes(nodo.id),
              )
            : [];
          if (!mapa || nodos.length === 0) return;

          const aEliminar = new Set(nodos.map((nodo) => nodo.id));
          for (const nodo of nodos) {
            for (const descendiente of descendientesDe(mapa.nodos, nodo.id)) {
              aEliminar.add(descendiente.id);
            }
          }

          evento.preventDefault();
          const dependientes = aEliminar.size - nodos.length;
          const mensaje =
            nodos.length === 1
              ? dependientes > 0
                ? `¿Eliminar «${nodos[0].etiqueta}» y sus ${dependientes} nodo(s) dependiente(s)?`
                : `¿Eliminar «${nodos[0].etiqueta}»?`
              : dependientes > 0
                ? `¿Eliminar ${nodos.length} nodos seleccionados y ${dependientes} nodo(s) dependiente(s)?`
                : `¿Eliminar ${nodos.length} nodos seleccionados?`;

          if (window.confirm(mensaje)) {
            estadoMapa.eliminarNodos(nodos.map((nodo) => nodo.id));
          }
        }
        return;
      }

      if (!conModificador || editando) return;

      const estado = useDiagramStore.getState();

      if (tecla === 'z') {
        evento.preventDefault();
        if (evento.shiftKey) {
          estado.rehacer();
        } else {
          estado.deshacer();
        }
        return;
      }

      if (tecla === 'y') {
        evento.preventDefault();
        estado.rehacer();
        return;
      }

      if (tecla === 'd') {
        const diagrama = estado.diagramas.find((d) => d.id === estado.diagramaActivoId);
        const seleccionado = diagrama?.nodos.find((nodo) => nodo.selected);
        if (seleccionado) {
          evento.preventDefault();
          estado.duplicarNodo(seleccionado.id);
        }
      }
    };

    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [seccion]);

  return (
    <div className="app">
      {seccion === 'flujo' ? (
        <BarraSuperior
          seccion={seccion}
          onCambiarSeccion={cambiarSeccion}
          onMensaje={mostrarMensaje}
          onAbrirMermaid={() => setMermaidAbierto(true)}
        />
      ) : (
        <BarraMapas
          seccion={seccion}
          onCambiarSeccion={cambiarSeccion}
          onMensaje={mostrarMensaje}
          onAbrirMermaid={() => setMermaidMapaAbierto(true)}
        />
      )}
      <main className="cuerpo">
        {seccion === 'flujo' ? (
          <>
            <PanelDiagramas />
            <DiagramCanvas />
            <Inspector />
          </>
        ) : (
          <>
            <PanelMapas />
            <LienzoMapa />
            <InspectorMapa />
          </>
        )}
      </main>
      <DialogoMermaid
        abierto={mermaidAbierto}
        onCerrar={() => setMermaidAbierto(false)}
        onMensaje={mostrarMensaje}
      />
      <DialogoMermaidMapa
        abierto={mermaidMapaAbierto}
        onCerrar={() => setMermaidMapaAbierto(false)}
        onMensaje={mostrarMensaje}
      />
      {mensaje && (
        <div className="aviso" role="status">
          {mensaje}
        </div>
      )}
    </div>
  );
}
