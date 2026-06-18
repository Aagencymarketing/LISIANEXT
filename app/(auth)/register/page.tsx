"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthState } from "@/lib/auth/actions";
import { Button, Field, Input } from "@/components/ui";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUpAction,
    {},
  );

  return (
    <div className="card p-6">
      <h1 className="text-xl font-bold">Crea il tuo account</h1>
      <p className="mt-1 text-sm text-muted">Registra il tuo studio su LisiaNext.</p>

      {state.message ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-500/10 dark:text-green-300">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{state.message}</span>
        </div>
      ) : (
        <form action={action} className="mt-5 space-y-4">
          <Field label="Nome e cognome">
            <Input name="nome_completo" required placeholder="Avv. Mario Rossi" autoComplete="name" />
          </Field>
          <Field label="Email">
            <Input type="email" name="email" required autoComplete="email" placeholder="nome@studio.it" />
          </Field>
          <Field label="Password" hint="Almeno 6 caratteri">
            <PasswordInput name="password" required autoComplete="new-password" placeholder="••••••••" />
          </Field>

          {state.error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Registrati
          </Button>
        </form>
      )}

      <div className="mt-4 text-center text-sm text-muted">
        Hai già un account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Accedi
        </Link>
      </div>
    </div>
  );
}
