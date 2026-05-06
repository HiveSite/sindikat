"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { roleHomes, roleLabels, stageLabels } from "@/lib/labels";
import { normalizeRole } from "@/lib/auth-role";
import type { JobApplication, Profile, UserRole } from "@/types/domain";

type AccountState = {
  role: UserRole;
  profile: Profile | null;
  applications: JobApplication[];
};

function homeForRole(role: UserRole) {
  if (role === "guest") return "/login";
  return roleHomes[role];
}

export function DashboardClient({ expectedRole, title }: { expectedRole: Exclude<UserRole, "guest">; title: string }) {
  const [account, setAccount] = useState<AccountState>({ role: "guest", profile: null, applications: [] });
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createBrowserSupabase());

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const profile = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      const role = normalizeRole(profile.data?.role || user.user_metadata?.role || expectedRole);
      if (role !== expectedRole && role !== "admin") {
        window.location.href = homeForRole(role);
        return;
      }

      const applications = expectedRole === "candidate"
        ? await supabase.from("job_applications").select("*,jobs(title,companies(name))").eq("candidate_id", user.id).order("created_at", { ascending: false })
        : { data: [] };

      const profileData = (profile.data || {
        id: user.id,
        role,
        full_name: null,
        email: user.email || null,
        phone: null,
        city: null
      }) as Profile;

      setAccount({ role, profile: profileData, applications: (applications.data || []) as JobApplication[] });
      setLoading(false);
    }
    load();
  }, [expectedRole, supabase]);

  if (loading) return <div className="panel"><h1>Ucitavanje</h1><p className="lead">Spremamo podatke.</p></div>;

  return (
    <section>
      <div className="section-head"><div><span className="page-label">{title}</span><h1>{title}</h1><p className="sub">{account.profile?.email}</p></div></div>
      <div className="dash-grid">
        <div className="metric"><strong>{account.applications.length}</strong><span>Prijave</span></div>
        <div className="metric"><strong>{account.profile?.city || "-"}</strong><span>Grad</span></div>
        <div className="metric"><strong>{account.profile?.cv_data ? "Da" : "Ne"}</strong><span>Biografija</span></div>
        <div className="metric"><strong>{roleLabels[account.role]}</strong><span>Uloga</span></div>
      </div>
      {expectedRole === "candidate" ? (
        <div className="table-card">
          {account.applications.map((application) => <div className="table-row" key={application.id}><div><strong>{application.jobs?.title || "Prijava"}</strong><small>{application.reference_code}</small></div><div>{application.jobs?.companies?.name || ""}</div><div>{stageLabels[application.stage]}</div><div>{new Date(application.created_at).toLocaleDateString("sr-ME")}</div></div>)}
          {!account.applications.length ? <div className="empty"><strong>Nema prijava</strong><p>Prijave ce se prikazati ovdje cim apliciras.</p><Link className="btn blue" href="/oglasi">Otvori oglase</Link></div> : null}
        </div>
      ) : null}
    </section>
  );
}
