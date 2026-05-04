"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function AdminClient({ view }: { view: "dashboard" | "jobs" | "users" | "payments" }) {
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const supabase = createBrowserSupabase();

  async function load() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return (window.location.href = "/login");
    const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile.data?.role !== "admin") return (window.location.href = "/");
    const table = view === "users" ? "profiles" : view === "payments" ? "orders" : "jobs";
    const result = await supabase.from(table).select("*").order("created_at", { ascending: false });
    setRows(result.data || []);
  }

  useEffect(() => { load(); }, [view]);

  async function updateJob(id: number, patch: Record<string, unknown>) {
    const result = await supabase.from("jobs").update(patch).eq("id", id);
    setMessage(result.error?.message || "Oglas je ažuriran.");
    await load();
  }

  async function confirmOrder(id: number) {
    const result = await supabase.from("orders").update({ status: "paid", confirmed_at: new Date().toISOString(), activation_code: `IP-${Date.now()}` }).eq("id", id);
    setMessage(result.error?.message || "Uplata je potvrđena.");
    await load();
  }

  return (
    <section>
      <div className="section-head"><div><span className="page-label">Upravljanje</span><h1>{view === "payments" ? "Uplate" : view === "users" ? "Korisnici" : view === "jobs" ? "Oglasi" : "Pregled"}</h1></div></div>
      <div className="table-card">
        {rows.map((row) => <div className="table-row" key={row.id}><div><strong>{row.title || row.email || row.payment_reference || row.name || row.id}</strong><small>{row.description || row.full_name || row.status}</small></div><div>{row.role || row.status || row.amount_eur}</div><div>{row.created_at ? new Date(row.created_at).toLocaleDateString("sr-ME") : ""}</div><div className="actions">{view === "jobs" ? <><button className="btn blue xs" onClick={() => updateJob(row.id, { status: "active" })}>Odobri</button><button className="btn red xs" onClick={() => updateJob(row.id, { status: "paused" })}>Pauziraj</button></> : null}{view === "payments" && row.status === "pending" ? <button className="btn blue xs" onClick={() => confirmOrder(row.id)}>Potvrdi</button> : null}</div></div>)}
        {!rows.length ? <div className="empty"><strong>Nema podataka</strong><p>Podaci će se prikazati kada postoje u bazi.</p></div> : null}
      </div>
      {message ? <p className="notice">{message}</p> : null}
    </section>
  );
}
