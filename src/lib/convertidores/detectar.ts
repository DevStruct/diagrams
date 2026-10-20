export function pareceMermaid(texto: string): boolean {
  const lineas = texto.replace(/\r\n?/g, '\n').split('\n').map((linea) => linea.trim());

  let i = 0;
  while (i < lineas.length && (!lineas[i] || lineas[i].startsWith('%%'))) i++;

  // Saltar el front matter (--- ... ---) si existe.
  if (i < lineas.length && lineas[i] === '---') {
    i++;
    while (i < lineas.length && lineas[i] !== '---') i++;
    i++;
  }

  while (i < lineas.length && (!lineas[i] || lineas[i].startsWith('%%'))) i++;

  return i < lineas.length && /^(?:flowchart|graph)\b/i.test(lineas[i]);
}
