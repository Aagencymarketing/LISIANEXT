"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
}

function traduciErrore(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Email o password non corretti.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Esiste già un account con questa email.";
  if (m.includes("password should be at least"))
    return "La password deve avere almeno 6 caratteri.";
  if (m.includes("unable to validate email")) return "Email non valida.";
  if (m.includes("email not confirmed"))
    return "Conferma prima la tua email tramite il link ricevuto.";
  return msg;
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const redirectTo = String(formData.get("redirect") || "/") || "/";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: traduciErrore(error.message) };

  revalidatePath("/", "layout");
  redirect(redirectTo.startsWith("/") ? redirectTo : "/");
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const nome = String(formData.get("nome_completo") || "").trim();

  if (password.length < 6)
    return { error: "La password deve avere almeno 6 caratteri." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome_completo: nome } },
  });
  if (error) return { error: traduciErrore(error.message) };

  // Se le conferme email sono disattivate, la sessione è già attiva
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }
  return {
    message:
      "Registrazione completata. Controlla la tua email per confermare l'account, poi accedi.",
  };
}

export async function resetAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { error: traduciErrore(error.message) };
  return { message: "Ti abbiamo inviato un'email per reimpostare la password." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
