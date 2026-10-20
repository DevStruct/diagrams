import { ETIQUETAS_TIPO, PALETA_NODOS, TIPOS_NODO } from '../data/colores';
import { useDiagramStore } from '../store/diagramStore';

export function Inspector() {
  const diagrama = useDiagramStore((estado) =>
    estado.diagramas.find((d) => d.id === estado.diagramaActivoId),
  );
  const actualizarNodo = useDiagramStore((estado) => estado.actualizarNodo);
  const duplicarNodo = useDiagramStore((estado) => estado.duplicarNodo);
  const eliminarNodo = useDiagramStore((estado) => estado.eliminarNodo);
  const actualizarEtiquetaArista = useDiagramStore((estado) => estado.actualizarEtiquetaArista);
  const eliminarArista = useDiagramStore((estado) => estado.eliminarArista);

  const nodo = diagrama?.nodos.find((n) => n.selected);
  const arista = diagrama?.aristas.find((a) => a.selected);

  if (!nodo && !arista) {
    return (
      <aside className="panel panel--derecha">
        <div className="inspector">
          <h2>Propiedades</h2>
          <p className="inspeccion__vacio">
            Selecciona un nodo o una conexión para editar su contenido y sus colores.
          </p>
          <ul className="inspeccion__vacio">
            <li>Doble clic en un nodo para cambiar su texto.</li>
            <li>Selecciona una conexión y haz doble clic en «+ etiqueta» para escribir Sí o No.</li>
            <li>Arrastra desde los puntos de un nodo para crear conexiones.</li>
          </ul>
        </div>
      </aside>
    );
  }

  if (nodo) {
    return (
      <aside className="panel panel--derecha">
        <div className="inspector">
          <h2>Propiedades del nodo</h2>

          <div className="campo">
            <label htmlFor="nodo-texto">Texto</label>
            <textarea
              id="nodo-texto"
              value={nodo.data.etiqueta}
              onChange={(evento) => actualizarNodo(nodo.id, { etiqueta: evento.target.value })}
            />
          </div>

          <div className="campo">
            <label htmlFor="nodo-tipo">Tipo</label>
            <select
              id="nodo-tipo"
              value={nodo.data.tipo}
              onChange={(evento) =>
                actualizarNodo(nodo.id, {
                  tipo: evento.target.value as (typeof TIPOS_NODO)[number],
                })
              }
            >
              {TIPOS_NODO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETAS_TIPO[tipo]}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <span className="campo__etiqueta">Color de relleno</span>
            <div className="muestras">
              {PALETA_NODOS.map((muestra) => (
                <button
                  key={muestra.nombre}
                  type="button"
                  className={`muestra ${
                    nodo.data.color.toLowerCase() === muestra.fondo.toLowerCase()
                      ? 'muestra--activa'
                      : ''
                  }`}
                  style={{ background: muestra.fondo }}
                  title={muestra.nombre}
                  aria-label={`Color ${muestra.nombre}`}
                  onClick={() =>
                    actualizarNodo(nodo.id, {
                      color: muestra.fondo,
                      colorTexto: muestra.texto,
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div className="campo campo--dos">
            <label>
              Fondo
              <input
                type="color"
                value={nodo.data.color}
                onChange={(evento) => actualizarNodo(nodo.id, { color: evento.target.value })}
              />
            </label>
            <label>
              Texto
              <input
                type="color"
                value={nodo.data.colorTexto}
                onChange={(evento) => actualizarNodo(nodo.id, { colorTexto: evento.target.value })}
              />
            </label>
          </div>

          <div className="inspector__acciones">
            <button
              type="button"
              className="boton"
              onClick={() => duplicarNodo(nodo.id)}
            >
              Duplicar
            </button>
            <button
              type="button"
              className="boton boton--peligro"
              onClick={() => eliminarNodo(nodo.id)}
            >
              Eliminar
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="panel panel--derecha">
      <div className="inspector">
        <h2>Propiedades de la conexión</h2>

        {arista && (
          <>
            <div className="campo">
              <label htmlFor="arista-texto">Etiqueta</label>
              <input
                id="arista-texto"
                type="text"
                value={typeof arista.label === 'string' ? arista.label : ''}
                placeholder="Sí, No, etc."
                onChange={(evento) =>
                  actualizarEtiquetaArista(arista.id, evento.target.value)
                }
              />
            </div>

            <p className="inspeccion__vacio">
              La etiqueta se muestra sobre la línea. También puedes editarla con doble clic.
            </p>

            <div className="inspector__acciones">
              <button
                type="button"
                className="boton boton--peligro"
                onClick={() => eliminarArista(arista.id)}
              >
                Eliminar conexión
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
