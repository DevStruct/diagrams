import { useReactFlow } from '@xyflow/react';
import { useDiagramStore } from '../store/diagramStore';
import { ETIQUETAS_TIPO, TIPOS_NODO } from '../data/colores';
import type { TipoNodo } from '../types';

export function PanelDiagramas() {
  const diagramas = useDiagramStore((estado) => estado.diagramas);
  const activoId = useDiagramStore((estado) => estado.diagramaActivoId);
  const seleccionarDiagrama = useDiagramStore((estado) => estado.seleccionarDiagrama);
  const crearDiagrama = useDiagramStore((estado) => estado.crearDiagrama);
  const eliminarDiagrama = useDiagramStore((estado) => estado.eliminarDiagrama);
  const agregarNodo = useDiagramStore((estado) => estado.agregarNodo);
  const { screenToFlowPosition } = useReactFlow();

  const agregarDesdeBoton = (tipo: TipoNodo) => {
    const centro = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const activo = diagramas.find((diagrama) => diagrama.id === activoId);
    const desplazamiento = (activo?.nodos.length ?? 0) % 6;

    agregarNodo(tipo, {
      x: centro.x - 95 + desplazamiento * 18,
      y: centro.y - 30 + desplazamiento * 12,
    });
  };

  return (
    <aside className="panel panel--izquierda">
      <section className="panel__seccion panel__seccion--crecer">
        <div className="panel__cabecera">
          <h2>Diagramas</h2>
          <button type="button" className="boton boton--mini" onClick={crearDiagrama}>
            + Nuevo
          </button>
        </div>

        <ul className="diagramas">
          {diagramas.map((diagrama) => (
            <li
              key={diagrama.id}
              className={`diagrama ${diagrama.id === activoId ? 'diagrama--activo' : ''}`}
            >
              <button
                type="button"
                className="diagrama__abrir"
                onClick={() => seleccionarDiagrama(diagrama.id)}
                title={diagrama.nombre}
              >
                <span className="diagrama__nombre">{diagrama.nombre || 'Sin título'}</span>
                <span className="diagrama__meta">
                  {diagrama.nodos.length} {diagrama.nodos.length === 1 ? 'nodo' : 'nodos'}
                </span>
              </button>
              <button
                type="button"
                className="diagrama__borrar"
                title="Eliminar diagrama"
                aria-label={`Eliminar ${diagrama.nombre || 'diagrama'}`}
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Eliminar el diagrama «${diagrama.nombre || 'Sin título'}»? Esta acción no se puede deshacer.`,
                    )
                  ) {
                    eliminarDiagrama(diagrama.id);
                  }
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel__seccion">
        <h2>Añadir nodo</h2>
        <p className="pista-texto">Haz clic o arrastra un tipo al lienzo.</p>
        <div className="paleta">
          {TIPOS_NODO.map((tipo) => (
            <button
              key={tipo}
              type="button"
              className="paleta__item"
              draggable
              onDragStart={(evento) => {
                evento.dataTransfer.setData('application/x-tipo-nodo', tipo);
                evento.dataTransfer.effectAllowed = 'move';
              }}
              onClick={() => agregarDesdeBoton(tipo)}
              title={`Añadir ${ETIQUETAS_TIPO[tipo].toLowerCase()}`}
            >
              <span className={`paleta__icono paleta__icono--${tipo}`} aria-hidden="true" />
              <span>{ETIQUETAS_TIPO[tipo]}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="ayuda">
        <strong>Atajos</strong>
        <ul>
          <li>
            <kbd>Doble clic</kbd> editar texto
          </li>
          <li>
            <kbd>Ctrl</kbd> + <kbd>Z</kbd> deshacer
          </li>
          <li>
            <kbd>Ctrl</kbd> + <kbd>D</kbd> duplicar nodo
          </li>
          <li>
            <kbd>Supr</kbd> eliminar selección
          </li>
        </ul>
      </div>
    </aside>
  );
}
