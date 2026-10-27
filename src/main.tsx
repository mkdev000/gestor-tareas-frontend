import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ProveedorTema from './tema/ProveedorTema'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorTema>
        <App />
      </ProveedorTema>
    </BrowserRouter>
  </StrictMode>,
)