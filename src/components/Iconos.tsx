import type { SVGProps } from 'react';

type PropiedadesIcono = SVGProps<SVGSVGElement>;

const base: PropiedadesIcono = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function IconoDeshacer(props: PropiedadesIcono) {
  return (
    <svg {...base} {...props}>
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h10a5 5 0 0 1 0 10h-2" />
    </svg>
  );
}

export function IconoRehacer(props: PropiedadesIcono) {
  return (
    <svg {...base} {...props}>
      <path d="m15 7 5 5-5 5" />
      <path d="M20 12H10a5 5 0 0 0 0 10h2" />
    </svg>
  );
}

export function IconoAjustar(props: PropiedadesIcono) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9V5a1 1 0 0 1 1-1h4" />
      <path d="M15 4h4a1 1 0 0 1 1 1v4" />
      <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
      <path d="M9 20H5a1 1 0 0 1-1-1v-4" />
    </svg>
  );
}

export function IconoImagen(props: PropiedadesIcono) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m21 15-5-5L5 20" />
    </svg>
  );
}

export function IconoDescargar(props: PropiedadesIcono) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  );
}

export function IconoSubir(props: PropiedadesIcono) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21V9" />
      <path d="m7 14 5-5 5 5" />
      <path d="M4 3h16" />
    </svg>
  );
}

export function IconoDuplicar(props: PropiedadesIcono) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

export function IconoPapelera(props: PropiedadesIcono) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function IconoFlujo(props: PropiedadesIcono) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="8" height="6" rx="1.5" />
      <rect x="13" y="15" width="8" height="6" rx="1.5" />
      <path d="M7 9v5a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

export function IconoSeleccion(props: PropiedadesIcono) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8V5a1 1 0 0 1 1-1h3" />
      <path d="M16 4h3a1 1 0 0 1 1 1v3" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
      <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="m9.5 9.5 4.5 9 1.5-3.6 3.6-1.4z" />
    </svg>
  );
}
