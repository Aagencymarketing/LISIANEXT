"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signInAction, type AuthState } from "@/lib/auth/actions";
import { Button, Field, Input } from "@/components/ui";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { LogIn, Loader2 } from "lucide-react";

function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signInAction,
    {},
  );

  return (
    <div className="card p-6">
      <h1 className="text-xl font-bold">Accedi</h1>
      <p className="mt-1 text-sm text-muted">Entra nel tuo studio.</p>

      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="redirect" value={redirect} />
        <Field label="Email">
          <Input type="email" name="email" required autoComplete="email" placeholder="nome@studio.it" />
        </Field>
        <Field label="Password">
          <PasswordInput name="password" required autoComplete="current-password" placeholder="••••••••" />
        </Field>

        {state.error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {state.error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          Accedi
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/reset" className="text-muted hover:text-foreground">
          Password dimenticata?
        </Link>
        <Link href="/register" className="font-medium text-primary hover:underline">
          Crea un account
        </Link>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
