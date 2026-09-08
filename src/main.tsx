import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx'
import { LoginScreen } from './components/LoginScreen.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

/**
 * Finche' la sessione non e' risolta mostriamo un caricamento; senza sessione
 * si mostra il login. App non viene montata prima che esistano utente e
 * organizzazione, cosi' useKV ha sempre uno scope valido su cui lavorare.
 */
function AuthGate() {
  const { session, organization, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Caricamento…</div>
      </div>
    )
  }

  if (!session) return <LoginScreen />

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-2 text-center">
          <p className="font-medium text-destructive">Inizializzazione fallita</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">
          Preparazione dell'area di lavoro…
        </div>
      </div>
    )
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  </ErrorBoundary>
)
