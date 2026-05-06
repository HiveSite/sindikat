"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { CvData } from "@/types/domain";

const emptyCv: CvData = {
  fullName: "", title: "", city: "", phone: "", email: "",
  summary: "", skills: "", languages: "", experience: "",
  education: "", certificates: "", availability: ""
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function CvBuilder() {
  const [cv, setCv] = useState<CvData>(emptyCv);
  const [loadStatus, setLoadStatus] = useState("Učitavanje biografije...");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [supabase] = useState(() => createBrowserSupabase());
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setLoadStatus("Prijavi se da bi biografija bila sačuvana u profilu.");
        return;
      }
      const user = data.user;
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("cv_data,full_name,phone,city,email")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) console.error("[CvBuilder:load]", profileError.message);

      const remote = profileData;
      setCv({
        ...emptyCv,
        ...(remote?.cv_data || {}),
        fullName: remote?.cv_data?.fullName || remote?.full_name || "",
        phone: remote?.cv_data?.phone || remote?.phone || "",
        city: remote?.cv_data?.city || remote?.city || "",
        email: remote?.cv_data?.email || remote?.email || user.email || ""
      });
      setLoadStatus("Biografija je učitana iz profila.");
    }
    load();
  }, [supabase]);

  const skills = useMemo(
    () => (cv.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
    [cv.skills]
  );

  function update(name: keyof CvData, value: string) {
    setCv((current) => ({ ...current, [name]: value.slice(0, 6000) }));
    setSaveStatus("idle");
    // Auto-save after 2s of inactivity
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => save(), 2000);
  }

  async function save() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) {
      setSaveStatus("error");
      setSaveMessage("Prijavi se da bi sačuvao biografiju.");
      return;
    }
    setSaveStatus("saving");
    const { error } = await supabase
      .from("profiles")
      .update({
        cv_data: cv,
        full_name: cv.fullName || null,
        phone: cv.phone || null,
        city: cv.city || null,
        cv_updated_at: new Date().toISOString()
      })
      .eq("id", data.user.id);

    if (error) {
      console.error("[CvBuilder:save]", error.message);
      setSaveStatus("error");
      setSaveMessage(error.message);
    } else {
      setSaveStatus("saved");
      setSaveMessage("Biografija je sačuvana.");
    }
  }

  function printCv() { window.print(); }

  const field = (name: keyof CvData, label: string, placeholder: string, textarea = false) => (
    <label key={name}>
      <span className="label">{label}</span>
      {textarea
        ? <textarea className="textarea" value={cv[name] || ""} placeholder={placeholder} onChange={(e) => update(name, e.target.value)} />
        : <input className="field" value={cv[name] || ""} placeholder={placeholder} onChange={(e) => update(name, e.target.value)} />
      }
    </label>
  );

  const saveLabel = saveStatus === "saving" ? "Čuvanje..." : saveStatus === "saved" ? "Sačuvano ✓" : "Sačuvaj";

  return (
    <section className="cv-builder-page">
      <div className="cv-builder-head">
        <div>
          <span className="page-label">Biografija</span>
          <h1>Napravi radnu biografiju bez slanja fajlova.</h1>
          <p>Popuni podatke jednom, pregledaj kako izgleda i skini PDF direktno iz sajta.</p>
          <p className="notice">{loadStatus}</p>
        </div>
        <div className="cv-head-actions">
          <button className="btn blue" onClick={printCv} type="button">Skini PDF</button>
          <button className="btn lime" onClick={save} type="button" disabled={saveStatus === "saving"}>{saveLabel}</button>
        </div>
      </div>

      {saveStatus === "error" && <p className="notice error">{saveMessage}</p>}

      <div className="cv-builder-grid">
        <form className="cv-builder-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <div className="form-grid">
            {field("fullName", "Ime i prezime", "npr. Marko Marković")}
            {field("title", "Zanimanje", "npr. Konobar, recepcioner")}
          </div>
          <div className="form-grid">
            {field("city", "Grad", "npr. Podgorica")}
            {field("phone", "Telefon", "+382 ...")}
          </div>
          {field("email", "E-pošta", "ime@email.com")}
          {field("summary", "Kratak opis", "Ko si, šta znaš i kakav posao tražiš.", true)}
          {field("skills", "Vještine", "Odvoji zarezom: rad sa gostima, engleski, kasa...", true)}
          {field("experience", "Radno iskustvo", "Firma, pozicija, period i odgovornosti.", true)}
          {field("education", "Obrazovanje", "Škola, kurs, fakultet ili praktična obuka.", true)}
          {field("languages", "Jezici", "npr. srpski maternji, engleski B2...", true)}
          {field("certificates", "Sertifikati i obuke", "Kursevi, licence, obuke.", true)}
          {field("availability", "Dostupnost", "Od kada možeš da počneš, smjene, sezona...", true)}
          <button className="btn lime" type="submit" disabled={saveStatus === "saving"}>{saveLabel}</button>
        </form>

        <article className="cv-preview">
          <header>
            <div>
              <span>Biografija</span>
              <h2>{cv.fullName || "Ime i prezime"}</h2>
              <p>{cv.title || "Pozicija / zanimanje"}</p>
            </div>
            <aside>
              {cv.city || "Grad"}<br />
              {cv.phone || "Telefon"}<br />
              {cv.email || "E-pošta"}
            </aside>
          </header>
          {cv.summary ? <section><h3>Kratak opis</h3><p>{cv.summary}</p></section> : null}
          {skills.length ? <section><h3>Vještine</h3><div className="cv-skill-list">{skills.map((s) => <span key={s}>{s}</span>)}</div></section> : null}
          {cv.experience ? <section><h3>Iskustvo</h3><p>{cv.experience}</p></section> : null}
          {cv.education ? <section><h3>Obrazovanje</h3><p>{cv.education}</p></section> : null}
          {cv.languages ? <section><h3>Jezici</h3><p>{cv.languages}</p></section> : null}
          {cv.certificates ? <section><h3>Sertifikati</h3><p>{cv.certificates}</p></section> : null}
          {cv.availability ? <section><h3>Dostupnost</h3><p>{cv.availability}</p></section> : null}
        </article>
      </div>
    </section>
  );
}
