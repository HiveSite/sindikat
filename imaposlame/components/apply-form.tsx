"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { normalizeRole } from "@/lib/auth-role";

export function ApplyForm({ jobId }: { jobId: number }) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("guest");
  const [message, setMessage] = useState("");
  const [duplicate, setDuplicate] = useState(false);
  const supabase = createBrowserSupabase();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setReady(true);
        return;
      }
      setUserId(user.id);
      const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setRole(normalizeRole(profile.data?.role || user.user_metadata?.role || "candidate"));
      const existing = await supabase.from("job_applications").select("id").eq("job_id", jobId).eq("candidate_id", user.id).maybeSingle();
      setDuplicate(Boolean(existing.data?.id));
      setReady(true);
    }
    load();
  }, [jobId, supabase]);

  async function submit(formData: FormData) {
    setMessage("");
    const profile = await supabase.from("profiles").select("full_name,phone,city,cv_data").eq("id", userId).maybeSingle();
    const cv = profile.data?.cv_data || {};
    const hasCv = Boolean(cv.summary || cv.experience || cv.skills || profile.data?.full_name || profile.data?.phone || profile.data?.city);
    if (!hasCv) {
      setMessage("Prvo dopuni biografiju u profilu, pa posalji prijavu.");
      return;
    }
    const row = {
      job_id: jobId,
      candidate_id: userId,
      cover_letter: String(formData.get("cover_letter") || ""),
      cv_path: null,
      reference_code: `IP-${Date.now()}`
    };
    const { error } = await supabase.from("job_applications").insert(row);
    if (error) return setMessage(error.message);
    window.location.href = "/profil/prijave";
  }

  if (!ready) return <p className="notice">Provjeravamo nalog...</p>;
  if (!userId) return <div className="empty"><strong>Prijava zahtijeva nalog</strong><p>Prijavi se kao kandidat i dopuni biografiju.</p><Link className="btn blue" href="/login">Prijava</Link></div>;
  if (role !== "candidate") return <div className="empty"><strong>Samo kandidat moze poslati prijavu</strong><p>Ako koristis nalog firme, ovaj oglas mozes samo pregledati.</p></div>;
  if (duplicate) return <p className="notice">Za ovaj oglas vec postoji tvoja prijava. Status prati u Moje prijave.</p>;

  return (
    <form action={submit} className="apply-form">
      <label><span className="label">Poruka firmi</span><textarea className="textarea" name="cover_letter" maxLength={1200} placeholder="Kratko predstavljanje, iskustvo i dostupnost" /></label>
      <p className="notice">Prijava koristi biografiju iz profila. Fajlovi se ne salju i ne cuvaju.</p>
      <button className="btn blue">Posalji prijavu</button>
      {message ? <p className="notice">{message}</p> : null}
    </form>
  );
}
