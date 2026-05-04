"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { UserRole } from "@/types/domain";

const menus: Record<UserRole, Array<[string, string, string]>> = {
  guest: [["IP", "Pocetna", "/"], ["OO", "Oglasi", "/oglasi"], ["FI", "Firme", "/firme"], ["+", "Firma", "/registracija?role=company"], ["IN", "Prijava", "/login"]],
  candidate: [["IP", "Pocetna", "/"], ["OO", "Oglasi", "/oglasi"], ["CV", "Biografija", "/profil/biografija"], ["PR", "Prijave", "/profil/prijave"], ["JA", "Profil", "/profil"]],
  company: [["FI", "Pregled", "/firma"], ["OG", "Oglasi", "/firma/oglasi"], ["+", "Novi", "/firma/novi-oglas"], ["SE", "Izbor", "/firma/selekcija"], ["UP", "Uplata", "/firma/pretplata"]],
  admin: [["AD", "Pregled", "/admin"], ["UP", "Uplate", "/admin/uplate"], ["OG", "Oglasi", "/admin/oglasi"], ["KO", "Ljudi", "/admin/korisnici"], ["FI", "Firme", "/admin/firme"]]
};

export function MobileNav() {
  const [role, setRole] = useState<UserRole>("guest");
  const [supabase] = useState(() => createBrowserSupabase());

  useEffect(() => {
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

  return (
    <nav className="mobile-app-nav" aria-label="Mobilna navigacija">
      {menus[role].map(([icon, label, href]) => (
        <Link href={href} key={`${label}-${href}`}>
          <span>{icon}</span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
