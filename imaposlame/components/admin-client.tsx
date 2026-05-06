"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { jobStatusLabels } from "@/lib/labels";

type AdminView = "dashboard" | "jobs" | "users" | "payments" | "companies";
type AdminRow = Record<string, any>;
type MsgState = { text: string; type: "info" | "error" | "success" };

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
  const [notice, setNotice] = useState<MsgState | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [supabase] = useState(() => createBrowserSupabase());

  function setMsg(text: string, type: MsgState["type"] = "info") {
    setNotice({ text, type });
  }

  async function guardAdmin(): Promise<boolean> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      window.location.href = "/login?next=/admin";
      return false;
    }
    const { data: profileData } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profileData?.role !== "admin") {
      window.location.href = "/";
      return false;
    }
    return true;
  }

  async function load() {
    setLoading(true);
    setNotice(null);
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

    let result;
    if (view === "dashboard") {
      result = await supabase
        .from("payment_proofs")
        .select("*,orders(id,payment_reference,amount_eur,plan_id,company_id,status,plans(name)),companies(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(8);
    } else if (view === "users") {
      result = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    } else if (view === "payments") {
      result = await supabase
        .from("payment_proofs")
        .select("*,orders(id,payment_reference,amount_eur,plan_id,company_id,status,plans(name)),companies(name)")
        .order("created_at", { ascending: false });
    } else if (view === "companies") {
      result = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    } else {
      result = await supabase.from("jobs").select("*,companies(name)").order("created_at", { ascending: false });
    }

    setRows(result?.data || []);
    if (result?.error) {
      console.error("[AdminClient:load]", result.error.message);
      setMsg(result.error.message, "error");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateJob(id: number, patch: Record<string, unknown>) {
    setActing(id);
    const { error } = await supabase.from("jobs").update(patch).eq("id", id);
    if (error) {
      console.error("[AdminClient:updateJob]", error.message);
      setMsg(error.message, "error");
    } else {
      setMsg("Oglas je ažuriran.", "success");
    }
    setActing(null);
    await load();
  }

  async function updateCompany(id: number, approved: boolean) {
    setActing(id);
    const { error } = await supabase.from("companies").update({ approved }).eq("id", id);
    if (error) {
      console.error("[AdminClient:updateCompany]", error.message);
      setMsg(error.message, "error");
    } else {
      setMsg(approved ? "Firma je odobrena." : "Firma je sakrivena.", "success");
    }
    setActing(null);
    await load();
  }

  async function confirmProof(row: AdminRow) {
    if (row.status !== "pending") { setMsg("Ovaj dokaz je već obrađen.", "error"); return; }
    setActing(row.id);
    const { data, error } = await supabase.rpc("confirm_payment_proof", { proof_id: row.id });
    if (error) {
      console.error("[AdminClient:confirmProof]", error.message);
      setMsg(error.message, "error");
    } else {
      const activationCode = Array.isArray(data) ? data[0]?.activation_code : data?.activation_code;
      setMsg(`Uplata je potvrđena. Aktivacioni kod: ${activationCode || "kreiran"}.`, "success");
    }
    setActing(null);
    await load();
  }

  async function rejectProof(id: number) {
    setActing(id);
    const { error } = await supabase.from("payment_proofs").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
    if (error) {
      console.error("[AdminClient:rejectProof]", error.message);
      setMsg(error.message, "error");
    } else {
      setMsg("Dokaz uplate je odbijen.", "info");
    }
    setActing(null);
    await load();
  }

  async function openProof(filePath: string) {
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) {
      setMsg(error?.message || "Dokaz uplate nije dostupan.", "error");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const title = viewTitles[view];
  const rowsTitle = useMemo(() => view === "dashboard" ? "Uplate koje čekaju potvrdu" : title, [title, view]);

  return (
    <section>
      <div className="section-head">
        <div>
          <span className="page-label">Upravljanje</span>
          <h1>{title}</h1>
          <p className="sub">Pregled stavki koje traže provjeru i jasnu odluku.</p>
        </div>
      </div>

      {view === "dashboard" ? (
        <div className="dash-grid">
          <div className="metric"><strong>{stats.jobs}</strong><span>oglasa čeka pregled</span></div>
          <div className="metric"><strong>{stats.companies}</strong><span>firmi čeka odobrenje</span></div>
          <div className="metric"><strong>{stats.payments}</strong><span>uplata čeka potvrdu</span></div>
          <div className="metric"><strong>{stats.users}</strong><span>korisnika ukupno</span></div>
        </div>
      ) : null}

      <div className="section-head compact-head"><div><h2>{rowsTitle}</h2></div></div>

      <div className="table-card">
        {loading ? (
          <div className="empty"><strong>Učitavanje</strong><p>Uzimamo podatke iz baze.</p></div>
        ) : null}

        {!loading && rows.map((row) => (
          <div className="table-row" key={row.id}>
            <div>
              <strong>
                {row.title || row.email || row.full_name || row.payment_reference || row.name || row.orders?.payment_reference || row.id}
              </strong>
              <small>
                {row.description?.slice(0, 60) || row.companies?.name || row.orders?.plans?.name || row.role || row.status}
              </small>
            </div>
            <div>
              {row.role ||
                (row.approved === false ? "Čeka odobrenje" : row.approved === true ? "Odobrena" : null) ||
                jobStatusLabels[row.status as keyof typeof jobStatusLabels] ||
                row.status ||
                row.orders?.status}
            </div>
            <div>
              {row.amount_eur || row.orders?.amount_eur
                ? `${row.amount_eur || row.orders?.amount_eur} EUR`
                : row.created_at ? new Date(row.created_at).toLocaleDateString("sr-ME") : ""}
            </div>
            <div className="actions">
              {view === "jobs" ? (
                <>
                  <button className="btn blue xs" disabled={acting === row.id} onClick={() => updateJob(row.id, { status: "active" })}>Odobri</button>
                  <button className="btn red xs" disabled={acting === row.id} onClick={() => updateJob(row.id, { status: "paused" })}>Pauziraj</button>
                </>
              ) : null}
              {view === "companies" ? (
                <>
                  <button className="btn blue xs" disabled={acting === row.id} onClick={() => updateCompany(row.id, true)}>Odobri</button>
                  <button className="btn red xs" disabled={acting === row.id} onClick={() => updateCompany(row.id, false)}>Sakrij</button>
                </>
              ) : null}
              {(view === "payments" || view === "dashboard") ? (
                <button className="btn ghost xs" onClick={() => openProof(row.file_path || row.proof_path)}>Otvori dokaz</button>
              ) : null}
              {(view === "payments" || view === "dashboard") && row.status === "pending" ? (
                <>
                  <button className="btn blue xs" disabled={acting === row.id} onClick={() => confirmProof(row)}>Potvrdi</button>
                  <button className="btn red xs" disabled={acting === row.id} onClick={() => rejectProof(row.id)}>Odbij</button>
                </>
              ) : null}
            </div>
          </div>
        ))}

        {!loading && !rows.length ? (
          <div className="empty">
            <strong>Nema podataka</strong>
            <p>Podaci će se prikazati kada postoje u bazi.</p>
          </div>
        ) : null}
      </div>

      {notice ? <p className={`notice ${notice.type}`}>{notice.text}</p> : null}
    </section>
  );
}
