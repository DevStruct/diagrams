import { useEffect, useRef, useState } from 'react';
import { convertirMermaid } from '../lib/convertidores';
import { useDiagramStore } from '../store/diagramStore';

interface PropiedadesDialogo {
  abierto: boolean;
  onCerrar: () => void;
  onMensaje: (texto: string) => void;
}

const EJEMPLO = `flowchart TD
  A([Inicio]) --> B[Recibir solicitud]
  B --> C{¿Está completa?}
  C -->|Sí| D[Procesar la solicitud]
  C -->|No| E[Solicitar datos faltantes]
  E --> B
  D --> F([Fin])`;

export function DialogoMermaid({ abierto, onCerrar, onMensaje }: PropiedadesDialogo) {
  const importarDiagramas = useDiagramStore((estado) => estado.importarDiagramas);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [avisos, setAvisos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!abierto) return;
    setError(null);
    setAvisos([]);
    const temporizador = window.setTimeout(() => areaRef.current?.focus(), 40);
    return () => window.clearTimeout(temporizador);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const convertir = () => {
    try {
      const resultado = convertirMermaid(codigo, nombre.trim());
      importarDiagramas([resultado.diagrama]);
      setError(null);

      if (resultado.avisos.length === 0) {
        onMensaje(`Diagrama «${resultado.diagrama.nombre}» creado desde Mermaid.`);
        onCerrar();
        return;
      }

      setAvisos(resultado.avisos);
      onMensaje(
        `Diagrama «${resultado.diagrama.nombre}» creado con ${resultado.avisos.length} aviso(s).`,
      );
    } catch (e) {
      setAvisos([]);
      setError(e instanceof Error ? e.message : 'No se pudo convertir el código Mermaid.');
    }
  };

  return (
    <div
      className="dialogo-fondo"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <div className="dialogo" role="dialog" aria-modal="true" aria-label="Convertir Mermaid">
        <header className="dialogo__cabecera">
          <h2>Convertir Mermaid</h2>
          <button
            type="button"
            className="boton boton--icono"
            onClick={onCerrar}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="dialogo__cuerpo">
          <div className="campo">
            <label htmlFor="mermaid-codigo">Código Mermaid</label>
            <textarea
              id="mermaid-codigo"
              ref={areaRef}
              className="dialogo__codigo"
              value={codigo}
              spellCheck={false}
              placeholder={'flowchart TD\n  A([Inicio]) --> B[Proceso]'}
              onChange={(evento) => setCodigo(evento.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="mermaid-nombre">Nombre del diagrama (opcional)</label>
            <input
              id="mermaid-nombre"
              type="text"
              value={nombre}
              maxLength={80}
              placeholder="Mi diagrama"
              onChange={(evento) => setNombre(evento.target.value)}
            />
          </div>

          {error && (
            <p className="dialogo__error" role="alert">
              {error}
            </p>
          )}

          {avisos.length > 0 && (
            <div className="dialogo__avisos">
              <strong>El diagrama se creó con estos avisos:</strong>
              <ul>
                {avisos.map((aviso, indice) => (
                  <li key={indice}>{aviso}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="dialogo__pie">
          {avisos.length === 0 && (
            <button type="button" className="boton" onClick={() => setCodigo(EJEMPLO)}>
              Cargar ejemplo
            </button>
          )}
          <span className="dialogo__espacio" />
          {avisos.length > 0 ? (
            <button type="button" className="boton boton--principal" onClick={onCerrar}>
              Entendido
            </button>
          ) : (
            <>
              <button type="button" className="boton" onClick={onCerrar}>
                Cancelar
              </button>
              <button
                type="button"
                className="boton boton--principal"
                onClick={convertir}
                disabled={!codigo.trim()}
              >
                Convertir y crear
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
