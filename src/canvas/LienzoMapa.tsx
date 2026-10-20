import {
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type EdgeTypes,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo } from 'react';
import { calcularLayoutMapa } from '../lib/mapaLayout';
import { useMapaStore } from '../store/mapaStore';
import type { AristaMapaFlow, NodoMapaFlow } from '../typesMapa';
import { AristaMapa } from './AristaMapa';
import { NodoMapaVisual } from './NodoMapa';

const tiposNodo = { mapa: NodoMapaVisual };
const tiposArista = { recta: AristaMapa };

export function LienzoMapa() {
  const mapa = useMapaStore((estado) =>
    estado.mapas.find((diagrama) => diagrama.id === estado.mapaActivoId),
  );
  const mapaActivoId = useMapaStore((estado) => estado.mapaActivoId);
  const seleccionadosIds = useMapaStore((estado) => estado.seleccionadosIds);
  const seleccionarNodo = useMapaStore((estado) => estado.seleccionarNodo);
  const cambiarSeleccionNodo = useMapaStore((estado) => estado.cambiarSeleccionNodo);
  const agregarNodo = useMapaStore((estado) => estado.agregarNodo);
  const posicionarNodo = useMapaStore((estado) => estado.posicionarNodo);
  const redimensionarNodo = useMapaStore((estado) => estado.redimensionarNodo);
  const iniciarEdicionManual = useMapaStore((estado) => estado.iniciarEdicionManual);
  const { fitView } = useReactFlow();

  const layout = useMemo(
    () =>
      mapa
        ? calcularLayoutMapa(mapa)
        : { nodos: [], aristas: [], ancho: 0, alto: 0 },
    [mapa],
  );

  const idsSeleccionados = useMemo(() => new Set(seleccionadosIds), [seleccionadosIds]);

  const nodos: NodoMapaFlow[] = useMemo(
    () =>
      layout.nodos.map(
        ({ nodo, x, y, ancho, alto }): NodoMapaFlow => ({
          id: nodo.id,
          type: 'mapa',
          position: { x, y },
          data: { etiqueta: nodo.etiqueta, nivel: nodo.nivel },
          style: { width: ancho, height: alto },
          width: ancho,
          height: alto,
          selected: idsSeleccionados.has(nodo.id),
          draggable: true,
          connectable: false,
          deletable: false,
          selectable: true,
        }),
      ),
    [layout, idsSeleccionados],
  );

  const aristas: AristaMapaFlow[] = useMemo(
    () =>
      layout.aristas.map(
        (arista): AristaMapaFlow => ({
          id: arista.id,
          source: arista.source,
          target: arista.target,
          sourceHandle: 'abajo',
          targetHandle: 'arriba',
          type: 'recta',
          selectable: false,
          focusable: false,
          deletable: false,
          style: { stroke: '#111111', strokeWidth: 1.4 },
        }),
      ),
    [layout],
  );

  const alCambiarNodos = useCallback(
    (cambios: NodeChange<NodoMapaFlow>[]) => {
      for (const cambio of cambios) {
        if (cambio.type === 'position' && cambio.position) {
          posicionarNodo(cambio.id, cambio.position);
          continue;
        }

        if (
          cambio.type === 'dimensions' &&
          cambio.dimensions &&
          cambio.resizing !== undefined
        ) {
          redimensionarNodo(
            cambio.id,
            cambio.dimensions.width,
            cambio.dimensions.height,
          );
          continue;
        }

        if (cambio.type !== 'select') continue;
        cambiarSeleccionNodo(cambio.id, cambio.selected);
      }
    },
    [cambiarSeleccionNodo, posicionarNodo, redimensionarNodo],
  );

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      void fitView({ padding: 0.16, duration: 350 });
    }, 80);
    return () => window.clearTimeout(temporizador);
  }, [mapaActivoId, layout.nodos.length, fitView]);

  return (
    <div className="lienzo lienzo--mapa">
      <ReactFlow<NodoMapaFlow, AristaMapaFlow>
        nodes={nodos}
        edges={aristas}
        nodeTypes={tiposNodo as NodeTypes}
        edgeTypes={tiposArista as EdgeTypes}
        onNodesChange={alCambiarNodos}
        onNodeClick={(evento, nodo) => {
          if (!evento.ctrlKey && !evento.metaKey && !evento.shiftKey) {
            seleccionarNodo(nodo.id);
          }
        }}
        onNodeDragStart={() => iniciarEdicionManual()}
        onPaneClick={() => seleccionarNodo(null)}
        nodesDraggable
        nodeDragThreshold={4}
        nodesConnectable={false}
        edgesReconnectable={false}
        edgesFocusable={false}
        selectionKeyCode="Shift"
        multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
        deleteKeyCode={null}
        zoomOnDoubleClick={false}
        minZoom={0.15}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        defaultEdgeOptions={{
          type: 'recta',
          selectable: false,
          focusable: false,
          style: { stroke: '#111111', strokeWidth: 1.4 },
        }}
      >
        <MiniMap
          pannable
          zoomable
          nodeColor="#111111"
          maskColor="rgba(255, 255, 255, 0.72)"
        />
        <Controls showInteractive={false} />
        {nodos.length === 0 && (
          <Panel position="top-center" className="mapa-vacio">
            <p>Este mapa todavía no tiene nodos.</p>
            <button
              type="button"
              className="boton"
              onClick={(evento) => {
                evento.stopPropagation();
                agregarNodo(1);
              }}
            >
              Añadir proceso principal
            </button>
          </Panel>
        )}
        <Panel position="bottom-center" className="pista">
          Doble clic para editar · Ctrl/Mayús + clic para seleccionar varios · Arrastra para mover · Tiradores para redimensionar
        </Panel>
      </ReactFlow>
    </div>
  );
}
