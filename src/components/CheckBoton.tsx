// components/CheckBoton.tsx
// El check que se dibuja al pasar el ratón por el botón principal de Tachit (el mismo de "Entrar").
// Va dentro de un botón con la clase "boton-tachit".
function CheckBoton() {
  return (
    <svg className="check-tachit" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export default CheckBoton;
