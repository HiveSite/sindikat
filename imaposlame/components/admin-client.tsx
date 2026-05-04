"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

type AdminView = "dashboard" | "jobs" | "users" | "payments" | "companies";

export function AdminClient({ view }: { view: AdminView }) {
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [adminId, setAdminId] = useState("");
  const supabase = createBrowserSupabase();

  async function load() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return (window.location.href = "/login");
    setAdminId(user.id);
    const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile.data?.role !== "admin") return (window.location.href = "/");

    const result =
      view === "users"
        ? await supabase.from("profiles").select("*").order("created_at", { ascending: false })
        : view === "payments"
          ? await supabase.from("payment_proofs").select("*,orders(id,payment_reference,amount_eur,plan_id,company_id,status,plans(name)),companies(name)").order("created_at", { ascending: false })
          : view === "companies"
            ? await supabase.from("companies").select("*").order("created_at", { ascending: false })
            : await supabase.from("jobs").select("*,companies(name)").order("created_at", { ascending: false });

    setRows(result.data || []);
    if (result.error) setMessage(result.error.message);
  }

  useEffect(() => { load(); }, [view]);

  async function updateJob(id: number, patch: Record<string, unknown>) {
    const result = await supabase.from("jobs").update(patch).eq("id", id);
    setMessage(result.error?.message || "Oglas je ažuriran.");
    await load();
  }

  async function updateCompany(id: number, approved: boolean) {
    const result = await supabase.from("companies").update({ approved }).eq("id", id);
    setMessage(result.error?.message || (approved ? "Firma je odobrena." : "Firma je sakrivena."));
    await load();
  }

  async function confirmProof(row: any) {
    const order = row.orders;
    if (!order?.id) return setMessage("Dokaz nema povezanu narudžbu.");
    const activationCode = `IP-${Date.now()}`;
    const orderResult = await supabase.from("orders").update({
      status: "paid",
      confirmed_at: new Date().toISOString(),
      confirmed_by: adminId,
      activation_code: activationCode
    }).eq("id", order.id);
    if (orderResult.error) return setMessage(orderResult.error.message);

    const proofResult = await supabase.from("payment_proofs").update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId
    }).eq("id", row.id);
    if (proofResult.error) return setMessage(proofResult.error.message);

    const plan = order.plan_id ? await supabase.from("plans").select("unlock_credits").eq("id", order.plan_id).maybeSingle() : { data: null };
    const subscription = await supabase.from("subscriptions").insert({
      company_id: order.company_id,
      plan_id: order.plan_id,
      unlock_credits_remaining: plan.data?.unlock_credits || 0
    });
    setMessage(subscription.error?.message || `Uplata je potvrđena. Aktivacioni kod: ${activationCode}`);
    await load();
  }

  async function rejectProof(id: number) {
    const result = await supabase.from("payment_proofs").update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: adminId }).eq("id", id);
    setMessage(result.error?.message || "Dokaz uplate je odbijen.");
    await load();
  }

  async function openProof(filePath: string) {
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) return setMessage(error?.message || "Dokaz uplate nije dostupan.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const title = view === "payments" ? "Dokazi uplata" : view === "users" ? "Korisnici" : view === "companies" ? "Firme" : view === "jobs" ? "Oglasi" : "Pregled";

  return (
    <section>
      <div className="section-head"><div><span className="page-label">Upravljanje</span><h1>{title}</h1></div></div>
      <div className="table-card">
        {rows.map((row) => (
          <div className="table-row" key={row.id}>
            <div>
              <strong>{row.title || row.email || row.payment_reference || row.name || row.orders?.payment_reference || row.id}</strong>
              <small>{row.description || row.full_name || row.companies?.name || row.status}</small>
            </div>
            <div>{row.role || row.status || row.orders?.status || row.approved?.toString() || row.amount_eur || row.orders?.amount_eur}</div>
            <div>{row.created_at ? new Date(row.created_at).toLocaleDateString("sr-ME") : ""}</div>
            <div className="actions">
              {view === "jobs" ? <><button className="btn blue xs" onClick={() => updateJob(row.id, { status: "active" })}>Odobri</button><button className="btn red xs" onClick={() => updateJob(row.id, { status: "paused" })}>Pauziraj</button></> : null}
              {view === "companies" ? <><button className="btn blue xs" onClick={() => updateCompany(row.id, true)}>Odobri</button><button className="btn red xs" onClick={() => updateCompany(row.id, false)}>Sakrij</button></> : null}
              {view === "payments" ? <button className="btn ghost xs" onClick={() => openProof(row.file_path)}>Otvori dokaz</button> : null}
              {view === "payments" && row.status === "pending" ? <><button className="btn blue xs" onClick={() => confirmProof(row)}>Potvrdi</button><button className="btn red xs" onClick={() => rejectProof(row.id)}>Odbij</button></> : null}
            </div>
          </div>
        ))}
        {!rows.length ? <div className="empty"><strong>Nema podataka</strong><p>Podaci će se prikazati kada postoje u bazi.</p></div> : null}
      </div>
      {message ? <p className="notice">{message}</p> : null}
    </section>
  );
}
