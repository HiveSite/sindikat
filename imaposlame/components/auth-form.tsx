"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { roleHomes } from "@/lib/labels";
import type { UserRole } from "@/types/domain";

export function LoginForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserSupabase();

  async function submit(formData: FormData) {
    setLoading(true);
    setMessage("");
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(/invalid login credentials/i.test(error.message) ? "E-pošta ili lozinka nijesu tačni." : error.message);
      setLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    const profile = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : null;
    const role = (profile?.data?.role || "candidate") as Exclude<UserRole, "guest">;
    window.location.href = roleHomes[role] || "/";
  }

  return (
    <form className="auth-form" action={submit}>
      <label><span className="label">E-pošta</span><input className="field" name="email" type="email" autoComplete="email" required /></label>
      <label><span className="label">Lozinka</span><input className="field" name="password" type="password" autoComplete="current-password" required /></label>
      <button className="btn blue" disabled={loading}>{loading ? "Prijava..." : "Prijavi se"}</button>
      <p>Upravljanje se ne bira javno. Sistem sam otvara dio koji pripada tvojoj ulozi.</p>
      {message ? <p className="notice">{message}</p> : null}
    </form>
  );
}

export function RegisterForm({ selectedRole }: { selectedRole: "candidate" | "company" }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserSupabase();

  async function submit(formData: FormData) {
    setLoading(true);
    setMessage("");
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const role = String(formData.get("role") || selectedRole);
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { role } } });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    setMessage("Nalog je kreiran. Sada se prijavi.");
    setLoading(false);
  }

  return (
    <form className="auth-form" action={submit}>
      <input type="hidden" name="role" value={selectedRole} />
      <label><span className="label">E-pošta</span><input className="field" name="email" type="email" autoComplete="email" required /></label>
      <label><span className="label">Lozinka</span><input className="field" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      <button className="btn blue" disabled={loading}>{loading ? "Kreiranje..." : "Kreiraj nalog"}</button>
      <p>Lozinka treba da ima najmanje 8 znakova.</p>
      {message ? <p className="notice">{message}</p> : null}
    </form>
  );
}
