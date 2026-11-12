// pantallas/calendario/ConmutadorVista.tsx
// El botón doble «Mes | Semana» del Calendario (Fase 8, paso 8.4).
// La vista elegida se guarda en la dirección (/calendario?vista=semana) con useSearchParams:
//  - al recargar la página sigues en la misma vista
//  - "replace" cambia la dirección sin añadir un paso al historial (el botón «atrás» no va de Mes a Semana)
// Lo usan la cabecera del Calendario en la web y el título grande del móvil (marco/MarcoApp.tsx).
import { useSearchParams } from 'react-router-dom';
import { vistaDeLaDireccion, type VistaCalendario } from './calendario';

function ConmutadorVista() {
  const [parametros, setParametros] = useSearchParams();
  const vista = vistaDeLaDireccion(parametros.get('vista'));
  const elegir = (v: VistaCalendario) =>
    setParametros(
      (p) => {
        const nuevos = new URLSearchParams(p);
        if (v === 'semana') nuevos.set('vista', 'semana');
        else nuevos.delete('vista');
        return nuevos;
      },
      { replace: true },
    );

  return (
    <div role="group" aria-label="Ver el calendario por" className="cal-conmutador">
      <button type="button" aria-pressed={vista === 'mes'} onClick={() => elegir('mes')}>
        Mes
      </button>
      <button type="button" aria-pressed={vista === 'semana'} onClick={() => elegir('semana')}>
        Semana
      </button>
    </div>
  );
}

export default ConmutadorVista;
