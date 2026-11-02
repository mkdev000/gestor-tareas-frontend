// pantallas/tareas/AnilloPrioridad.tsx
// El "anillo de tres tramos" de la prioridad (Fase 6, paso 6.2; elegido por Kevin: idea B2).
// Un círculo pequeño partido en 3 trozos, como una batería redonda: baja = 1 trozo, media = 2, alta = los 3.
// Se entiende aunque no se distingan bien los colores, porque se pueden contar los trozos llenos.
//  - AnilloPrioridad: solo el dibujo (lo usan las tarjetas del móvil)
//  - BotonPrioridad: el anillo + el nombre, y cada toque cambia la prioridad (caja de la web y hoja del móvil)
import type { Prioridad } from './frase';
import { PRIORIDADES, SIGUIENTE_PRIORIDAD } from './prioridades';

// Un trozo del anillo: un arco de 120° menos un huequito de 14° a cada lado, en un círculo de radio 8.
// Se calcula con seno y coseno: el punto de un círculo en el ángulo a es (centro + r·cos a, centro + r·sin a)
function tramo(i: number) {
  const r = 8;
  const c = 10;
  const inicio = ((-90 + i * 120 + 14) * Math.PI) / 180;
  const fin = ((-90 + (i + 1) * 120 - 14) * Math.PI) / 180;
  const punto = (a: number) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
  return `M${punto(inicio)} A${r} ${r} 0 0 1 ${punto(fin)}`;
}
const TRAMOS = [tramo(0), tramo(1), tramo(2)];

export function AnilloPrioridad({ prioridad, tam = 20, apagado = '#e3e8ef' }: { prioridad: Prioridad; tam?: number; apagado?: string }) {
  const estilo = PRIORIDADES[prioridad];
  return (
    <svg width={tam} height={tam} viewBox="0 0 20 20" aria-hidden="true" className="block shrink-0">
      {TRAMOS.map((d, i) => (
        <path key={i} d={d} fill="none" strokeWidth={3.2} strokeLinecap="round" stroke={i < estilo.nivel ? estilo.color : apagado} style={{ transition: 'stroke 0.2s' }} />
      ))}
    </svg>
  );
}

export function BotonPrioridad({ prioridad, alCambiar }: { prioridad: Prioridad; alCambiar: (nueva: Prioridad) => void }) {
  const estilo = PRIORIDADES[prioridad];
  const texto = `Prioridad ${estilo.nombre.toLowerCase()} · toca para cambiar`;
  return (
    <button type="button" onClick={() => alCambiar(SIGUIENTE_PRIORIDAD[prioridad])} title={texto} aria-label={texto} className="boton-prioridad">
      <AnilloPrioridad prioridad={prioridad} />
      <span className="min-w-[38px] text-left text-xs font-extrabold" style={{ color: estilo.texto, transition: 'color 0.2s' }}>
        {estilo.nombre}
      </span>
    </button>
  );
}
