import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './styles.css';
import App from './App';

const contenedor = document.getElementById('root');
if (!contenedor) {
  throw new Error('No se encontró el contenedor de la aplicación.');
}

createRoot(contenedor).render(
  <StrictMode>
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  </StrictMode>,
);
