"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { UserRole } from "@/types/domain";

const menus: Record<UserRole, Array<[string, string, string]>> = {
  guest: [["⌂", "Početna", "/"], ["⌕", "Oglasi", "/oglasi"], ["▦", "Firme", "/firme"], ["+", "Firma", "/registracija?role=company"], ["↪", "Prijava", "/login"]],
  candidate: [["⌂", "Početna", "/"], ["⌕", "Oglasi", "/oglasi"], ["□", "Biogr.", "/profil/biografija"], ["✉", "Prijave", "/profil/prijave"], ["⚙", "Profil", "/profil"]],
  company: [["⌂", "Pregled", "/firma"], ["▤", "Oglasi", "/firma/oglasi"], ["+", "Novi", "/firma/novi-oglas"], ["☷", "Izbor", "/firma/selekcija"], ["€", "Uplata", "/firma/pretplata"]],
  admin: [["⌂", "Pregled", "/admin"], ["€", "Uplate", "/admin/uplate"], ["✓", "Oglasi", "/admin/oglasi"], ["☷", "Ljudi", "/admin/korisnici"], ["▦", "Firme", "/admin"]]
};

export function MobileNav() {
  const [role, setRole] = useState<UserRole>("guest");
  const supabase = createBrowserSupabase();

  useEffect(() => {
    async function loadRole() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return setRole("guest");
      const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setRole((profile.data?.role as UserRole) || "guest");
    }
    loadRole();
  }, []);

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
