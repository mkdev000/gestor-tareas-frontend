# ✅ KmTask — Gestor de Tareas (Frontend)

KmTask es una aplicación web full stack de gestión de tareas personales, con autenticación de usuarios: cada persona se registra, inicia sesión y organiza sus propias tareas por estado, prioridad, etiqueta y fecha límite, con vistas especiales como Recientes, Hoy, Próximo y Calendario.

🔗 Repositorio del backend: [gestor-tareas-backend](https://github.com/mkdev000/gestor-tareas-backend)

---

## Características principales

- 🔐 **Autenticación completa**: registro e inicio de sesión con contraseñas encriptadas y sesión mediante token (JWT).
- ✅ **Gestión de tareas**: crear, editar y borrar tareas, y marcarlas como pendientes o completadas.
- 🏷️ **Organización por etiqueta y prioridad**: cada tarea puede llevar una etiqueta (ej. Casa, Trabajo) y un nivel de prioridad con su propio color.
- 🕒 **Vistas inteligentes**: Recientes (últimas tareas creadas), Hoy, Próximo y Reportes con estadísticas de progreso.
- 📅 **Calendario mensual**: visualiza tus tareas marcadas en el día correspondiente según su fecha límite.
- 📱 **Diseño responsive**: barra lateral deslizante en dispositivos móviles.
- 🔒 **Privacidad por usuario**: cada persona solo puede ver y modificar sus propias tareas.

---

## 🛠️ Tecnologías utilizadas

**Frontend**
- <img src="https://skillicons.dev/icons?i=react" width="20" height="20" alt="React"/> **React** – Librería para construir toda la interfaz mediante componentes reutilizables.
- <img src="https://skillicons.dev/icons?i=ts" width="20" height="20" alt="TypeScript"/> **TypeScript** – Tipado estático para las tareas, formularios y props entre componentes.
- <img src="https://skillicons.dev/icons?i=tailwind" width="20" height="20" alt="Tailwind CSS"/> **Tailwind CSS** – Estilos de toda la interfaz, incluida la paleta de marca personalizada.
- <img src="https://skillicons.dev/icons?i=vite" width="20" height="20" alt="Vite"/> **Vite** – Empaquetado y servidor de desarrollo del proyecto.
- **React Router** – Navegación entre pantallas (login, registro, panel de tareas) y protección de rutas según sesión.

---

## Instalación local

```bash
git clone https://github.com/mkdev000/gestor-tareas-frontend.git
cd gestor-tareas-frontend
npm install
npm run dev
```

Necesita tener corriendo el [backend de KmTask](https://github.com/mkdev000/gestor-tareas-backend) para funcionar correctamente. Las URLs del backend están configuradas para apuntar al servicio ya desplegado en producción.

---

## 🚀 Despliegue

- **Frontend**: Desplegado en [Vercel](https://vercel.com)
- **Demo en vivo**: [https://kmtask.vercel.app](https://kmtask.vercel.app)
- **Backend**: desplegado en [Render](https://render.com)

---

## 📁 Estructura del proyecto

```
frontend/
├── public/
│   └── favicon.png
├── src/
│   ├── pages/
│   │   ├── Login.tsx           # Inicio de sesión
│   │   ├── Registro.tsx        # Registro de usuario nuevo
│   │   └── Tareas.tsx          # Panel principal: lógica y filtrado de vistas
│   ├── components/
│   │   ├── Sidebar.tsx         # Barra lateral de navegación
│   │   ├── FormularioTarea.tsx # Formulario modal para crear/editar tareas
│   │   ├── ListaTareas.tsx     # Lista de tareas con acciones rápidas
│   │   ├── Recientes.tsx       # Vista de línea de tiempo de tareas recientes
│   │   └── Calendario.tsx      # Vista de calendario mensual
│   ├── utils/
│   │   ├── colores.ts          # Color determinista por texto (avatar, etiquetas)
│   │   ├── fechas.ts           # Formateo seguro de fechas
│   │   ├── prioridad.ts        # Colores por nivel de prioridad
│   │   ├── estado.ts           # Colores por estado de la tarea
│   │   └── tiempo.ts           # Cálculo de tiempo relativo ("hace 2 horas")
│   ├── assets/
│   │   └── logo.png
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vercel.json
└── package.json
```

---

## Proyecto relacionado

- [Backend de KmTask](https://github.com/mkdev000/gestor-tareas-backend)

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).

## 👤 Autor

Desarrollado con ❤️ por [Kevin Mecinas](https://github.com/mkdev000)

---

## 📬 Contacto

- <img src="https://skillicons.dev/icons?i=gmail" width="20" height="20" alt="Email"/> [kevin009673@gmail.com](mailto:kevin009673@gmail.com)
- <img src="https://skillicons.dev/icons?i=linkedin" width="20" height="20" alt="LinkedIn"/> [Kevin Mecinas Jiménez](https://www.linkedin.com/in/kevin-mecinas-jim%C3%A9nez-46860a429/)
- <img src="https://skillicons.dev/icons?i=github" width="20" height="20" alt="GitHub"/> [@mkdev000](https://github.com/mkdev000)
