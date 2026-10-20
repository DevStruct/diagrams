import { useEffect, useRef, useState } from 'react';
import { mapaDesdeMermaid } from '../lib/mapaMermaid';
import { useMapaStore } from '../store/mapaStore';

interface PropiedadesDialogo {
  abierto: boolean;
  onCerrar: () => void;
  onMensaje: (texto: string) => void;
}

const EJEMPLO = `flowchart TB
    P["PE-02<br/>Estrategia comercial y precios"]

    P --> S1["PE-02.01<br/>Definir política de precios bajos"]
    P --> S2["PE-02.02<br/>Diseñar plan de marcas propias y promociones"]
    P --> S3["PE-02.03<br/>Analizar precios de la competencia"]
    P --> S4["PE-02.04<br/>Autorizar y publicar precios"]

    S1 --> A11["PE-02.01.01<br/>Definir criterios de margen por categoría"]
    S1 --> A12["PE-02.01.02<br/>Aprobar precios y diferenciaciones aplicables"]

    S2 --> A21["PE-02.02.01<br/>Seleccionar productos candidatos de marcas propias"]
    S2 --> A22["PE-02.02.02<br/>Definir calendario promocional"]

    S3 --> A31["PE-02.03.01<br/>Recopilar referencias de precios"]
    S3 --> A32["PE-02.03.02<br/>Evaluar ajustes competitivos"]

    S4 --> A41["PE-02.04.01<br/>Validar y registrar precios aprobados"]
    S4 --> A42["PE-02.04.02<br/>Coordinar publicación y verificar disponibilidad"]`;

export function DialogoMermaidMapa({
  abierto,
  onCerrar,
  onMensaje,
}: PropiedadesDialogo) {
  const importarMapas = useMapaStore((estado) => estado.importarMapas);
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

  const crear = () => {
    try {
      const { mapa, avisos: avisosConversion } = mapaDesdeMermaid(codigo, nombre.trim());
      importarMapas([mapa]);
      setError(null);

      for (const aviso of avisosConversion) {
        console.warn(`[Mermaid] ${aviso}`);
      }

      if (avisosConversion.length === 0) {
        onMensaje(`Mapa «${mapa.nombre}» creado desde Mermaid.`);
        onCerrar();
        return;
      }

      setAvisos(avisosConversion);
      onMensaje(
        `Mapa «${mapa.nombre}» creado con ${avisosConversion.length} aviso(s).`,
      );
    } catch (e) {
      setAvisos([]);
      setError(e instanceof Error ? e.message : 'No se pudo crear el mapa desde Mermaid.');
    }
  };

  return (
    <div
      className="dialogo-fondo"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <div
        className="dialogo"
        role="dialog"
        aria-modal="true"
        aria-label="Crear mapa desde Mermaid"
      >
        <header className="dialogo__cabecera">
          <h2>Crear mapa desde Mermaid</h2>
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
          <p className="pista-texto">
            La raíz del flowchart se convierte en proceso, sus hijos en subprocesos y
            los siguientes niveles en actividades.
          </p>

          <div className="campo">
            <label htmlFor="mermaid-mapa-codigo">Código Mermaid</label>
            <textarea
              id="mermaid-mapa-codigo"
              ref={areaRef}
              className="dialogo__codigo"
              value={codigo}
              spellCheck={false}
              placeholder={'flowchart TB\n  P[Proceso] --> S[Subproceso]\n  S --> A[Actividad]'}
              onChange={(evento) => setCodigo(evento.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="mermaid-mapa-nombre">Nombre del mapa (opcional)</label>
            <input
              id="mermaid-mapa-nombre"
              type="text"
              value={nombre}
              maxLength={80}
              placeholder="Se toma del nodo principal"
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
              <strong>El mapa se creó con estos avisos:</strong>
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
            <button
              type="button"
              className="boton"
              onClick={() => {
                setCodigo(EJEMPLO);
                setError(null);
              }}
            >
              Cargar ejemplo PE-02
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
                onClick={crear}
                disabled={!codigo.trim()}
              >
                Crear mapa
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
