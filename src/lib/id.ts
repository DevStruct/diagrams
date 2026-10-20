export function nuevoId(prefijo: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefijo}-${crypto.randomUUID()}`;
  }
  return `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
