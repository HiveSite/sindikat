"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { jobStatusLabels } from "@/lib/labels";

type AdminView = "dashboard" | "jobs" | "users" | "payments" | "companies";
type AdminRow = Record<string, any>;

const viewTitles: Record<AdminView, string> = {
  dashboard: "Pregled",
  jobs: "Oglasi",
  users: "Korisnici",
  payments: "Dokazi uplata",
  companies: "Firme"
};

export function AdminClient({ view }: { view: AdminView }) {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [stats, setStats] = useState({ jobs: 0, companies: 0, payments: 0, users: 0 });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabase();

  async function guardAdmin() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      window.location.href = "/login?next=/admin";
      return false;
    }
    const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile.data?.role !== "admin") {
      window.location.href = "/";
      return false;
    }
    return true;
  }

  async function load() {
    setLoading(true);
    setMessage("");
    if (!(await guardAdmin())) return;

    const [pendingJobs, pendingCompanies, pendingPayments, usersCount] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
      supabase.from("companies").select("id", { count: "exact", head: true }).eq("approved", false),
      supabase.from("payment_proofs").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("id", { count: "exact", head: true })
    ]);

    setStats({
      jobs: pendingJobs.count || 0,
      companies: pendingCompanies.count || 0,
      payments: pendingPayments.count || 0,
      users: usersCount.count || 0
    });

    const result =
      view === "dashboard"
        ? await supabase
          .from("payment_proofs")
          .select("*,orders(id,payment_reference,amount_eur,plan_id,company_id,status,plans(name)),companies(name)")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(8)
        : view === "users"
          ? await supabase.from("profiles").select("*").order("created_at", { ascending: false })
          : view === "payments"
            ? await supabase.from("payment_proofs").select("*,orders(id,payment_reference,amount_eur,plan_id,company_id,status,plans(name)),companies(name)").order("created_at", { ascending: false })
            : view === "companies"
              ? await supabase.from("companies").select("*").order("created_at", { ascending: false })
              : await supabase.from("jobs").select("*,companies(name)").order("created_at", { ascending: false });

    setRows(result.data || []);
    if (result.error) setMessage(result.error.message);
    setLoading(false);
  }

  useEffect(() => { load(); }, [view]);

  async function updateJob(id: number, patch: Record<string, unknown>) {
    const result = await supabase.from("jobs").update(patch).eq("id", id);
    setMessage(result.error?.message || "Oglas je azuriran.");
    await load();
  }

  async function updateCompany(id: number, approved: boolean) {
    const result = await supabase.from("companies").update({ approved }).eq("id", id);
    setMessage(result.error?.message || (approved ? "Firma je odobrena." : "Firma je sakrivena."));
    await load();
  }

  async function confirmProof(row: AdminRow) {
    if (row.status !== "pending") return setMessage("Ovaj dokaz je vec obradjen.");
    const { data, error } = await supabase.rpc("confirm_payment_proof", { proof_id: row.id });
    const activationCode = Array.isArray(data) ? data[0]?.activation_code : data?.activation_code;
    setMessage(error?.message || `Uplata je potvrdjena. Aktivacioni kod: ${activationCode || "kreiran"}.`);
    await load();
  }

  async function rejectProof(id: number) {
    const result = await supabase.from("payment_proofs").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
    setMessage(result.error?.message || "Dokaz uplate je odbijen.");
    await load();
  }

  async function openProof(filePath: string) {
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) return setMessage(error?.message || "Dokaz uplate nije dostupan.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const title = viewTitles[view];
  const rowsTitle = useMemo(() => view === "dashboard" ? "Uplate koje cekaju potvrdu" : title, [title, view]);

  return (
    <section>
      <div className="section-head">
        <div>
          <span className="page-label">Upravljanje</span>
          <h1>{title}</h1>
          <p className="sub">Pregled stavki koje traze provjeru i jasnu odluku.</p>
        </div>
      </div>

      {view === "dashboard" ? (
        <div className="dash-grid">
          <div className="metric"><strong>{stats.jobs}</strong><span>oglasa ceka pregled</span></div>
          <div className="metric"><strong>{stats.companies}</strong><span>firmi ceka odobrenje</span></div>
          <div className="metric"><strong>{stats.payments}</strong><span>uplata ceka potvrdu</span></div>
          <div className="metric"><strong>{stats.users}</strong><span>korisnika ukupno</span></div>
        </div>
      ) : null}

      <div className="section-head compact-head"><div><h2>{rowsTitle}</h2></div></div>
      <div className="table-card">
        {loading ? <div className="empty"><strong>Ucitavanje</strong><p>Uzimamo podatke iz baze.</p></div> : null}
        {!loading && rows.map((row) => (
          <div className="table-row" key={row.id}>
            <div>
              <strong>{row.title || row.email || row.full_name || row.payment_reference || row.name || row.orders?.payment_reference || row.id}</strong>
              <small>{row.description || row.companies?.name || row.orders?.plans?.name || row.role || row.status}</small>
            </div>
            <div>{row.role || (row.approved === false ? "Ceka odobrenje" : row.approved === true ? "Odobrena" : null) || jobStatusLabels[row.status as keyof typeof jobStatusLabels] || row.status || row.orders?.status}</div>
            <div>{row.amount_eur || row.orders?.amount_eur ? `${row.amount_eur || row.orders?.amount_eur} EUR` : row.created_at ? new Date(row.created_at).toLocaleDateString("sr-ME") : ""}</div>
            <div className="actions">
              {view === "jobs" ? <><button className="btn blue xs" onClick={() => updateJob(row.id, { status: "active" })}>Odobri</button><button className="btn red xs" onClick={() => updateJob(row.id, { status: "paused" })}>Pauziraj</button></> : null}
              {view === "companies" ? <><button className="btn blue xs" onClick={() => updateCompany(row.id, true)}>Odobri</button><button className="btn red xs" onClick={() => updateCompany(row.id, false)}>Sakrij</button></> : null}
              {(view === "payments" || view === "dashboard") ? <button className="btn ghost xs" onClick={() => openProof(row.file_path || row.proof_path)}>Otvori dokaz</button> : null}
              {(view === "payments" || view === "dashboard") && row.status === "pending" ? <><button className="btn blue xs" onClick={() => confirmProof(row)}>Potvrdi</button><button className="btn red xs" onClick={() => rejectProof(row.id)}>Odbij</button></> : null}
            </div>
          </div>
        ))}
        {!loading && !rows.length ? <div className="empty"><strong>Nema podataka</strong><p>Podaci ce se prikazati kada postoje u bazi.</p></div> : null}
      </div>
      {message ? <p className="notice">{message}</p> : null}
    </section>
  );
}
