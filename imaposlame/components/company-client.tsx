"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { stageLabels, stageOrder } from "@/lib/labels";
import type { Company, Job, JobApplication, Plan } from "@/types/domain";

export function CompanyClient({ view }: { view: "dashboard" | "jobs" | "new-job" | "selection" | "billing" }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabase();

  async function load() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return (window.location.href = "/login");
    const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile.data?.role !== "company" && profile.data?.role !== "admin") return (window.location.href = "/profil");
    const companyResult = await supabase.from("companies").select("*").eq("owner_id", user.id).maybeSingle();
    const myCompany = companyResult.data as Company | null;
    setCompany(myCompany);
    if (myCompany) {
      const [jobRows, appRows, planRows] = await Promise.all([
        supabase.from("jobs").select("*,companies(id,name,slug),categories(id,name),cities(id,name)").eq("company_id", myCompany.id).order("created_at", { ascending: false }),
        supabase.from("job_applications").select("*,jobs!inner(id,title,company_id),profiles(full_name,email,phone,city,cv_data,cv_updated_at)").eq("jobs.company_id", myCompany.id).order("created_at", { ascending: false }),
        supabase.from("plans").select("*").order("price_eur")
      ]);
      setJobs((jobRows.data || []) as Job[]);
      setApplications((appRows.data || []) as JobApplication[]);
      setPlans((planRows.data || []) as Plan[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveCompany(formData: FormData) {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return;
    const name = String(formData.get("name") || "");
    const row = {
      owner_id: user.id,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      city: String(formData.get("city") || ""),
      industry: String(formData.get("industry") || ""),
      description: String(formData.get("description") || "")
    };
    const result = company ? await supabase.from("companies").update(row).eq("id", company.id) : await supabase.from("companies").insert(row);
    setMessage(result.error?.message || "Profil firme je sačuvan.");
    await load();
  }

  async function createJob(formData: FormData) {
    if (!company) return setMessage("Prvo kreiraj profil firme.");
    const title = String(formData.get("title") || "");
    const row = {
      company_id: company.id,
      title,
      slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      description: String(formData.get("description") || ""),
      contract_type: String(formData.get("contract_type") || ""),
      salary_text: String(formData.get("salary_text") || ""),
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

  async function orderPlan(plan: Plan) {
    if (!company) return;
    const result = await supabase.from("orders").insert({ company_id: company.id, plan_id: plan.id, status: "pending", amount_eur: plan.price_eur, payment_reference: `IP-${Date.now()}` });
    setMessage(result.error?.message || "Narudžba je kreirana. Pošalji dokaz o uplati iz postojećeg live toka ili dodaj upload u ovoj Next verziji.");
  }

  if (loading) return <div className="panel"><h1>Učitavanje</h1><p className="lead">Spremamo firmu.</p></div>;

  if (!company || view === "dashboard") {
    return (
      <section>
        <div className="section-head"><div><span className="page-label">Firma</span><h1>Pregled firme</h1><p className="sub">Profil firme, oglasi i prijave.</p></div></div>
        <form className="form-card" action={saveCompany}>
          <label><span className="label">Naziv firme</span><input className="field" name="name" defaultValue={company?.name || ""} required /></label>
          <div className="form-grid"><label><span className="label">Grad</span><input className="field" name="city" defaultValue={company?.city || ""} /></label><label><span className="label">Djelatnost</span><input className="field" name="industry" defaultValue={company?.industry || ""} /></label></div>
          <label><span className="label">Opis</span><textarea className="textarea" name="description" defaultValue={company?.description || ""} /></label>
          <button className="btn blue">Sačuvaj profil firme</button>
          {message ? <p className="notice">{message}</p> : null}
        </form>
      </section>
    );
  }

  if (view === "new-job") {
    return (
      <section>
        <div className="section-head"><div><span className="page-label">Firma</span><h1>Novi oglas</h1><p className="sub">Oglas ide na pregled prije javnog prikaza.</p></div></div>
        <form className="form-card" action={createJob}>
          <input className="field" name="title" placeholder="npr. Konobar/konobarica" required />
          <div className="form-grid"><input className="field" name="contract_type" placeholder="Stalni rad, sezonski..." /><input className="field" name="salary_text" placeholder="Plata / po dogovoru" /></div>
          <input className="field" type="date" name="deadline" />
          <textarea className="textarea" name="description" placeholder="Opis posla, uslovi, šta nudite..." required />
          <button className="btn blue">Pošalji na odobrenje</button>
          {message ? <p className="notice">{message}</p> : null}
        </form>
      </section>
    );
  }

  if (view === "selection") {
    return (
      <section>
        <div className="selection-intro"><span className="kicker">Selekcija prijava</span><h1>Pregled kandidata po fazama</h1><p>Firma vidi prijave na svoje oglase i vodi ih kroz faze.</p></div>
        <div className="kanban-wrap"><div className="kanban">{stageOrder.map((stage) => <div className="kanban-column" key={stage}><div className="kanban-head"><h4>{stageLabels[stage]}</h4><span className="badge gray">{applications.filter((app) => app.stage === stage).length}</span></div>{applications.filter((app) => app.stage === stage).map((app) => <div className="candidate-card" key={app.id}><strong>{app.profiles?.full_name || app.profiles?.email || "Kandidat"}</strong><p>{app.jobs?.title}</p><p>{app.cover_letter}</p><div className="candidate-cv-summary"><strong>Biografija</strong><p>{app.profiles?.cv_data?.summary || "Kandidat još nije upisao kratak opis."}</p></div><div className="candidate-actions">{stageOrder.map((target) => <button className="btn ghost xs" key={target} onClick={() => moveStage(app.id, target)}>{stageLabels[target]}</button>)}</div></div>)}</div>)}</div></div>
        {message ? <p className="notice">{message}</p> : null}
      </section>
    );
  }

  if (view === "billing") {
    return <section><div className="section-head"><div><span className="page-label">Pretplata</span><h1>Planovi i uplata</h1><p className="sub">Izaberi plan i pošalji dokaz o uplati.</p></div></div><div className="grid three">{plans.map((plan) => <div className="plan-card" key={plan.id}><h2>{plan.name}</h2><div className="plan-price">{plan.price_eur} EUR</div><ul className="plan-features">{plan.features?.map((feature) => <li key={feature}>{feature}</li>)}</ul><button className="btn blue sm" onClick={() => orderPlan(plan)}>Naruči</button></div>)}</div>{message ? <p className="notice">{message}</p> : null}</section>;
  }

  return <section><div className="section-head"><div><span className="page-label">Oglasi</span><h1>Oglasi firme</h1></div></div><div className="table-card">{jobs.map((job) => <div className="table-row" key={job.id}><div><strong>{job.title}</strong><small>{job.description}</small></div><div>{job.status}</div><div>{job.salary_text}</div><div>{job.deadline}</div></div>)}</div></section>;
}
