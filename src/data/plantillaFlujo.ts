import type { Diagrama } from '../types';
import { construirDiagrama } from '../lib/convertidores/layout';
import { parsearMermaid } from '../lib/convertidores/mermaid';
import { crearDiagramaPlantilla as crearPlantillaRespaldo } from './plantilla';

const FLUJO_MERMAID = `flowchart TD
    N["Propuesta de flujo integral<br/>sujeta a validación interna"]

    I(["Inicio: requerimiento de control<br/>o incidencia comunicada"])
    A{"¿Qué origina<br/>el control?"}

    B["PM-07.01<br/>Definir alcance del inventario"]
    C["Contar existencias físicas"]
    D["Comparar existencias<br/>con los registros"]
    E{"¿Existen diferencias?"}
    F["Investigar movimientos<br/>y antecedentes"]
    G{"¿Qué resultado tiene<br/>la investigación?"}

    H["Documentar resultado conforme<br/>o diferencia aclarada"]
    J["Tramitar ajuste sustentado"]
    K{"¿Ajuste autorizado?"}
    L["Actualizar el registro<br/>y conservar el sustento"]
    M["Documentar y comunicar<br/>la diferencia pendiente"]

    O["PM-07.02<br/>Revisar fechas y condiciones<br/>del producto"]
    P{"¿Se identifica un producto<br/>no apto para venta?"}
    Q["Determinar y comunicar<br/>la necesidad de retiro"]
    R["PM-04<br/>Ejecutar retiro y separación<br/>física del producto"]
    S{"¿Existe riesgo de<br/>próximo vencimiento?"}
    T["Comunicar el riesgo y coordinar<br/>el tratamiento aplicable"]
    U["Registrar observación<br/>y seguimiento pendiente"]
    V["Documentar revisión<br/>sin incidencia"]

    W["PM-07.03<br/>Identificar cantidades<br/>y causas de pérdida"]
    X["Registrar la incidencia y<br/>tramitar su validación como merma"]
    Y{"¿Resultado de<br/>la evaluación?"}
    Z["Solicitar antecedentes<br/>o evaluación adicional"]
    AA["Tramitar el tratamiento<br/>y la baja correspondientes"]
    AB["Documentar la ejecución<br/>y comunicar efectos a finanzas"]
    AC["Actualizar o conciliar el inventario<br/>sin duplicar ajustes previos"]
    AD["Documentar la reclasificación<br/>y derivar al proceso correspondiente"]

    AE["PM-07.04<br/>Consolidar resultados, incidencias<br/>y pendientes de resolución"]
    AF["Analizar recurrencias<br/>y causas"]
    AG{"¿Se requieren<br/>acciones correctivas?"}
    AH["Comunicar y coordinar acciones<br/>con los procesos involucrados"]
    AJ["Dar seguimiento<br/>a su ejecución y resultados"]
    AK{"¿Es necesario<br/>reformular las acciones?"}
    AL["Revisar causas y<br/>reformular las acciones"]
    AM["Documentar conclusiones,<br/>resultados y pendientes"]
    AN(["Fin del ciclo de control:<br/>resultados trazables y pendientes<br/>identificados, si existen"])

    I --> A
    A -- Verificación de existencias --> B --> C --> D --> E
    E -- No --> H
    E -- Sí --> F --> G
    G -- Diferencia aclarada --> H
    G -- Ajuste sustentado --> J --> K
    G -- Pérdida identificada --> W
    G -- Sin explicación suficiente --> M
    K -- Sí --> L
    K -- No --> M

    A -- Revisión de fechas o condiciones --> O --> P
    P -- Sí --> Q --> R --> W
    P -- No --> S
    S -- Sí --> T --> U
    S -- No --> V

    A -- Pérdida comunicada --> W
    W --> X --> Y
    Y -- Falta información --> Z --> X
    Y -- Merma validada --> AA --> AB --> AC
    Y -- No corresponde merma --> AD

    H --> AE
    L --> AE
    M --> AE
    U --> AE
    V --> AE
    AC --> AE
    AD --> AE

    AE --> AF --> AG
    AG -- Sí --> AH --> AJ --> AK
    AK -- Sí --> AL --> AH
    AK -- No --> AM
    AG -- No --> AM
    AM --> AN

    N ~~~ I`;

/**
 * Plantilla inicial de la app: se construye con el conversor de Mermaid y el
 * layout automático de dagre a partir del flujo integral.
 */
export function crearDiagramaPlantilla(): Diagrama {
  try {
    const intermedio = parsearMermaid(FLUJO_MERMAID);
    if (intermedio.nodos.length === 0) {
      return crearPlantillaRespaldo();
    }
    return construirDiagrama(intermedio, 'Propuesta de flujo integral');
  } catch (error) {
    console.warn('No se pudo generar la plantilla desde Mermaid; se usa la de respaldo.', error);
    return crearPlantillaRespaldo();
  }
}
