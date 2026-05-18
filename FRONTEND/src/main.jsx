import { StrictMode } from 'react' // Importa o StrictMode do React para detectar problemas e avisos no código durante o desenvolvimento
import { createRoot } from 'react-dom/client' // Importa a função createRoot para inicializar a árvore do React no DOM
import './index.css' // Importa o arquivo de estilos globais (Tailwind/CSS)
import App from './App.jsx' // Importa o componente principal da aplicação
import { ErrorBoundary } from './components/ErrorBoundary.jsx' // Importa o componente que captura erros de renderização e evita que a tela fique em branco

// Captura a div raiz do HTML e renderiza a aplicação
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
