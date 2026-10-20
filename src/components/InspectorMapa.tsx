import {
  contarDescendientes,
  descendientesDe,
  hijosDe,
} from '../lib/mapaArbol';
import { ETIQUETAS_NIVEL, useMapaStore } from '../store/mapaStore';

export function InspectorMapa() {
  const mapa = useMapaStore((estado) =>
    estado.mapas.find((diagrama) => diagrama.id === estado.mapaActivoId),
  );
  const seleccionadosIds = useMapaStore((estado) => estado.seleccionadosIds);
  const seleccionarNodo = useMapaStore((estado) => estado.seleccionarNodo);
  const actualizarNodo = useMapaStore((estado) => estado.actualizarNodo);
  const agregarNodo = useMapaStore((estado) => estado.agregarNodo);
  const agregarHermano = useMapaStore((estado) => estado.agregarHermano);
  const moverNodo = useMapaStore((estado) => estado.moverNodo);
  const eliminarNodo = useMapaStore((estado) => estado.eliminarNodo);
  const eliminarNodos = useMapaStore((estado) => estado.eliminarNodos);

  const seleccionados = mapa
    ? mapa.nodos.filter((nodo) => seleccionadosIds.includes(nodo.id))
    : [];

  if (mapa && seleccionados.length > 1) {
    const seleccionadosSet = new Set(seleccionados.map((nodo) => nodo.id));
    const aEliminar = new Set(seleccionadosSet);

    for (const nodo of seleccionados) {
      for (const descendiente of descendientesDe(mapa.nodos, nodo.id)) {
        aEliminar.add(descendiente.id);
      }
    }

    const dependientes = aEliminar.size - seleccionadosSet.size;

    const confirmarEliminarVarios = () => {
      const mensaje =
        dependientes > 0
          ? `¿Eliminar ${seleccionados.length} nodos seleccionados y ${dependientes} nodo(s) dependiente(s)?`
          : `¿Eliminar ${seleccionados.length} nodos seleccionados?`;

      if (window.confirm(mensaje)) {
        eliminarNodos(seleccionados.map((nodo) => nodo.id));
      }
    };

    return (
      <aside className="panel panel--derecha">
        <div className="inspector">
          <h2>Selección múltiple</h2>
          <p className="inspeccion__vacio">
            {seleccionados.length} nodos seleccionados.
          </p>
          <ul className="inspeccion__vacio">
            {seleccionados.slice(0, 8).map((nodo) => (
              <li key={nodo.id}>{nodo.etiqueta}</li>
            ))}
            {seleccionados.length > 8 && (
              <li>… y {seleccionados.length - 8} más</li>
            )}
          </ul>
          <p className="inspeccion__vacio">
            Arrastra cualquiera de los nodos para mover el conjunto. Los tiradores de
            tamaño aparecen al seleccionar un único nodo.
          </p>
          <div className="inspector__acciones inspector__acciones--columna">
            <button
              type="button"
              className="boton"
              onClick={() => seleccionarNodo(null)}
            >
              Deseleccionar
            </button>
            <button
              type="button"
              className="boton boton--peligro"
              onClick={confirmarEliminarVarios}
            >
              {dependientes > 0 ? 'Eliminar con dependientes' : 'Eliminar seleccionados'}
            </button>
          </div>
        </div>
      </aside>
    );
  }

  const nodo = seleccionados.length === 1 ? seleccionados[0] : undefined;

  if (!mapa || !nodo) {
    return (
      <aside className="panel panel--derecha">
        <div className="inspector">
          <h2>Propiedades</h2>
          <p className="inspeccion__vacio">
            Selecciona un nodo para editar sus propiedades o varios para moverlos y
            eliminarlos juntos.
          </p>
          <ul className="inspeccion__vacio">
            <li>Doble clic en un nodo para editar su texto.</li>
            <li>Con Ctrl o Mayús + clic seleccionas varios nodos.</li>
            <li>Arrastra un nodo seleccionado para mover el conjunto.</li>
            <li>
              Con un solo nodo seleccionado, usa los tiradores para cambiar su tamaño.
            </li>
            <li>Selecciona un proceso para añadir subprocesos.</li>
            <li>Selecciona un subproceso para añadir actividades.</li>
          </ul>
        </div>
      </aside>
    );
  }

  const padre = nodo.padreId
    ? mapa.nodos.find((actual) => actual.id === nodo.padreId)
    : undefined;
  const hermanos = hijosDe(mapa.nodos, nodo.padreId);
  const indice = hermanos.findIndex((actual) => actual.id === nodo.id);
  const descendientes = contarDescendientes(mapa.nodos, nodo.id);

  const confirmarEliminar = () => {
    const mensaje =
      descendientes > 0
        ? `¿Eliminar «${nodo.etiqueta}» y sus ${descendientes} nodo(s) dependiente(s)?`
        : `¿Eliminar «${nodo.etiqueta}»?`;

    if (window.confirm(mensaje)) eliminarNodo(nodo.id);
  };

  return (
    <aside className="panel panel--derecha">
      <div className="inspector">
        <h2>Propiedades del nodo</h2>

        <div className="campo">
          <label htmlFor="mapa-nodo-texto">Texto</label>
          <textarea
            id="mapa-nodo-texto"
            value={nodo.etiqueta}
            onChange={(evento) => actualizarNodo(nodo.id, evento.target.value)}
          />
        </div>

        <div className="campo">
          <span className="campo__etiqueta">Nivel</span>
          <p className="mapa-dato">
            <span className={`estructura__nivel estructura__nivel--${nodo.nivel}`}>
              {nodo.nivel}
            </span>
            {ETIQUETAS_NIVEL[nodo.nivel]}
          </p>
        </div>

        <div className="campo">
          <span className="campo__etiqueta">Depende de</span>
          <p className="mapa-dato">{padre?.etiqueta ?? 'Ningún nodo (nivel principal)'}</p>
        </div>

        <div className="inspector__acciones inspector__acciones--columna">
          {nodo.nivel === 1 && (
            <button
              type="button"
              className="boton"
              onClick={() => agregarNodo(2, nodo.id)}
            >
              Añadir subproceso
            </button>
          )}
          {nodo.nivel === 2 && (
            <button
              type="button"
              className="boton"
              onClick={() => agregarNodo(3, nodo.id)}
            >
              Añadir actividad
            </button>
          )}
          <button
            type="button"
            className="boton"
            onClick={() => agregarHermano(nodo.id)}
          >
            Añadir hermano
          </button>
        </div>

        {hermanos.length > 1 && (
          <div className="campo">
            <span className="campo__etiqueta">Orden entre hermanos</span>
            <div className="inspector__acciones">
              <button
                type="button"
                className="boton"
                disabled={indice <= 0}
                onClick={() => moverNodo(nodo.id, -1)}
                title="Mover a la izquierda"
              >
                ← Mover
              </button>
              <button
                type="button"
                className="boton"
                disabled={indice < 0 || indice >= hermanos.length - 1}
                onClick={() => moverNodo(nodo.id, 1)}
                title="Mover a la derecha"
              >
                Mover →
              </button>
            </div>
          </div>
        )}

        <p className="inspeccion__vacio">
          El diagrama usa solo blanco, negro y líneas rectas. Puedes arrastrar y
          redimensionar los nodos; el texto se ajusta al tamaño de cada figura.
        </p>

        <div className="inspector__acciones">
          <button
            type="button"
            className="boton boton--peligro"
            onClick={confirmarEliminar}
          >
            {descendientes > 0 ? 'Eliminar con dependientes' : 'Eliminar'}
          </button>
        </div>
      </div>
    </aside>
  );
}
