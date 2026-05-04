"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { CvData } from "@/types/domain";

const emptyCv: CvData = { fullName: "", title: "", city: "", phone: "", email: "", summary: "", skills: "", languages: "", experience: "", education: "", certificates: "", availability: "" };

export function CvBuilder() {
  const [cv, setCv] = useState<CvData>(emptyCv);
  const [status, setStatus] = useState("Učitavanje biografije...");
  const supabase = createBrowserSupabase();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setStatus("Prijavi se da bi biografija bila sačuvana u profilu.");
        return;
      }
      const profile = await supabase.from("profiles").select("cv_data,full_name,phone,city,email").eq("id", user.id).maybeSingle();
      const remote = profile.data;
      setCv({
        ...emptyCv,
        ...(remote?.cv_data || {}),
        fullName: remote?.cv_data?.fullName || remote?.full_name || "",
        phone: remote?.cv_data?.phone || remote?.phone || "",
        city: remote?.cv_data?.city || remote?.city || "",
        email: remote?.cv_data?.email || remote?.email || user.email || ""
      });
      setStatus("Biografija je učitana iz profila.");
    }
    load();
  }, []);

  const skills = useMemo(() => (cv.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean), [cv.skills]);

  function update(name: keyof CvData, value: string) {
    setCv((current) => ({ ...current, [name]: value.slice(0, 6000) }));
  }

  async function save() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return setStatus("Prijavi se da bi sačuvao biografiju.");
    const { error } = await supabase.from("profiles").update({ cv_data: cv, full_name: cv.fullName || null, phone: cv.phone || null, city: cv.city || null, cv_updated_at: new Date().toISOString() }).eq("id", user.id);
    setStatus(error ? error.message : "Biografija je sačuvana u profilu.");
  }

  function printCv() {
    window.print();
  }

  const field = (name: keyof CvData, label: string, placeholder: string, textarea = false) => (
    <label>
      <span className="label">{label}</span>
      {textarea ? <textarea className="textarea" value={cv[name] || ""} placeholder={placeholder} onChange={(event) => update(name, event.target.value)} /> : <input className="field" value={cv[name] || ""} placeholder={placeholder} onChange={(event) => update(name, event.target.value)} />}
    </label>
  );

  return (
    <section className="cv-builder-page">
      <div className="cv-builder-head">
        <div>
          <span className="page-label">Biografija</span>
          <h1>Napravi radnu biografiju bez slanja fajlova.</h1>
          <p>Popuni podatke jednom, pregledaj kako izgleda i skini PDF direktno iz sajta.</p>
        </div>
        <div className="cv-head-actions">
          <button className="btn blue" onClick={printCv}>Skini PDF</button>
          <button className="btn lime" onClick={save}>Sačuvaj</button>
        </div>
      </div>
      <div className="cv-builder-grid">
        <form className="cv-builder-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
          <div className="form-grid">{field("fullName", "Ime i prezime", "npr. Marko Marković")}{field("title", "Zanimanje", "npr. Konobar, recepcioner")}</div>
          <div className="form-grid">{field("city", "Grad", "npr. Podgorica")}{field("phone", "Telefon", "+382 ...")}</div>
          {field("email", "E-pošta", "ime@email.com")}
          {field("summary", "Kratak opis", "Ko si, šta znaš i kakav posao tražiš.", true)}
          {field("skills", "Vještine", "Odvoji zarezom: rad sa gostima, engleski, kasa...", true)}
          {field("experience", "Radno iskustvo", "Firma, pozicija, period i odgovornosti.", true)}
          {field("education", "Obrazovanje", "Škola, kurs, fakultet ili praktična obuka.", true)}
          {field("languages", "Jezici", "npr. srpski maternji, engleski B2...", true)}
          {field("certificates", "Sertifikati i obuke", "Kursevi, licence, obuke.", true)}
          {field("availability", "Dostupnost", "Od kada možeš da počneš, smjene, sezona...", true)}
          <p className="notice">{status}</p>
        </form>
        <article className="cv-preview">
          <header>
            <div><span>Biografija</span><h2>{cv.fullName || "Ime i prezime"}</h2><p>{cv.title || "Pozicija / zanimanje"}</p></div>
            <aside>{cv.city || "Grad"}<br />{cv.phone || "Telefon"}<br />{cv.email || "E-pošta"}</aside>
          </header>
          {cv.summary ? <section><h3>Kratak opis</h3><p>{cv.summary}</p></section> : null}
          {skills.length ? <section><h3>Vještine</h3><div className="cv-skill-list">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section> : null}
          {cv.experience ? <section><h3>Iskustvo</h3><p>{cv.experience}</p></section> : null}
          {cv.education ? <section><h3>Obrazovanje</h3><p>{cv.education}</p></section> : null}
          {cv.languages ? <section><h3>Jezici</h3><p>{cv.languages}</p></section> : null}
          {cv.availability ? <section><h3>Dostupnost</h3><p>{cv.availability}</p></section> : null}
        </article>
      </div>
    </section>
  );
}
