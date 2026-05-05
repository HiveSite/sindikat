"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { slugify } from "@/lib/format";
import { stageLabels, stageOrder } from "@/lib/labels";
import type { Company, Job, JobApplication, LookupItem, Order, PaymentProof, Plan } from "@/types/domain";

export function CompanyClient({ view }: { view: "dashboard" | "jobs" | "new-job" | "selection" | "billing" }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cities, setCities] = useState<LookupItem[]>([]);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabase();

  async function load() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return (window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`);
    const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile.data?.role !== "company" && profile.data?.role !== "admin") return (window.location.href = "/profil");

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

  useEffect(() => { load(); }, []);

  async function saveCompany(formData: FormData) {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return;
    const name = String(formData.get("name") || "").trim();
    if (!name) return setMessage("Upisi naziv firme.");
    const row = {
      owner_id: user.id,
      name,
      slug: company?.slug || `${slugify(name)}-${user.id.slice(0, 8)}`,
      city: String(formData.get("city") || "").trim(),
      industry: String(formData.get("industry") || "").trim(),
      description: String(formData.get("description") || "").trim()
    };
    const result = company ? await supabase.from("companies").update(row).eq("id", company.id) : await supabase.from("companies").insert(row);
    setMessage(result.error?.message || "Profil firme je sacuvan i ceka odobrenje ako je nov.");
    await load();
  }

  async function createJob(formData: FormData) {
    if (!company) return setMessage("Prvo kreiraj profil firme.");
    if (!company.approved) return setMessage("Profil firme mora biti odobren prije slanja oglasa.");
    const title = String(formData.get("title") || "").trim();
    const categoryId = Number(formData.get("category_id"));
    const cityId = Number(formData.get("city_id"));
    if (!title) return setMessage("Upisi naziv pozicije.");
    if (!categoryId || !cityId) return setMessage("Izaberi grad i kategoriju prije slanja oglasa.");
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
    const result = await supabase.from("jobs").insert(row);
    setMessage(result.error?.message || "Oglas je poslat na odobrenje.");
    await load();
  }

  async function moveStage(id: number, next: string) {
    const result = await supabase.from("job_applications").update({ stage: next }).eq("id", id);
    setMessage(result.error?.message || "Status prijave je promijenjen.");
    await load();
  }

  async function orderPlan(plan: Plan, formData: FormData) {
    if (!company) return;
    const file = formData.get("proof");
    if (!(file instanceof File) || !file.size) return setMessage("Dodaj dokaz uplate prije slanja.");

    const orderResult = await supabase.from("orders").insert({
      company_id: company.id,
      plan_id: plan.id,
      status: "pending",
      amount_eur: plan.price_eur,
      payment_reference: `IP-${Date.now()}`
    }).select("id,payment_reference").single();
    if (orderResult.error || !orderResult.data) return setMessage(orderResult.error?.message || "Narudzba nije kreirana.");

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const filePath = `${company.id}/${orderResult.data.id}-${Date.now()}-${safeName}`;
    const upload = await supabase.storage.from("payment-proofs").upload(filePath, file, { upsert: false });
    if (upload.error) {
      await supabase.from("orders").delete().eq("id", orderResult.data.id).eq("status", "pending");
      return setMessage(`Dokaz nije poslat: ${upload.error.message}`);
    }

    const proofResult = await supabase.from("payment_proofs").insert({
      order_id: orderResult.data.id,
      company_id: company.id,
      amount_eur: plan.price_eur,
      file_path: filePath,
      note: String(formData.get("note") || "").trim() || null,
      status: "pending"
    });
    if (proofResult.error) {
      await supabase.storage.from("payment-proofs").remove([filePath]);
      await supabase.from("orders").delete().eq("id", orderResult.data.id).eq("status", "pending");
      return setMessage(`Dokaz nije sacuvan: ${proofResult.error.message}`);
    }

    setMessage(`Dokaz je poslat. Poziv na broj: ${orderResult.data.payment_reference}`);
    await load();
  }

  if (loading) return <div className="panel"><h1>Ucitavanje</h1><p className="lead">Spremamo firmu.</p></div>;

  if (!company || view === "dashboard") {
    return (
      <section>
        <div className="section-head"><div><span className="page-label">Firma</span><h1>Pregled firme</h1><p className="sub">Profil firme, oglasi i prijave.</p></div></div>
        <form className="form-card" action={saveCompany}>
          <label><span className="label">Naziv firme</span><input className="field" name="name" defaultValue={company?.name || ""} required /></label>
          <div className="form-grid"><label><span className="label">Grad</span><input className="field" name="city" defaultValue={company?.city || ""} /></label><label><span className="label">Djelatnost</span><input className="field" name="industry" defaultValue={company?.industry || ""} /></label></div>
          <label><span className="label">Opis</span><textarea className="textarea" name="description" defaultValue={company?.description || ""} /></label>
          <button className="btn blue">Sacuvaj profil firme</button>
          {company && !company.approved ? <p className="notice">Profil firme ceka odobrenje prije javnog prikaza i slanja oglasa.</p> : null}
          {message ? <p className="notice">{message}</p> : null}
        </form>
      </section>
    );
  }

  if (view === "new-job") {
    return (
      <section>
        <div className="section-head"><div><span className="page-label">Firma</span><h1>Novi oglas</h1><p className="sub">Oglas ide na pregled prije javnog prikaza.</p></div></div>
        {!company.approved ? <p className="notice">Profil firme ceka odobrenje. Oglas mozes poslati nakon odobrenja.</p> : null}
        <form className="form-card" action={createJob}>
          <input className="field" name="title" placeholder="npr. Konobar/konobarica" required />
          <div className="form-grid">
            <label><span className="label">Grad</span><select className="select" name="city_id" required><option value="">Izaberi grad</option>{cities.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}</select></label>
            <label><span className="label">Kategorija</span><select className="select" name="category_id" required><option value="">Izaberi kategoriju</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
          </div>
          <div className="form-grid"><input className="field" name="contract_type" placeholder="Stalni rad, sezonski..." /><input className="field" name="salary_text" placeholder="Plata / po dogovoru" /></div>
          <input className="field" type="date" name="deadline" />
          <textarea className="textarea" name="description" placeholder="Opis posla, uslovi, sta nudite..." required />
          <button className="btn blue">Posalji na odobrenje</button>
          {message ? <p className="notice">{message}</p> : null}
        </form>
      </section>
    );
  }

  if (view === "selection") {
    return (
      <section>
        <div className="selection-intro"><span className="kicker">Selekcija prijava</span><h1>Pregled kandidata po fazama</h1><p>Firma vidi prijave na svoje oglase i vodi ih kroz faze.</p></div>
        <div className="kanban-wrap"><div className="kanban">{stageOrder.map((stage) => <div className="kanban-column" key={stage}><div className="kanban-head"><h4>{stageLabels[stage]}</h4><span className="badge gray">{applications.filter((app) => app.stage === stage).length}</span></div>{applications.filter((app) => app.stage === stage).map((app) => <div className="candidate-card" key={app.id}><strong>{app.profiles?.full_name || app.profiles?.email || "Kandidat"}</strong><p>{app.jobs?.title}</p><p>{app.cover_letter}</p><div className="candidate-cv-summary"><strong>Biografija</strong><p>{app.profiles?.cv_data?.summary || "Kandidat jos nije upisao kratak opis."}</p><p>{[app.profiles?.phone, app.profiles?.city].filter(Boolean).join(" - ")}</p></div><div className="candidate-actions">{stageOrder.map((target) => <button className="btn ghost xs" key={target} onClick={() => moveStage(app.id, target)}>{stageLabels[target]}</button>)}</div></div>)}</div>)}</div></div>
        {message ? <p className="notice">{message}</p> : null}
      </section>
    );
  }

  if (view === "billing") {
    return (
      <section>
        <div className="section-head"><div><span className="page-label">Pretplata</span><h1>Planovi i uplata</h1><p className="sub">Izaberi plan, uplati rucno i posalji dokaz.</p></div></div>
        <div className="notice"><strong>Podaci za uplatu</strong><br />Primalac: imaposla.me<br />Svrha: Aktivacija plana za firmu {company.name}<br />Nakon slanja dokaza sistem pravi poziv na broj i admin potvrdjuje uplatu.</div>
        <div className="grid three with-top-space">
          {plans.map((plan) => (
            <form className="plan-card" key={plan.id} action={(formData) => orderPlan(plan, formData)}>
              <h2>{plan.name}</h2>
              <div className="plan-price">{plan.price_eur} EUR</div>
              <ul className="plan-features">{plan.features?.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <label><span className="label">Dokaz uplate</span><input className="field" name="proof" type="file" accept="image/*,.pdf" required /></label>
              <label><span className="label">Napomena</span><input className="field" name="note" placeholder="Broj transakcije ili dodatna napomena" /></label>
              <button className="btn blue sm">Posalji dokaz</button>
            </form>
          ))}
        </div>
        <div className="section-head"><div><span className="page-label">Status</span><h1>Moje uplate</h1></div></div>
        <div className="table-card">
          {orders.map((order) => <div className="table-row" key={order.id}><div><strong>{order.payment_reference}</strong><small>{order.plans?.name || "Plan"}</small></div><div>{order.amount_eur} EUR</div><div>{order.status}</div><div>{order.activation_code || "Ceka potvrdu"}</div></div>)}
          {!orders.length ? <div className="empty"><strong>Nema uplata</strong><p>Prva uplata ce se prikazati kada posaljes dokaz.</p></div> : null}
        </div>
        {proofs.length ? <p className="notice">Poslato dokaza za uplatu: {proofs.length}</p> : null}
        {message ? <p className="notice">{message}</p> : null}
      </section>
    );
  }

  return <section><div className="section-head"><div><span className="page-label">Oglasi</span><h1>Oglasi firme</h1></div></div><div className="table-card">{jobs.map((job) => <div className="table-row" key={job.id}><div><strong>{job.title}</strong><small>{job.description}</small></div><div>{job.cities?.name || "Bez grada"}</div><div>{job.categories?.name || "Bez kategorije"}</div><div>{job.status}</div></div>)}</div></section>;
}
