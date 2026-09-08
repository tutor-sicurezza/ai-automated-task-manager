import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Warning } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'signin' | 'signup';

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

export function LoginScreen() {
  const { signIn, signUp, error } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const isSignUp = mode === 'signup';

  const resetFeedback = () => {
    setFieldErrors({});
    setFormError(null);
  };

  const switchMode = () => {
    setMode(isSignUp ? 'signin' : 'signup');
    resetFeedback();
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (isSignUp && !fullName.trim()) {
      errors.fullName = 'Il nome completo è obbligatorio';
    }

    if (!email.trim()) {
      errors.email = "L'email è obbligatoria";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Inserisci un indirizzo email valido';
    }

    if (!password) {
      errors.password = 'La password è obbligatoria';
    } else if (password.length < 6) {
      errors.password = 'La password deve contenere almeno 6 caratteri';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isSignUp) {
        const result = await signUp(email.trim(), password, fullName.trim());
        if (result.error) {
          setFormError(result.error);
          return;
        }
        if (result.needsConfirmation) {
          setConfirmationSent(true);
        }
      } else {
        const result = await signIn(email.trim(), password);
        if (result.error) {
          setFormError(result.error);
        }
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Si è verificato un errore imprevisto');
    } finally {
      setSubmitting(false);
    }
  };

  const visibleError = formError ?? error;

  return (
    <div className="bg-muted/30 flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">TaskFlow</h1>
          <p className="text-muted-foreground text-sm">
            Gestisci il lavoro del tuo team
          </p>
        </div>

        {confirmationSent ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle className="text-primary" weight="fill" />
                Controlla la tua email
              </CardTitle>
              <CardDescription>
                Abbiamo inviato un link di conferma a <strong>{email.trim()}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Apri il messaggio e clicca sul link per confermare il tuo account.
                Dopo la conferma potrai accedere a TaskFlow con le tue credenziali.
                Se non trovi l'email, controlla anche la cartella spam.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setConfirmationSent(false);
                  setMode('signin');
                  setPassword('');
                  resetFeedback();
                }}
              >
                Torna all'accesso
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {isSignUp ? 'Crea il tuo account' : 'Accedi'}
              </CardTitle>
              <CardDescription>
                {isSignUp
                  ? 'Registrati per iniziare a organizzare le attività del team.'
                  : 'Inserisci le tue credenziali per continuare.'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                {visibleError && (
                  <Alert variant="destructive">
                    <Warning weight="fill" />
                    <AlertTitle>Operazione non riuscita</AlertTitle>
                    <AlertDescription>{visibleError}</AlertDescription>
                  </Alert>
                )}

                {isSignUp && (
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      autoComplete="name"
                      placeholder="Mario Rossi"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      aria-invalid={Boolean(fieldErrors.fullName)}
                      disabled={submitting}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-destructive text-sm">{fieldErrors.fullName}</p>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nome@azienda.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.email)}
                    disabled={submitting}
                  />
                  {fieldErrors.email && (
                    <p className="text-destructive text-sm">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.password)}
                    disabled={submitting}
                  />
                  {fieldErrors.password ? (
                    <p className="text-destructive text-sm">{fieldErrors.password}</p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Almeno 6 caratteri.
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting
                    ? isSignUp
                      ? 'Registrazione in corso...'
                      : 'Accesso in corso...'
                    : isSignUp
                      ? 'Registrati'
                      : 'Accedi'}
                </Button>
              </form>
            </CardContent>

            {/*
              L'auto-registrazione e' disattivata: gli account li crea
              l'amministratore da "Manage Users". Il link "Registrati" e' stato
              rimosso di proposito.
              NOTA: questo nasconde solo il percorso nell'interfaccia. Il blocco
              effettivo va fatto in Supabase (Authentication -> Sign In /
              Providers -> "Allow new users to sign up"), altrimenti resta
              possibile chiamare /auth/v1/signup direttamente.
            */}
            <CardFooter className="justify-center">
              <p className="text-muted-foreground text-center text-sm">
                Gli account sono creati dall'amministratore.
                <br />
                Se non riesci ad accedere, contattalo.
              </p>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
