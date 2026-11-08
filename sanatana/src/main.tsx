import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DataProvider } from './data/store.tsx'
import { App } from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </StrictMode>,
)
