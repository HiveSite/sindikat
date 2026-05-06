"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { slugify } from "@/lib/format";
import { stageLabels, stageOrder } from "@/lib/labels";
import type { Company, Job, JobApplication, LookupItem, Order, PaymentProof, Plan } from "@/types/domain";

type MsgState = { text: string; type: "info" | "error" | "success" };

function msg(text: string, type: MsgState["type"] = "info"): MsgState {
  return { text, type };
}

export function CompanyClient({ view }: { view: "dashboard" | "jobs" | "new-job" | "selection" | "billing" }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cities, setCities] = useState<LookupItem[]>([]);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [notice, setNotice] = useState<MsgState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supabase] = useState(() => createBrowserSupabase());

  async function load() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    const user = data.user;
    const { data: profileData } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileData?.role !== "company" && profileData?.role !== "admin") {
      window.location.href = "/profil";
      return;
    }

    const [cityRows, categoryRows, planRows, companyResult] = await Promise.all([
      supabase.from("cities").select("id,name,slug").order("name"),
      supabase.from("categories").select("id,name,slug").order("name"),
      supabase.from("plans").select("*").order("price_eur"),
      supabase.from("companies").select("*").eq("owner_id", user.id).maybeSingle()
    ]);

    const myCompany = companyResult.data as Company | null;
    setCities((cityRows.data || []) as LookupItem[]);
    setCategories((categoryRows.data || []) as LookupItem[]);
    setPlans((planRows.data || []) as Plan[]);
    setCompany(myCompany);

    if (myCompany) {
      const [jobRows, appRows, orderRows, proofRows] = await Promise.all([
        supabase.from("jobs").select("*,companies(id,name,slug),categories(id,name),cities(id,name)").eq("company_id", myCompany.id).order("created_at", { ascending: false }),
        supabase.from("job_applications").select("*,jobs!inner(id,title,company_id),profiles(full_name,email,phone,city,cv_data,cv_updated_at)").eq("jobs.company_id", myCompany.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*,plans(name),companies(name)").eq("company_id", myCompany.id).order("created_at", { ascending: false }),
        supabase.from("payment_proofs").select("*,orders(payment_reference,amount_eur,status,plans(name))").eq("company_id", myCompany.id).order("created_at", { ascending: false })
      ]);
      setJobs((jobRows.data || []) as Job[]);
      setApplications((appRows.data || []) as JobApplication[]);
      setOrders((orderRows.data || []) as Order[]);
      setProofs((proofRows.data || []) as PaymentProof[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) { setSaving(false); return; }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    if (!name) { setNotice(msg("Upiši naziv firme.", "error")); setSaving(false); return; }

    const row = {
      owner_id: user.id,
      name,
      slug: company?.slug || `${slugify(name)}-${user.id.slice(0, 8)}`,
      city: String(formData.get("city") || "").trim(),
      industry: String(formData.get("industry") || "").trim(),
      description: String(formData.get("description") || "").trim()
    };

    const result = company
      ? await supabase.from("companies").update(row).eq("id", company.id)
      : await supabase.from("companies").insert(row);

    if (result.error) {
      console.error("[CompanyClient:saveCompany]", result.error.message);
      setNotice(msg(result.error.message, "error"));
    } else {
      setNotice(msg(company ? "Profil firme je sačuvan." : "Profil firme je kreiran i čeka odobrenje.", "success"));
    }
    setSaving(false);
    await load();
  }

  async function createJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!company) { setNotice(msg("Prvo kreiraj profil firme.", "error")); return; }
    if (!company.approved) { setNotice(msg("Profil firme mora biti odobren prije slanja oglasa.", "error")); return; }

    setSaving(true);
    setNotice(null);
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const categoryId = Number(formData.get("category_id"));
    const cityId = Number(formData.get("city_id"));
    if (!title) { setNotice(msg("Upiši naziv pozicije.", "error")); setSaving(false); return; }
    if (!categoryId || !cityId) { setNotice(msg("Izaberi grad i kategoriju.", "error")); setSaving(false); return; }

    const row = {
      company_id: company.id,
      category_id: categoryId,
      city_id: cityId,
      title,
      slug: `${slugify(title)}-${Date.now()}`,
      description: String(formData.get("description") || "").trim(),
      contract_type: String(formData.get("contract_type") || "").trim(),
      salary_text: String(formData.get("salary_text") || "").trim(),
      deadline: String(formData.get("deadline") || "") || null,
      status: "pending_review",
      featured: false
    };

    const { error } = await supabase.from("jobs").insert(row);
    if (error) {
      console.error("[CompanyClient:createJob]", error.message);
      setNotice(msg(error.message, "error"));
    } else {
      setNotice(msg("Oglas je poslat na odobrenje.", "success"));
      (event.target as HTMLFormElement).reset();
    }
    setSaving(false);
    await load();
  }

  async function moveStage(id: number, next: string) {
    const { error } = await supabase.from("job_applications").update({ stage: next }).eq("id", id);
    if (error) {
      console.error("[CompanyClient:moveStage]", error.message);
      setNotice(msg(error.message, "error"));
    } else {
      setNotice(msg("Status prijave je promijenjen.", "success"));
    }
    await load();
  }

  async function orderPlan(plan: Plan, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!company) return;
    setSaving(true);
    setNotice(null);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("proof");
    if (!(file instanceof File) || !file.size) {
      setNotice(msg("Dodaj dokaz uplate prije slanja.", "error"));
      setSaving(false);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice(msg("Fajl je prevelik. Maksimalna veličina je 10MB.", "error"));
      setSaving(false);
      return;
    }

    const { data: orderData, error: orderError } = await supabase.from("orders").insert({
      company_id: company.id,
      plan_id: plan.id,
      status: "pending",
      amount_eur: plan.price_eur,
      payment_reference: `IP-${Date.now()}`
    }).select("id,payment_reference").single();

    if (orderError || !orderData) {
      console.error("[CompanyClient:orderPlan:order]", orderError?.message);
      setNotice(msg(orderError?.message || "Narudžba nije kreirana.", "error"));
      setSaving(false);
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const filePath = `${company.id}/${orderData.id}-${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(filePath, file, { upsert: false });
    if (uploadError) {
      await supabase.from("orders").delete().eq("id", orderData.id).eq("status", "pending");
      console.error("[CompanyClient:orderPlan:upload]", uploadError.message);
      setNotice(msg(`Dokaz nije poslat: ${uploadError.message}`, "error"));
      setSaving(false);
      return;
    }

    const { error: proofError } = await supabase.from("payment_proofs").insert({
      order_id: orderData.id,
      company_id: company.id,
      amount_eur: plan.price_eur,
      file_path: filePath,
      proof_path: filePath,
      file_name: file.name,
      note: String(formData.get("note") || "").trim() || null,
      status: "pending"
    });

    if (proofError) {
      await supabase.storage.from("payment-proofs").remove([filePath]);
      await supabase.from("orders").delete().eq("id", orderData.id).eq("status", "pending");
      console.error("[CompanyClient:orderPlan:proof]", proofError.message);
      setNotice(msg(`Dokaz nije sačuvan: ${proofError.message}`, "error"));
      setSaving(false);
      return;
    }

    setNotice(msg(`Dokaz je poslat. Poziv na broj: ${orderData.payment_reference}`, "success"));
    (event.target as HTMLFormElement).reset();
    setSaving(false);
    await load();
  }

  if (loading) return (
    <div className="panel">
      <h1>Učitavanje</h1>
      <p className="lead">Spremamo firmu.</p>
    </div>
  );

  const noticeEl = notice ? <p className={`notice ${notice.type}`}>{notice.text}</p> : null;

  if (!company || view === "dashboard") {
    return (
      <section>
        <div className="section-head">
          <div>
            <span className="page-label">Firma</span>
            <h1>Pregled firme</h1>
            <p className="sub">Profil firme, oglasi i prijave.</p>
          </div>
        </div>
        {company && !company.approved && (
          <div className="notice-card">
            <strong>Profil firme čeka odobrenje</strong>
            <p>Admin pregleda profil i aktivira ga. Oglas možeš poslati nakon odobrenja.</p>
          </div>
        )}
        <form className="form-card" onSubmit={saveCompany}>
          <label><span className="label">Naziv firme</span><input className="field" name="name" defaultValue={company?.name || ""} required /></label>
          <div className="form-grid">
            <label><span className="label">Grad</span><input className="field" name="city" defaultValue={company?.city || ""} /></label>
            <label><span className="label">Djelatnost</span><input className="field" name="industry" defaultValue={company?.industry || ""} /></label>
          </div>
          <label><span className="label">Opis</span><textarea className="textarea" name="description" defaultValue={company?.description || ""} /></label>
          <button className="btn blue" disabled={saving}>{saving ? "Čuvanje..." : "Sačuvaj profil firme"}</button>
          {noticeEl}
        </form>
      </section>
    );
  }

  if (view === "new-job") {
    return (
      <section>
        <div className="section-head">
          <div>
            <span className="page-label">Firma</span>
            <h1>Novi oglas</h1>
            <p className="sub">Oglas ide na pregled prije javnog prikaza.</p>
          </div>
        </div>
        {!company.approved && (
          <div className="notice-card">
            <strong>Profil firme čeka odobrenje</strong>
            <p>Oglas možeš poslati nakon odobrenja profila firme.</p>
          </div>
        )}
        <form className="form-card" onSubmit={createJob}>
          <label><span className="label">Naziv pozicije</span><input className="field" name="title" placeholder="npr. Konobar/konobarica" required /></label>
          <div className="form-grid">
            <label>
              <span className="label">Grad</span>
              <select className="select" name="city_id" required>
                <option value="">Izaberi grad</option>
                {cities.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Kategorija</span>
              <select className="select" name="category_id" required>
                <option value="">Izaberi kategoriju</option>
                {categories.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <div className="form-grid">
            <input className="field" name="contract_type" placeholder="Stalni rad, sezonski..." />
            <input className="field" name="salary_text" placeholder="Plata / po dogovoru" />
          </div>
          <label><span className="label">Rok prijave</span><input className="field" type="date" name="deadline" /></label>
          <label><span className="label">Opis oglasa</span><textarea className="textarea" name="description" placeholder="Opis posla, uslovi, šta nudite..." required /></label>
          <button className="btn blue" disabled={saving || !company.approved}>{saving ? "Slanje..." : "Pošalji na odobrenje"}</button>
          {noticeEl}
        </form>
      </section>
    );
  }

  if (view === "selection") {
    return (
      <section>
        <div className="selection-intro">
          <span className="kicker">Selekcija prijava</span>
          <h1>Pregled kandidata po fazama</h1>
          <p>Firma vidi prijave na svoje oglase i vodi ih kroz faze.</p>
        </div>
        {!applications.length ? (
          <div className="empty">
            <strong>Nema prijava</strong>
            <p>Prijave će se pojaviti kada kandidati apliciraju na tvoje oglase.</p>
          </div>
        ) : (
          <div className="kanban-wrap">
            <div className="kanban">
              {stageOrder.map((stage) => (
                <div className="kanban-column" key={stage}>
                  <div className="kanban-head">
                    <h4>{stageLabels[stage]}</h4>
                    <span className="badge gray">{applications.filter((a) => a.stage === stage).length}</span>
                  </div>
                  {applications.filter((a) => a.stage === stage).map((app) => (
                    <div className="candidate-card" key={app.id}>
                      <strong>{(app.profiles as any)?.full_name || (app.profiles as any)?.email || "Kandidat"}</strong>
                      <p>{(app.jobs as any)?.title}</p>
                      {app.cover_letter && <p className="cover-letter-preview">{app.cover_letter.slice(0, 200)}{app.cover_letter.length > 200 ? "..." : ""}</p>}
                      <div className="candidate-cv-summary">
                        <strong>Biografija</strong>
                        <p>{(app.profiles as any)?.cv_data?.summary || "Kandidat još nije upisao kratak opis."}</p>
                        <p>{[(app.profiles as any)?.phone, (app.profiles as any)?.city].filter(Boolean).join(" — ")}</p>
                      </div>
                      <div className="candidate-actions">
                        {stageOrder.map((target) => (
                          <button
                            className={`btn ghost xs${app.stage === target ? " active" : ""}`}
                            key={target}
                            onClick={() => moveStage(app.id, target)}
                          >
                            {stageLabels[target]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {noticeEl}
      </section>
    );
  }

  if (view === "billing") {
    return (
      <section>
        <div className="section-head">
          <div>
            <span className="page-label">Pretplata</span>
            <h1>Planovi i uplata</h1>
            <p className="sub">Izaberi plan, uplati ručno i pošalji dokaz.</p>
          </div>
        </div>
        <div className="notice-card">
          <strong>Podaci za uplatu</strong>
          <p>Primalac: imaposla.me</p>
          <p>Svrha: Aktivacija plana za firmu {company.name}</p>
          <p>Nakon slanja dokaza, sistem pravi poziv na broj i admin potvrđuje uplatu.</p>
        </div>
        <div className="grid three with-top-space">
          {plans.map((plan) => (
            <form className="plan-card" key={plan.id} onSubmit={(e) => orderPlan(plan, e)}>
              <h2>{plan.name}</h2>
              <div className="plan-price">{plan.price_eur} EUR</div>
              <ul className="plan-features">{plan.features?.map((f) => <li key={f}>{f}</li>)}</ul>
              <label><span className="label">Dokaz uplate (slika ili PDF, max 10MB)</span><input className="field" name="proof" type="file" accept="image/*,.pdf" required /></label>
              <label><span className="label">Napomena</span><input className="field" name="note" placeholder="Broj transakcije ili dodatna napomena" /></label>
              <button className="btn blue sm" disabled={saving}>{saving ? "Slanje..." : "Pošalji dokaz"}</button>
            </form>
          ))}
        </div>
        <div className="section-head"><div><span className="page-label">Status</span><h1>Moje uplate</h1></div></div>
        <div className="table-card">
          {orders.map((order) => (
            <div className="table-row" key={order.id}>
              <div><strong>{order.payment_reference}</strong><small>{order.plans?.name || "Plan"}</small></div>
              <div>{order.amount_eur} EUR</div>
              <div>{order.status}</div>
              <div>{order.activation_code || "Čeka potvrdu"}</div>
            </div>
          ))}
          {!orders.length ? (
            <div className="empty">
              <strong>Nema uplata</strong>
              <p>Prva uplata će se prikazati kada pošalješ dokaz.</p>
            </div>
          ) : null}
        </div>
        {proofs.length ? <p className="notice">Poslato dokaza za uplatu: {proofs.length}</p> : null}
        {noticeEl}
      </section>
    );
  }

  // view === "jobs"
  return (
    <section>
      <div className="section-head">
        <div><span className="page-label">Oglasi</span><h1>Oglasi firme</h1></div>
      </div>
      <div className="table-card">
        {jobs.map((job) => (
          <div className="table-row" key={job.id}>
            <div><strong>{job.title}</strong><small>{job.description?.slice(0, 80)}{job.description && job.description.length > 80 ? "..." : ""}</small></div>
            <div>{job.cities?.name || "Bez grada"}</div>
            <div>{job.categories?.name || "Bez kategorije"}</div>
            <div>{job.status}</div>
          </div>
        ))}
        {!jobs.length ? (
          <div className="empty">
            <strong>Nema oglasa</strong>
            <p>Pošalji prvi oglas na odobrenje.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
