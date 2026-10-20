import { aplanarArbol } from '../lib/mapaArbol';
import { useMapaStore } from '../store/mapaStore';

export function PanelMapas() {
  const mapas = useMapaStore((estado) => estado.mapas);
  const mapaActivoId = useMapaStore((estado) => estado.mapaActivoId);
  const seleccionadosIds = useMapaStore((estado) => estado.seleccionadosIds);
  const seleccionarMapa = useMapaStore((estado) => estado.seleccionarMapa);
  const crearMapa = useMapaStore((estado) => estado.crearMapa);
  const eliminarMapa = useMapaStore((estado) => estado.eliminarMapa);
  const seleccionarNodo = useMapaStore((estado) => estado.seleccionarNodo);
  const cambiarSeleccionNodo = useMapaStore((estado) => estado.cambiarSeleccionNodo);
  const agregarNodo = useMapaStore((estado) => estado.agregarNodo);

  const mapaActivo = mapas.find((mapa) => mapa.id === mapaActivoId);
  const seleccionado =
    seleccionadosIds.length === 1
      ? mapaActivo?.nodos.find((nodo) => nodo.id === seleccionadosIds[0])
      : undefined;
  const filas = mapaActivo ? aplanarArbol(mapaActivo.nodos) : [];

  const puedeSubproceso = seleccionado?.nivel === 1;
  const puedeActividad = seleccionado?.nivel === 2;

  const pista =
    seleccionadosIds.length > 1
      ? `${seleccionadosIds.length} nodos seleccionados. Arrástralos para moverlos juntos o pulsa Supr para eliminarlos.`
      : !seleccionado
        ? 'Selecciona un nodo del lienzo o de la estructura para añadir el nivel siguiente.'
        : seleccionado.nivel === 1
          ? 'Puedes añadir subprocesos al proceso seleccionado.'
          : seleccionado.nivel === 2
            ? 'Puedes añadir actividades al subproceso seleccionado.'
            : 'Una actividad no admite nodos dependientes.';

  return (
    <aside className="panel panel--izquierda">
      <section className="panel__seccion">
        <div className="panel__cabecera">
          <h2>Mapas de proceso</h2>
          <button type="button" className="boton boton--mini" onClick={crearMapa}>
            + Nuevo
          </button>
        </div>

        <ul className="diagramas diagramas--mapas">
          {mapas.map((mapa) => (
            <li
              key={mapa.id}
              className={`diagrama ${mapa.id === mapaActivoId ? 'diagrama--activo' : ''}`}
            >
              <button
                type="button"
                className="diagrama__abrir"
                onClick={() => seleccionarMapa(mapa.id)}
                title={mapa.nombre}
              >
                <span className="diagrama__nombre">{mapa.nombre || 'Sin título'}</span>
                <span className="diagrama__meta">
                  {mapa.nodos.length} {mapa.nodos.length === 1 ? 'nodo' : 'nodos'}
                </span>
              </button>
              <button
                type="button"
                className="diagrama__borrar"
                title="Eliminar mapa"
                aria-label={`Eliminar ${mapa.nombre || 'mapa'}`}
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Eliminar el mapa «${mapa.nombre || 'Sin título'}»? Esta acción no se puede deshacer.`,
                    )
                  ) {
                    eliminarMapa(mapa.id);
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
        <p className="pista-texto">{pista}</p>
        <div className="botones-mapa">
          <button
            type="button"
            className="boton"
            onClick={() => agregarNodo(1)}
            title="Añadir un proceso principal"
          >
            <span className="botones-mapa__nivel">N1</span>
            Proceso
          </button>
          <button
            type="button"
            className="boton"
            disabled={!puedeSubproceso}
            onClick={() => {
              if (seleccionado) agregarNodo(2, seleccionado.id);
            }}
            title={
              puedeSubproceso
                ? 'Añadir un subproceso al proceso seleccionado'
                : 'Selecciona un proceso para añadir un subproceso'
            }
          >
            <span className="botones-mapa__nivel">N2</span>
            Subproceso
          </button>
          <button
            type="button"
            className="boton"
            disabled={!puedeActividad}
            onClick={() => {
              if (seleccionado) agregarNodo(3, seleccionado.id);
            }}
            title={
              puedeActividad
                ? 'Añadir una actividad al subproceso seleccionado'
                : 'Selecciona un subproceso para añadir una actividad'
            }
          >
            <span className="botones-mapa__nivel">N3</span>
            Actividad
          </button>
        </div>
      </section>

      <section className="panel__seccion panel__seccion--crecer">
        <h2>Estructura</h2>
        {filas.length === 0 ? (
          <p className="pista-texto">Sin nodos. Añade un proceso principal.</p>
        ) : (
          <ul className="estructura">
            {filas.map(({ nodo, profundidad }) => (
              <li key={nodo.id}>
                <button
                  type="button"
                  className={`estructura__item ${
                    seleccionadosIds.includes(nodo.id) ? 'estructura__item--activo' : ''
                  }`}
                  style={{ paddingLeft: `${8 + profundidad * 14}px` }}
                  onClick={(evento) => {
                    if (evento.ctrlKey || evento.metaKey || evento.shiftKey) {
                      cambiarSeleccionNodo(
                        nodo.id,
                        !seleccionadosIds.includes(nodo.id),
                      );
                      return;
                    }
                    seleccionarNodo(nodo.id);
                  }}
                  title={nodo.etiqueta}
                >
                  <span className={`estructura__nivel estructura__nivel--${nodo.nivel}`}>
                    {nodo.nivel}
                  </span>
                  <span className="estructura__texto">{nodo.etiqueta}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="ayuda">
        <strong>Atajos</strong>
        <ul>
          <li>
            <kbd>Doble clic</kbd> editar texto
          </li>
          <li>
            <kbd>Ctrl/Mayús</kbd> + clic seleccionar varios
          </li>
          <li>
            <kbd>Arrastrar</kbd> mover y acomodar nodos
          </li>
          <li>
            <kbd>Tiradores</kbd> cambiar ancho y alto
          </li>
          <li>
            <kbd>Ctrl</kbd> + <kbd>Z</kbd> deshacer
          </li>
          <li>
            <kbd>Supr</kbd> eliminar selección y dependientes
          </li>
        </ul>
      </div>
    </aside>
  );
}
