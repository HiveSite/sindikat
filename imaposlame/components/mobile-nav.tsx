"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { loadCurrentRole } from "@/lib/auth-role";
import { mobileNavItems } from "@/lib/navigation";
import type { UserRole } from "@/types/domain";

export function MobileNav() {
  const [role, setRole] = useState<UserRole>("guest");
  const [supabase] = useState(() => createBrowserSupabase());

  useEffect(() => {
    async function loadRole() {
      setRole(await loadCurrentRole(supabase));
    }
    loadRole();
    const { data } = supabase.auth.onAuthStateChange(() => loadRole());
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  return (
    <nav className="mobile-app-nav" aria-label="Mobilna navigacija">
      {mobileNavItems[role].map((item) => (
        <Link href={item.href} key={`${item.label}-${item.href}`}>
          <span>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
