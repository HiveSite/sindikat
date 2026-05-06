"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function LoginForm({ nextPath, errorMessage }: { nextPath?: string | null; errorMessage?: string | null }) {
  return (
    <form className="auth-form" action="/auth/login" method="post">
      <input type="hidden" name="next" value={nextPath || "/profil"} />
      <label><span className="label">E-posta</span><input className="field" name="email" type="email" autoComplete="email" required /></label>
      <label><span className="label">Lozinka</span><input className="field" name="password" type="password" autoComplete="current-password" required /></label>
      <button className="btn blue" type="submit">Prijavi se</button>
      <p>Upravljanje se ne bira javno. Sistem sam otvara dio koji pripada tvojoj ulozi.</p>
      {errorMessage ? <p className="notice">{errorMessage}</p> : null}
    </form>
  );
}

export function RegisterForm({ selectedRole }: { selectedRole: "candidate" | "company" }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserSupabase();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const role = String(formData.get("role") || selectedRole);
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { role } } });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    setMessage("Nalog je kreiran. Otvaramo prijavu.");
    setLoading(false);
    window.location.href = "/login";
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <input type="hidden" name="role" value={selectedRole} />
      <label><span className="label">E-posta</span><input className="field" name="email" type="email" autoComplete="email" required /></label>
      <label><span className="label">Lozinka</span><input className="field" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      <button className="btn blue" disabled={loading}>{loading ? "Kreiranje..." : "Kreiraj nalog"}</button>
      <p>Lozinka treba da ima najmanje 8 znakova.</p>
      {message ? <p className="notice">{message}</p> : null}
    </form>
  );
}
