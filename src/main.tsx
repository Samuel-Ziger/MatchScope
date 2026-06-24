import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { TeamsProvider } from './context/TeamsContext'
import { VotesProvider } from './context/VotesContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TeamsProvider>
      <VotesProvider>
        <App />
      </VotesProvider>
    </TeamsProvider>
  </StrictMode>,
)