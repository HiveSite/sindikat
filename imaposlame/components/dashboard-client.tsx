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
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        window.location.href = "/login";
        return;
      }

      const user = data.user;
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) console.error("[DashboardClient:profile]", profileError.message);

      // Role comes only from DB profile — never from user_metadata
      const role = normalizeRole(profileData?.role);

      if (role === "guest") {
        window.location.href = "/login";
        return;
      }

      if (role !== expectedRole && role !== "admin") {
        window.location.href = homeForRole(role);
        return;
      }

      let applicationsList: JobApplication[] = [];
      if (expectedRole === "candidate") {
        const { data: appData, error: appError } = await supabase
          .from("job_applications")
          .select("*,jobs(title,companies(name))")
          .eq("candidate_id", user.id)
          .order("created_at", { ascending: false });
        if (appError) console.error("[DashboardClient:applications]", appError.message);
        applicationsList = (appData || []) as JobApplication[];
      }

      const profileForState = (profileData || {
        id: user.id,
        role,
        full_name: null,
        email: user.email || null,
        phone: null,
        city: null
      }) as Profile;

      setAccount({ role, profile: profileForState, applications: applicationsList });
      setLoading(false);
    }
    load();
  }, [expectedRole, supabase]);

  if (loading) return (
    <div className="panel">
      <h1>Učitavanje</h1>
      <p className="lead">Spremamo podatke.</p>
    </div>
  );

  const cvPercent = (() => {
    const cv = account.profile?.cv_data;
    if (!cv) return 0;
    const fields = ["fullName", "title", "city", "phone", "email", "summary", "skills", "experience", "education"] as const;
    const filled = fields.filter((f) => Boolean((cv as Record<string, unknown>)[f])).length;
    return Math.round((filled / fields.length) * 100);
  })();

  return (
    <section>
      <div className="section-head">
        <div>
          <span className="page-label">{title}</span>
          <h1>{title}</h1>
          <p className="sub">{account.profile?.email}</p>
        </div>
        <div className="head-actions">
          {expectedRole === "candidate" && (
            <Link className="btn blue" href="/profil/biografija">Uredi biografiju</Link>
          )}
        </div>
      </div>

      <div className="dash-grid">
        <div className="metric"><strong>{account.applications.length}</strong><span>Prijave</span></div>
        <div className="metric"><strong>{account.profile?.city || "—"}</strong><span>Grad</span></div>
        <div className="metric"><strong>{cvPercent}%</strong><span>Biografija</span></div>
        <div className="metric"><strong>{roleLabels[account.role]}</strong><span>Uloga</span></div>
      </div>

      {cvPercent < 60 && expectedRole === "candidate" && (
        <div className="notice-card">
          <strong>Biografija nije kompletna ({cvPercent}%)</strong>
          <p>Dopuni biografiju da bi mogao slati prijave na oglase.</p>
          <Link className="btn blue" href="/profil/biografija">Dopuni biografiju</Link>
        </div>
      )}

      {expectedRole === "candidate" ? (
        <div className="table-card">
          <div className="table-head">
            <h2>Moje prijave</h2>
          </div>
          {account.applications.map((application) => (
            <div className="table-row" key={application.id}>
              <div>
                <strong>{application.jobs?.title || "Prijava"}</strong>
                <small>{application.reference_code}</small>
              </div>
              <div>{(application.jobs as any)?.companies?.name || ""}</div>
              <div>{stageLabels[application.stage]}</div>
              <div>{new Date(application.created_at).toLocaleDateString("sr-ME")}</div>
            </div>
          ))}
          {!account.applications.length ? (
            <div className="empty">
              <strong>Nema prijava</strong>
              <p>Prijave će se prikazati ovdje čim apliciraš.</p>
              <Link className="btn blue" href="/oglasi">Otvori oglase</Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
