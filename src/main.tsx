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
  const { session, organization, loading, error, signOut } = useAuth()

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

  // Nessuna organizzazione = account non censito da un amministratore.
  // Prima qui si restava su "Preparazione dell'area di lavoro…" perche' il
  // bootstrap creava un'organizzazione al volo per chiunque; ora non la crea
  // piu', quindi questo stato e' definitivo e va detto, non fatto girare.
  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-3 text-center">
          <p className="font-medium">Nessuna organizzazione associata</p>
          <p className="text-muted-foreground text-sm">
            Questo account non appartiene a nessuna organizzazione. Gli accessi
            sono assegnati da un amministratore: contattalo perche' ti aggiunga
            al gruppo di lavoro.
          </p>
          <button
            type="button"
            onClick={() => { void signOut() }}
            className="text-sm underline underline-offset-4"
          >
            Esci
          </button>
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
