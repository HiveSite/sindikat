"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { roleHomes, roleLabels } from "@/lib/labels";
import type { UserRole } from "@/types/domain";

export function Header() {
  const [role, setRole] = useState<UserRole>("guest");
  const [theme, setTheme] = useState("light");
  const [supabase] = useState(() => createBrowserSupabase());

  useEffect(() => {
    const saved = window.localStorage.getItem("imaposlaTheme") || "light";
    setTheme(saved);
    document.documentElement.dataset.theme = saved;

    async function loadRole() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return setRole("guest");
      const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setRole((profile.data?.role as UserRole) || "guest");
    }

    loadRole();
    const { data } = supabase.auth.onAuthStateChange(() => loadRole());
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("imaposlaTheme", next);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setRole("guest");
    window.location.href = "/";
  }

  const dashboardHref = role === "guest" ? "/login" : roleHomes[role as Exclude<UserRole, "guest">];

  return (
    <header className="top">
      <div className="top-in">
        <Link className="brand" href="/" aria-label="imaposla.me pocetna">
          <span className="mark">ip</span>
          <span>imaposla.me</span>
        </Link>
        <nav className="nav desktop-nav" aria-label="Glavna navigacija">
          <Link href="/oglasi">Oglasi</Link>
          <Link href="/gradovi">Gradovi</Link>
          <Link href="/kategorije">Kategorije</Link>
          <Link href="/firme">Firme</Link>
          {role !== "candidate" ? <Link href="/za-firme">Za firme</Link> : null}
        </nav>
        <div className="top-actions">
          <span className="role-pill">{role === "guest" ? "Niste prijavljeni" : `${roleLabels[role]} prijavljen`}</span>
          <button className="icon-btn" type="button" onClick={toggleTheme} aria-label="Promijeni temu">o</button>
          {role === "guest" ? (
            <>
              <Link className="btn ghost" href="/login">Prijava</Link>
              <Link className="btn blue" href="/registracija?role=company">Objavi oglas</Link>
            </>
          ) : (
            <>
              <Link className="btn ghost account-state" href={dashboardHref}>{roleLabels[role]}</Link>
              <button className="btn red account-state" type="button" onClick={signOut}>Odjava</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
