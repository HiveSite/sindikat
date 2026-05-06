"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function LogoutClient() {
  const [message, setMessage] = useState("Odjavljujemo nalog...");
  const [supabase] = useState(() => createBrowserSupabase());

  useEffect(() => {
    async function logout() {
      await supabase.auth.signOut();

      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith("sb-") || key.toLowerCase().includes("supabase")) {
          window.localStorage.removeItem(key);
        }
      }

      for (const key of Object.keys(window.sessionStorage)) {
        if (key.startsWith("sb-") || key.toLowerCase().includes("supabase")) {
          window.sessionStorage.removeItem(key);
        }
      }

      document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0]?.trim();
        if (name?.startsWith("sb-")) {
          document.cookie = `${name}=; Max-Age=0; path=/`;
        }
      });

      setMessage("Odjava je zavrsena.");
      window.location.replace("/login");
    }

    logout();
  }, [supabase]);

  return (
    <section className="auth-shell">
      <div className="panel">
        <span className="page-label">Odjava</span>
        <h1>{message}</h1>
        <p className="lead">Ako se stranica ne prebaci sama, otvori prijavu.</p>
        <Link className="btn blue" href="/login">Prijava</Link>
      </div>
    </section>
  );
}
