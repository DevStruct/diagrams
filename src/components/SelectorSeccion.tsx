export type SeccionApp = 'flujo' | 'mapas';

interface PropiedadesSelector {
  seccion: SeccionApp;
  onCambiar: (seccion: SeccionApp) => void;
}

export function SelectorSeccion({ seccion, onCambiar }: PropiedadesSelector) {
  return (
    <nav className="secciones" aria-label="Secciones de la aplicación">
      <button
        type="button"
        className={`seccion ${seccion === 'flujo' ? 'seccion--activa' : ''}`}
        aria-pressed={seccion === 'flujo'}
        onClick={() => onCambiar('flujo')}
        title="Diagramas de flujo"
      >
        Flujo
      </button>
      <button
        type="button"
        className={`seccion ${seccion === 'mapas' ? 'seccion--activa' : ''}`}
        aria-pressed={seccion === 'mapas'}
        onClick={() => onCambiar('mapas')}
        title="Mapas de proceso"
      >
        Mapas
      </button>
    </nav>
  );
}
