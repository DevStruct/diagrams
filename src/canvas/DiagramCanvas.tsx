import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  SelectionMode,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import { useEffect, useState, type DragEvent } from 'react';
import { COLOR_ARISTA, esTipoNodo } from '../data/colores';
import { useDiagramStore } from '../store/diagramStore';
import type { AristaDiagrama, DatosNodo, NodoDiagrama } from '../types';
import { IconoSeleccion } from '../components/Iconos';
import { AristaEtiqueta } from './AristaEtiqueta';
import { NodoProceso } from './NodoDiagrama';

const tiposNodo = { nodo: NodoProceso };
const tiposArista = { etiqueta: AristaEtiqueta };

export function DiagramCanvas() {
  const diagrama = useDiagramStore((estado) =>
    estado.diagramas.find((d) => d.id === estado.diagramaActivoId),
  );
  const activoId = useDiagramStore((estado) => estado.diagramaActivoId);
  const onNodesChange = useDiagramStore((estado) => estado.onNodesChange);
  const onEdgesChange = useDiagramStore((estado) => estado.onEdgesChange);
  const onConnect = useDiagramStore((estado) => estado.onConnect);
  const registrarHistorial = useDiagramStore((estado) => estado.registrarHistorial);
  const agregarNodo = useDiagramStore((estado) => estado.agregarNodo);
  const limpiarSeleccion = useDiagramStore((estado) => estado.limpiarSeleccion);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [modoSeleccion, setModoSeleccion] = useState(false);

  const nodos = diagrama?.nodos ?? [];
  const aristas = diagrama?.aristas ?? [];

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      void fitView({ padding: 0.18, duration: 350 });
    }, 80);
    return () => window.clearTimeout(temporizador);
  }, [activoId, fitView]);

  const alSoltar = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    const tipo = evento.dataTransfer.getData('application/x-tipo-nodo');
    if (!esTipoNodo(tipo)) return;

    const posicion = screenToFlowPosition({ x: evento.clientX, y: evento.clientY });
    agregarNodo(tipo, { x: posicion.x - 95, y: posicion.y - 30 });
  };

  return (
    <div
      className="lienzo"
      onDrop={alSoltar}
      onDragOver={(evento) => {
        evento.preventDefault();
        evento.dataTransfer.dropEffect = 'move';
      }}
    >
      <ReactFlow<NodoDiagrama, AristaDiagrama>
        nodes={nodos}
        edges={aristas}
        nodeTypes={tiposNodo as NodeTypes}
        edgeTypes={tiposArista as EdgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={() => registrarHistorial()}
        onPaneClick={() => limpiarSeleccion()}
        selectionOnDrag={modoSeleccion}
        selectionMode={SelectionMode.Partial}
        panOnDrag={modoSeleccion ? [1, 2] : true}
        selectionKeyCode="Shift"
        multiSelectionKeyCode={['Control', 'Meta', 'Shift']}
        connectionMode={ConnectionMode.Loose}
        connectionLineStyle={{ stroke: COLOR_ARISTA }}
        defaultEdgeOptions={{
          type: 'etiqueta',
          style: { stroke: COLOR_ARISTA, strokeWidth: 1.6 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: COLOR_ARISTA,
          },
        }}
        deleteKeyCode={['Backspace', 'Delete']}
        zoomOnDoubleClick={false}
        minZoom={0.15}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.18 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#2b313a" />
        <MiniMap
          pannable
          zoomable
          nodeColor={(nodo) => (nodo.data as DatosNodo).color ?? '#3a4250'}
          maskColor="rgba(8, 10, 13, 0.72)"
        />
        <Controls showInteractive={false} />
        <Panel position="top-left" className="panel-herramientas">
          <button
            type="button"
            className={`boton ${modoSeleccion ? 'boton--principal' : ''}`}
            onClick={() => setModoSeleccion((activo) => !activo)}
            aria-pressed={modoSeleccion}
            title={
              modoSeleccion
                ? 'Selección activa: arrastra un recuadro sobre el lienzo. Desplázate con el botón central o derecho.'
                : 'Activa la selección por recuadro para elegir varios nodos y arrastrarlos en grupo'
            }
          >
            <IconoSeleccion />
            <span>{modoSeleccion ? 'Selección activa' : 'Seleccionar varios'}</span>
          </button>
        </Panel>
        <Panel position="bottom-center" className="pista">
          Arrastra un recuadro con «Seleccionar varios» o Mayús · Ctrl/Mayús+clic suma nodos · Supr elimina
        </Panel>
      </ReactFlow>
    </div>
  );
}
