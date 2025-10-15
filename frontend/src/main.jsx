import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AppcontextProvider } from './lib/Appcontext.jsx' // make sure it's a named export

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppcontextProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppcontextProvider>
  </StrictMode>
)
