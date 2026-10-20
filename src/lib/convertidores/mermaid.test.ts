import { describe, expect, it } from 'vitest';
import { pareceMermaid } from './detectar';
import { convertirMermaid } from './index';
import { parsearMermaid } from './mermaid';

describe('pareceMermaid', () => {
  it('reconoce un flowchart básico', () => {
    expect(pareceMermaid('flowchart TD\n  A --> B')).toBe(true);
    expect(pareceMermaid('graph LR\n  A --> B')).toBe(true);
  });

  it('reconoce un flowchart con front matter', () => {
    expect(pareceMermaid('---\ntitle: Demo\n---\nflowchart LR\n  A --> B')).toBe(true);
  });

  it('rechaza contenido que no es Mermaid', () => {
    expect(pareceMermaid('{"diagramas": []}')).toBe(false);
    expect(pareceMermaid('esto no es un diagrama')).toBe(false);
  });
});

describe('parsearMermaid', () => {
  it('lee la cabecera y la dirección', () => {
    const resultado = parsearMermaid('flowchart LR\n  A --> B');
    expect(resultado.direccion).toBe('LR');
  });

  it('normaliza TD a TB', () => {
    const resultado = parsearMermaid('flowchart TD\n  A --> B');
    expect(resultado.direccion).toBe('TB');
  });

  it('lee el título del front matter', () => {
    const resultado = parsearMermaid('---\ntitle: Mi flujo\n---\nflowchart TD\n  A --> B');
    expect(resultado.nombre).toBe('Mi flujo');
  });

  it('mapea las formas a tipos de nodo', () => {
    const resultado = parsearMermaid(
      [
        'flowchart TD',
        '  A([Inicio]) --> B[Proceso]',
        '  B --> C{¿Sí?}',
        '  C --> D((Fin))',
        '  D --> E{{Seleccionar}}',
        '  E --> F[(Base de datos)]',
        '  F --> G[/Paralelo/]',
      ].join('\n'),
    );

    const porId = new Map(resultado.nodos.map((nodo) => [nodo.id, nodo]));
    expect(porId.get('A')?.tipo).toBe('inicio');
    expect(porId.get('B')?.tipo).toBe('proceso');
    expect(porId.get('C')?.tipo).toBe('decision');
    expect(porId.get('D')?.tipo).toBe('fin');
    expect(porId.get('E')?.tipo).toBe('accion');
    expect(porId.get('F')?.tipo).toBe('proceso');
    expect(porId.get('G')?.tipo).toBe('proceso');
  });

  it('extrae etiquetas de arista en sus tres formas', () => {
    const resultado = parsearMermaid(
      ['flowchart LR', '  A -->|Sí| B', '  A -- No --> C', '  A -.-> D', '  A ==> E'].join('\n'),
    );

    expect(resultado.aristas.map((arista) => arista.etiqueta)).toEqual(['Sí', 'No', '', '']);
  });

  it('expande cadenas en varias aristas', () => {
    const resultado = parsearMermaid('flowchart TB\n  A --> B --> C');
    expect(resultado.aristas).toHaveLength(2);
    expect(resultado.aristas[0]).toMatchObject({ origen: 'A', destino: 'B' });
    expect(resultado.aristas[1]).toMatchObject({ origen: 'B', destino: 'C' });
  });

  it('expande múltiples orígenes con &', () => {
    const resultado = parsearMermaid('flowchart TD\n  A & B --> C');
    expect(resultado.aristas).toHaveLength(2);
    expect(resultado.aristas.map((arista) => arista.origen)).toEqual(['A', 'B']);
  });

  it('decodifica entidades y saltos de línea', () => {
    const resultado = parsearMermaid('flowchart TD\n  A["Línea<br/>dos &amp; tres"]');
    expect(resultado.nodos[0].etiqueta).toBe('Línea\ndos & tres');
  });

  it('aplana los subgraph y avisa', () => {
    const resultado = parsearMermaid(
      ['flowchart TD', '  subgraph Zona', '    A[Uno] --> B[Dos]', '  end'].join('\n'),
    );

    expect(resultado.nodos).toHaveLength(2);
    expect(resultado.aristas).toHaveLength(1);
    expect(resultado.avisos).toHaveLength(1);
    expect(resultado.avisos[0]).toContain('subgraph');
  });

  it('avisa de classDef y style', () => {
    const resultado = parsearMermaid(
      ['flowchart TD', '  A --> B', '  classDef rojo fill:#f00', '  style A fill:#0f0'].join('\n'),
    );

    expect(resultado.avisos).toHaveLength(2);
  });

  it('asigna inicio y fin a las píldoras sin texto reconocible', () => {
    const resultado = parsearMermaid(
      ['flowchart TD', '  A([ ]) --> B[Paso]', '  B --> C([ ])'].join('\n'),
    );

    const porId = new Map(resultado.nodos.map((nodo) => [nodo.id, nodo]));
    expect(porId.get('A')?.tipo).toBe('inicio');
    expect(porId.get('C')?.tipo).toBe('fin');
  });

  it('registra nodos sueltos sin flechas', () => {
    const resultado = parsearMermaid('flowchart TD\n  A[Solo]');
    expect(resultado.nodos).toHaveLength(1);
    expect(resultado.nodos[0].etiqueta).toBe('Solo');
  });

  it('marca el enlace invisible ~~~ para el layout, sin dibujar arista', () => {
    const codigo = 'flowchart TD\n  N[Título] ~~~ A[Inicio]\n  A --> B';
    const resultado = parsearMermaid(codigo);
    const invisible = resultado.aristas.find((arista) => arista.invisible);
    expect(invisible).toMatchObject({ origen: 'N', destino: 'A' });

    const { diagrama } = convertirMermaid(codigo, 'Demo');
    expect(diagrama.nodos).toHaveLength(3);
    expect(diagrama.aristas).toHaveLength(1);
  });
});

describe('convertirMermaid', () => {
  it('lanza un error cuando no hay nodos', () => {
    expect(() => convertirMermaid('flowchart TD', 'Vacío')).toThrow();
  });

  it('construye un diagrama con nodos y aristas listos para el lienzo', () => {
    const { diagrama, avisos } = convertirMermaid(
      ['flowchart TD', '  A([Inicio]) --> B[Proceso]', '  B --> C{¿Sí?}', '  C -->|Sí| D([Fin])'].join(
        '\n',
      ),
      'Demo',
    );

    expect(avisos).toEqual([]);
    expect(diagrama.nombre).toBe('Demo');
    expect(diagrama.nodos).toHaveLength(4);
    expect(diagrama.aristas).toHaveLength(3);
    expect(diagrama.aristas[2].label).toBe('Sí');

    for (const nodo of diagrama.nodos) {
      expect(Number.isFinite(nodo.position.x)).toBe(true);
      expect(Number.isFinite(nodo.position.y)).toBe(true);
      expect(nodo.data.etiqueta.length).toBeGreaterThan(0);
    }

    for (const arista of diagrama.aristas) {
      expect(typeof arista.sourceHandle).toBe('string');
      expect(typeof arista.targetHandle).toBe('string');
    }
  });
});
