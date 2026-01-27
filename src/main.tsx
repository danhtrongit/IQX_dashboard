import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import './index.css'
import '@fontsource-variable/manrope';
import App from './App.tsx'
import { AuthProvider } from './lib/auth-context.tsx'
import { StockProvider } from './lib/stock-context.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="iqx-theme"
    >
      <AuthProvider>
        <StockProvider>
          <App />
        </StockProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)

